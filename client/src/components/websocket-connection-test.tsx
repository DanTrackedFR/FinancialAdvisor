import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Wifi, WifiOff, Send, RefreshCw, Check, X } from "lucide-react";
import { useWebSocket } from '@/hooks/use-websocket';

type LogEntry = {
  id: string;
  type: 'sent' | 'received' | 'info' | 'error';
  message: string;
  timestamp: Date;
};

export function WebSocketConnectionTest() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [messageContent, setMessageContent] = useState('Hello server!');
  const [pingResult, setPingResult] = useState<{ success: boolean; time?: number } | null>(null);
  
  // Using our hook with the same configuration as the main app
  const { 
    isConnected, 
    sendMessage, 
    subscribe, 
    connect, 
    disconnect, 
    getConnectionStatus
  } = useWebSocket({
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    autoReconnect: true,
    enableDebugLogs: true,
    onOpen: () => addLog('info', 'WebSocket connection established'),
    onClose: () => addLog('info', 'WebSocket connection closed'),
    onError: (error) => addLog('error', `WebSocket error: ${error}`)
  });

  // Subscribe to messages
  useEffect(() => {
    // Subscribe to pong messages to measure ping time
    const unsubscribePong = subscribe('pong', (data) => {
      const sentTime = pingResult?.time || 0;
      const receivedTime = Date.now();
      const roundTripTime = receivedTime - sentTime;
      
      setPingResult({
        success: true,
        time: roundTripTime
      });
      
      addLog('received', `Pong received (${roundTripTime}ms)`);
    });

    // Subscribe to info messages
    const unsubscribeInfo = subscribe('info', (data) => {
      addLog('received', `Server info: ${data.message}`);
    });

    // Subscribe to heartbeat messages
    const unsubscribeHeartbeat = subscribe('heartbeat', (data) => {
      addLog('received', 'Heartbeat received');
    });

    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribePong();
      unsubscribeInfo();
      unsubscribeHeartbeat();
    };
  }, [subscribe, pingResult]);

  // Add a log entry
  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [
      {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date()
      },
      ...prev
    ].slice(0, 50)); // Keep only the last 50 logs
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Send a ping to measure response time
  const sendPing = () => {
    setPingResult({
      success: false,
      time: Date.now()
    });
    
    const success = sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
    
    if (success) {
      addLog('sent', 'Ping sent');
    } else {
      addLog('error', 'Failed to send ping');
      setPingResult(null);
    }
  };

  // Send a custom message
  const sendCustomMessage = () => {
    const success = sendMessage({
      type: 'chat',
      message: messageContent,
      timestamp: Date.now()
    });
    
    if (success) {
      addLog('sent', `Message sent: ${messageContent}`);
    } else {
      addLog('error', 'Failed to send message');
    }
  };

  // Get status badge based on connection state
  const getStatusBadge = () => {
    const status = getConnectionStatus();
    
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500 hover:bg-green-600"><Wifi className="w-3 h-3 mr-1" /> Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Connecting</Badge>;
      case 'disconnected':
      case 'closed':
        return <Badge className="bg-red-500 hover:bg-red-600"><WifiOff className="w-3 h-3 mr-1" /> Disconnected</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Unknown</Badge>;
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get class for log entry
  const getLogClass = (type: LogEntry['type']) => {
    switch (type) {
      case 'sent': return 'bg-blue-50 border-l-4 border-blue-500';
      case 'received': return 'bg-green-50 border-l-4 border-green-500';
      case 'error': return 'bg-red-50 border-l-4 border-red-500';
      default: return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center justify-between">
          <span>WebSocket Connection Test</span>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Test the WebSocket connection to the server
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={connect} 
            disabled={isConnected || getConnectionStatus() === 'connecting'}
            variant="default"
            size="sm"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Connect
          </Button>
          
          <Button 
            onClick={disconnect} 
            disabled={!isConnected}
            variant="destructive"
            size="sm"
          >
            <WifiOff className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
          
          <Button 
            onClick={sendPing} 
            disabled={!isConnected}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Ping
          </Button>
          
          <Button 
            onClick={clearLogs}
            variant="outline"
            size="sm"
          >
            Clear Logs
          </Button>
        </div>
        
        {pingResult !== null && (
          <div className={`rounded p-2 text-sm ${pingResult.success ? 'bg-green-50' : 'bg-gray-50'}`}>
            {pingResult.success ? (
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>Ping: <strong>{pingResult.time}ms</strong></span>
              </div>
            ) : (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 text-gray-500 mr-2 animate-spin" />
                <span>Waiting for ping response...</span>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr,auto] gap-2">
            <Input
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Enter a message to send"
              disabled={!isConnected}
            />
            <Button 
              onClick={sendCustomMessage} 
              disabled={!isConnected}
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Connection Log</h3>
          <div className="bg-muted/30 rounded-md p-1 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                No logs yet
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {logs.map(log => (
                  <div 
                    key={log.id} 
                    className={`text-xs p-2 rounded ${getLogClass(log.type)}`}
                  >
                    <span className="text-gray-500 mr-2">[{formatTime(log.timestamp)}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WebSocketConnectionTest;