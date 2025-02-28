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
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHandlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  
  const {
    onOpen,
    onClose,
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    autoReconnect = true
  } = options;

  // Connect to WebSocket server
  const connect = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    // Determine protocol based on current connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connection opened");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        if (onOpen) onOpen();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
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
        console.log("WebSocket connection closed:", event.code, event.reason);
        setIsConnected(false);
        if (onClose) onClose();
        
        // Attempt to reconnect if enabled
        if (autoReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${reconnectAttempts})...`);
            connect();
          }, reconnectInterval);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (onError) onError(error);
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }
  }, [onOpen, onClose, onError, reconnectAttempts, reconnectInterval, autoReconnect]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  // Send message to WebSocket server
  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // Subscribe to message type
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, new Set());
    }
    messageHandlersRef.current.get(type)?.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlersRef.current.delete(type);
        }
      }
    };
  }, []);

  // Initialize connection on component mount
  useEffect(() => {
    connect();

    // Cleanup on component unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    connect,
    disconnect
  };
}

export default useWebSocket;
