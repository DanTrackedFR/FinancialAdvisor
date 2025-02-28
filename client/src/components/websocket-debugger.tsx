import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RotateCw, CheckCircle, XCircle } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

export const WebSocketDebugger = () => {
  // Only show in development mode, not in production - using a more robust check
  const isDevelopment = process.env.NODE_ENV !== "production" && import.meta.env.DEV === true;

  // If not in development mode, don't render anything
  if (!isDevelopment) {
    return null;
  }

  const [expanded, setExpanded] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; time?: number; error?: string } | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Important: Use the exact same configuration as other components
  // to ensure we're sharing the same global WebSocket connection
  const { 
    isConnected, 
    getConnectionStatus, 
    sendMessage, 
    subscribe,
    connect,
    connectionDetails
  } = useWebSocket({
    // Keep the same reconnect parameters as main app to stay in sync
    reconnectInterval: 3000,
    reconnectAttempts: 5,
    autoReconnect: true,
    enableDebugLogs: true
  });

  // Test ping-pong functionality
  const testPing = async () => {
    setPingResult(null);
    setIsLoading(true);

    try {
      const startTime = Date.now();

      // Set up a promise that will resolve when we get a pong back
      const pongPromise = new Promise<void>((resolve, reject) => {
        // Subscribe to pong messages
        const unsubscribe = subscribe('pong', () => {
          unsubscribe(); // Clean up subscription
          resolve();
        });

        // Set a timeout
        const timeout = setTimeout(() => {
          unsubscribe(); // Clean up subscription
          reject(new Error('Ping timed out after 5000ms'));
        }, 5000);

        // Send ping message
        const success = sendMessage({ type: 'ping', timestamp: Date.now() });

        if (!success) {
          clearTimeout(timeout);
          unsubscribe();
          reject(new Error('Failed to send ping - socket not connected'));
        }
      });

      await pongPromise;
      const responseTime = Date.now() - startTime;

      setPingResult({
        success: true,
        time: responseTime
      });
    } catch (error: any) {
      setPingResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch server-side diagnostic information
  const fetchDiagnostics = async () => {
    setDiagnosticResult(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ws-status');
      const data = await response.json();
      setDiagnosticResult(data);
    } catch (error: any) {
      setDiagnosticResult({
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manual reconnect
  const handleReconnect = () => {
    connect();
  };

  useEffect(() => {
    if (expanded) {
      fetchDiagnostics();
    }
  }, [expanded, isConnected]);

  // Return collapsed version if not expanded
  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setExpanded(true)}
          variant="outline"
          className="shadow-md"
          size="sm"
        >
          {isConnected ? (
            <Wifi className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 mr-2 text-red-500" />
          )}
          WebSocket: {getConnectionStatus()}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 shadow-xl">
      <Card className="w-80">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">WebSocket Debugger</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(false)}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
          <CardDescription>
            Diagnose real-time connection issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {/* Connection Status */}
          <div className="flex justify-between items-center">
            <span>Connection:</span>
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" /> Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" /> {getConnectionStatus()}
                </>
              )}
            </Badge>
          </div>

          {/* Connection Details */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-mono">{getConnectionStatus()}</span>
            </div>
            <div className="flex justify-between">
              <span>Connection attempts:</span>
              <span className="font-mono">{connectionDetails.attempts}</span>
            </div>
            <div className="flex justify-between">
              <span>Reconnect attempts:</span>
              <span className="font-mono">{connectionDetails.reconnectAttempts}</span>
            </div>
          </div>

          {/* Ping Test */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Ping Test:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testPing}
                disabled={!isConnected || isLoading}
              >
                {isLoading ? <RotateCw className="h-3 w-3 animate-spin" /> : 'Test'}
              </Button>
            </div>

            {pingResult && (
              <div className="flex items-center gap-2 text-xs">
                {pingResult.success ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Success! Response time: {pingResult.time}ms</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{pingResult.error}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Server Diagnostics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Server Diagnostics:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDiagnostics}
                disabled={isLoading}
              >
                {isLoading ? <RotateCw className="h-3 w-3 animate-spin" /> : 'Check'}
              </Button>
            </div>

            {diagnosticResult && (
              <div className="text-xs space-y-1">
                {diagnosticResult.error ? (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{diagnosticResult.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>WS Initialized:</span>
                      <span className={diagnosticResult.wsInitialized ? "text-green-500" : "text-red-500"}>
                        {diagnosticResult.wsInitialized ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Sockets:</span>
                      <span>{diagnosticResult.activeSockets}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reconnect Button */}
          <Button 
            variant="default" 
            className="w-full"
            onClick={handleReconnect}
          >
            <RotateCw className="h-4 w-4 mr-2" /> Reconnect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};