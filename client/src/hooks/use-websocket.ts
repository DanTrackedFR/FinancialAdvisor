import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

type MessageHandler = (data: any) => void;

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoReconnect?: boolean;
  enableDebugLogs?: boolean;
}

// Singleton WebSocket instance and related state
let globalSocket: WebSocket | null = null;
let globalIsConnected = false;
let globalConnectionAttempts = 0;
let globalReconnectAttempts = 0;
const globalMessageHandlers = new Map<string, Set<MessageHandler>>();
let reconnectTimeout: NodeJS.Timeout | null = null;
let isConnecting = false;

// Create a WebSocket connection
const createWebSocketConnection = (
  onOpenCallbacks: Set<() => void>,
  onCloseCallbacks: Set<() => void>,
  onErrorCallbacks: Set<(error: Event) => void>,
  reconnectAttemptsLimit: number,
  reconnectIntervalTime: number
) => {
  if (isConnecting || globalSocket?.readyState === WebSocket.CONNECTING) {
    console.log('[WebSocket] Connection already in progress, skipping duplicate attempt');
    return;
  }

  isConnecting = true;

  // Close existing connection if any
  if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
    globalSocket.close();
  }

  globalConnectionAttempts++;
  console.log(`[WebSocket] Connection attempt #${globalConnectionAttempts}`);

  // Determine protocol based on current connection
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  console.log(`[WebSocket] Connecting to ${wsUrl}`);

  try {
    const socket = new WebSocket(wsUrl);
    globalSocket = socket;

    socket.onopen = () => {
      console.log("[WebSocket] Connection opened successfully");
      globalIsConnected = true;
      globalReconnectAttempts = 0;
      isConnecting = false;

      // Send an initial ping to verify the connection
      try {
        socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      } catch (error) {
        console.error("[WebSocket] Error sending initial ping:", error);
      }

      // Notify all subscribers
      onOpenCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error("[WebSocket] Error in onOpen callback:", error);
        }
      });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[WebSocket] Received message:", data.type);

        // Notify all handlers registered for this message type
        if (data.type && globalMessageHandlers.has(data.type)) {
          const handlers = globalMessageHandlers.get(data.type);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(data);
              } catch (error) {
                console.error(`[WebSocket] Error in message handler for ${data.type}:`, error);
              }
            });
          }
        }
      } catch (error) {
        console.error("[WebSocket] Error parsing message:", error);
      }
    };

    socket.onclose = (event) => {
      console.log(`[WebSocket] Connection closed: code=${event.code}, reason=${event.reason}`);
      globalIsConnected = false;
      isConnecting = false;

      // Notify all subscribers
      onCloseCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error("[WebSocket] Error in onClose callback:", error);
        }
      });

      // Attempt to reconnect if enabled
      if (globalReconnectAttempts < reconnectAttemptsLimit) {
        console.log(`[WebSocket] Reconnecting in ${reconnectIntervalTime}ms (attempt ${globalReconnectAttempts + 1}/${reconnectAttemptsLimit})`);

        // Clear any existing reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }

        reconnectTimeout = setTimeout(() => {
          globalReconnectAttempts += 1;
          createWebSocketConnection(
            onOpenCallbacks,
            onCloseCallbacks,
            onErrorCallbacks,
            reconnectAttemptsLimit,
            reconnectIntervalTime
          );
        }, reconnectIntervalTime);
      } else {
        console.log("[WebSocket] Maximum reconnect attempts reached. Giving up.");
      }
    };

    socket.onerror = (error) => {
      console.error("[WebSocket] Connection error:", error);
      isConnecting = false;

      // Notify all subscribers
      onErrorCallbacks.forEach(callback => {
        try {
          callback(error);
        } catch (err) {
          console.error("[WebSocket] Error in onError callback:", err);
        }
      });
    };
  } catch (error) {
    console.error("[WebSocket] Error creating connection:", error);
    isConnecting = false;
  }
};

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoReconnect = true,
    enableDebugLogs = true
  } = options;

  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  // Used to track if component is mounted
  const mountedRef = useRef(true);

  // Store callbacks in refs to avoid dependency changes causing re-renders
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onOpen, onClose, onError]);

  // Sets of callbacks for each socket event
  const onOpenCallbacksRef = useRef<Set<() => void>>(new Set());
  const onCloseCallbacksRef = useRef<Set<() => void>>(new Set());
  const onErrorCallbacksRef = useRef<Set<(error: Event) => void>>(new Set());

  // Update connection status from global state
  useEffect(() => {
    const updateConnectionStatus = () => {
      if (mountedRef.current) {
        setIsConnected(globalIsConnected);
      }
    };

    // Add our connection status callbacks
    const onOpenCallback = () => {
      updateConnectionStatus();
      if (onOpenRef.current) onOpenRef.current();
    };

    const onCloseCallback = () => {
      updateConnectionStatus();
      if (onCloseRef.current) onCloseRef.current();
    };

    const onErrorCallback = (error: Event) => {
      if (onErrorRef.current) onErrorRef.current(error);
    };

    onOpenCallbacksRef.current.add(onOpenCallback);
    onCloseCallbacksRef.current.add(onCloseCallback);
    onErrorCallbacksRef.current.add(onErrorCallback);

    // Initialize connection if not already connected
    if (!globalSocket || (globalSocket.readyState !== WebSocket.OPEN && globalSocket.readyState !== WebSocket.CONNECTING)) {
      createWebSocketConnection(
        onOpenCallbacksRef.current,
        onCloseCallbacksRef.current,
        onErrorCallbacksRef.current,
        reconnectAttempts,
        reconnectInterval
      );
    } else {
      // If already connected, set state accordingly
      setIsConnected(globalSocket.readyState === WebSocket.OPEN);
    }

    // Initialize the component with the current connection status
    updateConnectionStatus();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      onOpenCallbacksRef.current.delete(onOpenCallback);
      onCloseCallbacksRef.current.delete(onCloseCallback);
      onErrorCallbacksRef.current.delete(onErrorCallback);
    };
  }, [reconnectAttempts, reconnectInterval]);

  // Manually connect to the WebSocket server
  const connect = useCallback(() => {
    if (mountedRef.current) {
      createWebSocketConnection(
        onOpenCallbacksRef.current,
        onCloseCallbacksRef.current,
        onErrorCallbacksRef.current,
        reconnectAttempts,
        reconnectInterval
      );
    }
  }, [reconnectAttempts, reconnectInterval]);

  // Manually disconnect from the WebSocket server
  const disconnect = useCallback(() => {
    console.log("[WebSocket] Manual disconnect requested");

    // Clear any pending reconnection
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    // Close the socket if it exists
    if (globalSocket) {
      globalSocket.close();
      globalSocket = null;
    }

    // Update the state
    globalIsConnected = false;
    if (mountedRef.current) {
      setIsConnected(false);
    }
  }, []);

  // Send a message to the WebSocket server
  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (globalSocket && globalSocket.readyState === WebSocket.OPEN) {
      try {
        globalSocket.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error("[WebSocket] Error sending message:", error);
        return false;
      }
    }
    console.log("[WebSocket] Cannot send message - socket not connected");
    return false;
  }, []);

  // Subscribe to a specific message type
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    console.log(`[WebSocket] Subscribing to message type: ${type}`);

    if (!globalMessageHandlers.has(type)) {
      globalMessageHandlers.set(type, new Set());
    }

    globalMessageHandlers.get(type)?.add(handler);

    // Return unsubscribe function
    return () => {
      console.log(`[WebSocket] Unsubscribing from message type: ${type}`);
      const handlers = globalMessageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          globalMessageHandlers.delete(type);
        }
      }
    };
  }, []);

  // Get a detailed connection status
  const getConnectionStatus = useCallback(() => {
    if (!globalSocket) return "disconnected";

    switch (globalSocket.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "unknown";
    }
  }, []);

  // Check connection status and reconnect if needed
  const checkConnection = useCallback(() => {
    const status = getConnectionStatus();
    console.log(`[WebSocket] Connection check - current status: ${status}`);

    if (status !== "connected" && status !== "connecting") {
      console.log("[WebSocket] Connection check failed - attempting to reconnect");
      connect();
    }

    return status === "connected";
  }, [getConnectionStatus, connect]);

  // Set up a periodic connection check
  useEffect(() => {
    if (!autoReconnect) return;

    const checkInterval = setInterval(() => {
      if (mountedRef.current) {
        checkConnection();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(checkInterval);
    };
  }, [checkConnection, autoReconnect]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    connect,
    disconnect,
    checkConnection,
    getConnectionStatus,
    connectionDetails: {
      attempts: globalConnectionAttempts,
      reconnectAttempts: globalReconnectAttempts
    }
  };
}

export default useWebSocket;