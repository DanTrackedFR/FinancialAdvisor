/**
 * Advanced WebSocket connection handler for Replit environments
 * This script is loaded separately to avoid bundling issues
 */

(function() {
  // Global variables for WebSocket state tracking
  let socket = null;
  let isConnected = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 5;
  
  // Connection strategies for Replit environments
  let currentStrategy = 0;
  const connectionStrategies = [];
  
  /**
   * Initialize the WebSocket connection handler
   */
  function initialize() {
    console.log('WebSocket handler initialized');
    
    // Set up connection strategies for Replit
    setupConnectionStrategies();
    
    // Add global methods
    window.WebSocketHandler = {
      connect: connect,
      disconnect: disconnect,
      sendMessage: sendMessage,
      isConnected: () => isConnected,
      getConnectionState: getConnectionState
    };
    
    // Attempt connection on load
    setTimeout(connect, 1000);
  }
  
  /**
   * Set up possible WebSocket connection URLs for Replit
   */
  function setupConnectionStrategies() {
    // Determine protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Add strategies in order of most likely to work
    // Strategy 1: Hostname only (no port)
    connectionStrategies.push(`${protocol}//${window.location.hostname}/ws`);
    
    // Strategy 2: Full origin with protocol conversion
    const originBase = window.location.origin.replace(/^http/, '');
    connectionStrategies.push(`${protocol}${originBase}/ws`);
    
    // Strategy 3: Full host (may include port)
    connectionStrategies.push(`${protocol}//${window.location.host}/ws`);
    
    console.log('WebSocket connection strategies:', connectionStrategies);
  }
  
  /**
   * Connect to the WebSocket server
   */
  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('Already connected or connecting');
      return;
    }
    
    // Use the current connection strategy
    const wsUrl = connectionStrategies[currentStrategy];
    console.log(`Attempting WebSocket connection with strategy #${currentStrategy + 1}: ${wsUrl}`);
    
    try {
      socket = new WebSocket(wsUrl);
      
      socket.onopen = function() {
        console.log('WebSocket connection established');
        isConnected = true;
        reconnectAttempts = 0;
        
        // Dispatch connection event
        const event = new CustomEvent('websocket-connected', { detail: { url: wsUrl } });
        window.dispatchEvent(event);
        
        // Send a test ping
        sendMessage({ type: 'ping', timestamp: Date.now() });
      };
      
      socket.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Dispatch message event
          const messageEvent = new CustomEvent('websocket-message', { detail: { data } });
          window.dispatchEvent(messageEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onclose = function() {
        console.log('WebSocket connection closed');
        isConnected = false;
        
        // Dispatch disconnection event
        const event = new CustomEvent('websocket-disconnected');
        window.dispatchEvent(event);
        
        // Try next strategy if available
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          
          // Try the next strategy
          currentStrategy = (currentStrategy + 1) % connectionStrategies.length;
          
          console.log(`Will try connection strategy #${currentStrategy + 1} in 3 seconds`);
          reconnectTimer = setTimeout(connect, 3000);
        } else {
          console.log('Maximum reconnection attempts reached');
        }
      };
      
      socket.onerror = function(error) {
        console.error('WebSocket error:', error);
        
        // Dispatch error event
        const event = new CustomEvent('websocket-error', { detail: { error } });
        window.dispatchEvent(event);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    if (socket) {
      socket.close();
      socket = null;
      isConnected = false;
    }
  }
  
  /**
   * Send a message through the WebSocket
   */
  function sendMessage(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    
    console.log('Cannot send message - not connected');
    return false;
  }
  
  /**
   * Get detailed connection state
   */
  function getConnectionState() {
    if (!socket) return 'disconnected';
    
    switch (socket.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
  
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();