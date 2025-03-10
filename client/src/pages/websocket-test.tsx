import React from 'react';
import { WebSocketConnectionTest } from '@/components/websocket-connection-test';

export default function WebSocketTestPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">WebSocket Connection Test</h1>
        <p className="text-muted-foreground">
          This page tests WebSocket connectivity with the server in the Replit environment.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <WebSocketConnectionTest />
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-md">
        <h2 className="text-xl font-semibold mb-2">WebSocket Connection Troubleshooting</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>WebSocket connections in Replit environments require special handling due to the proxy architecture.</li>
          <li>The connection hook tries multiple URL formats to establish a reliable connection.</li>
          <li>If you see connection errors, check the browser console for detailed logs.</li>
          <li>WebSocket connections require the server to be running (via the "Start application" workflow).</li>
          <li>The server exposes WebSockets at the <code className="bg-muted-foreground/20 px-1 rounded">/ws</code> path.</li>
        </ul>
      </div>
    </div>
  );
}