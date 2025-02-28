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

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const mountedRef = useRef(true); // Track if component is mounted
  const connectionAttemptsRef = useRef(0);

  const {
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoReconnect = true,
    enableDebugLogs = true
  } = options;

  const debugLog = useCallback((message: string, ...args: any[]) => {
    if (enableDebugLogs) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }, [enableDebugLogs]);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    // Don't attempt connection if component is unmounted
    if (!mountedRef.current) return;

    // Close existing connection if any
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    connectionAttemptsRef.current++;
    debugLog(`Connection attempt #${connectionAttemptsRef.current}`);

    // Determine protocol based on current connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    debugLog(`Connecting to ${wsUrl}`);

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        // Don't update state if component is unmounted
        if (!mountedRef.current) return;

        debugLog("WebSocket connection opened successfully");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Send an initial ping to verify the connection
        socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));

        if (onOpen) onOpen();
      };

      socket.onmessage = (event) => {
        // Don't update state if component is unmounted
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);
          debugLog("Received message:", data);
          setLastMessage(data);

          // Notify all handlers registered for this message type
          if (data.type && messageHandlersRef.current.has(data.type)) {
            const handlers = messageHandlersRef.current.get(data.type);
            if (handlers) {
              handlers.forEach(handler => handler(data));
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = (event) => {
        // Don't update state if component is unmounted
        if (!mountedRef.current) return;

        debugLog(`WebSocket connection closed: code=${event.code}, reason=${event.reason}`);
        setIsConnected(false);
        if (onClose) onClose();

        // Attempt to reconnect if enabled
        if (autoReconnect && reconnectAttemptsRef.current < reconnectAttempts && mountedRef.current) {
          debugLog(`Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current + 1}/${reconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= reconnectAttempts) {
          debugLog("Maximum reconnect attempts reached. Giving up.");
        }
      };

      socket.onerror = (error) => {
        // Don't update state if component is unmounted
        if (!mountedRef.current) return;

        console.error("WebSocket error:", error);
        debugLog("WebSocket connection error");
        if (onError) onError(error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      debugLog("Failed to create WebSocket instance:", error);
    }
  }, [onOpen, onClose, onError, reconnectAttempts, reconnectInterval, autoReconnect, debugLog]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    debugLog("Manually disconnecting WebSocket");
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, [debugLog]);

  // Send message to WebSocket server
  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      debugLog("Sending message:", data);
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    debugLog("Cannot send message - socket not connected", data);
    return false;
  }, [debugLog]);

  // Subscribe to message type
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    debugLog(`Subscribing to message type: ${type}`);
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, new Set());
    }
    messageHandlersRef.current.get(type)?.add(handler);

    // Return unsubscribe function
    return () => {
      debugLog(`Unsubscribing from message type: ${type}`);
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(type);
        }
      }
    };
  }, [debugLog]);

  // Get connection status - more detailed than just boolean
  const getConnectionStatus = useCallback(() => {
    if (!socketRef.current) return "disconnected";

    switch (socketRef.current.readyState) {
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

  // Manually check connection and reconnect if needed
  const checkConnection = useCallback(() => {
    const status = getConnectionStatus();
    debugLog(`Connection check - current status: ${status}`);

    if (status !== "connected" && status !== "connecting") {
      debugLog("Connection check failed - attempting to reconnect");
      connect();
    }

    return status === "connected";
  }, [getConnectionStatus, connect, debugLog]);

  // Initialize connection on component mount
  useEffect(() => {
    debugLog("WebSocket hook initialized");
    mountedRef.current = true;
    connect();

    // Set up a periodic connection check
    const checkInterval = setInterval(() => {
      if (mountedRef.current) {
        checkConnection();
      }
    }, 10000); // Check every 10 seconds

    // Cleanup on component unmount
    return () => {
      debugLog("WebSocket hook unmounting");
      mountedRef.current = false;
      clearInterval(checkInterval);
      disconnect();
    };
  }, [connect, disconnect, checkConnection, debugLog]);

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
      attempts: connectionAttemptsRef.current,
      reconnectAttempts: reconnectAttemptsRef.current
    }
  };
}

export default useWebSocket;