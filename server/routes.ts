import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import analysisRoutes from "./routes/analysis";
import chatRoutes from "./routes/chat";
import authRoutes from "./routes/auth";
import analyticsRoutes from "./routes/analytics";
import feedbackRoutes from "./routes/feedback";
import bigqueryRoutes from "./routes/bigquery"; // Import BigQuery routes
import { WebSocketServer, WebSocket } from "ws";

// Declare global type for the WebSocket server
declare global {
  var wss: WebSocketServer | undefined;
}

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Register routes
  app.use("/api", analysisRoutes);
  app.use("/api", chatRoutes);
  app.use("/api", authRoutes);
  app.use("/api", analyticsRoutes); // Add analytics routes
  app.use("/api", feedbackRoutes); // Add feedback routes
  app.use("/api", bigqueryRoutes); // Add BigQuery routes

  // Debug endpoint to echo the routes
  app.get("/api/debug/routes", (_req, res) => {
    // Send information about registered routes
    res.json({
      message: "Routes are registered correctly",
      timestamp: new Date().toISOString()
    });
  });

  // User routes
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove the duplicate POST /api/users route because it's already defined in auth.ts

  app.get("/api/user/analyses", async (req, res) => {
    try {
      const firebaseUid = req.headers["firebase-uid"] as string;
      if (!firebaseUid) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const analyses = await storage.getUserAnalyses(user.id);
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WebSocket server diagnostic endpoint
  app.get("/api/ws-status", (_req, res) => {
    res.json({
      wsInitialized: global.wss !== undefined,
      activeSockets: global.wss ? global.wss.clients.size : 0,
      serverPid: process.pid
    });
  });

  console.log('Initializing WebSocket server...');

  // Initialize WebSocket server
  try {
    // Create WebSocket server on a specific path to avoid conflicts with Vite's HMR WebSocket
    const wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws',
      clientTracking: true
    });

    // Store WSS globally for diagnostics and status checks
    global.wss = wss;
    console.log('WebSocket server initialized successfully on path /ws');

    // Store active connections
    const clients = new Set<WebSocket>();

    wss.on('connection', (socket) => {
      console.log('New WebSocket connection established');
      clients.add(socket);

      // Handle incoming messages
      socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received message:', data);

          // Process the message based on its type
          switch (data.type) {
            case 'ping':
              // Respond to ping with pong
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              }
              break;

            case 'chat':
              // Broadcast chat message to all connected clients
              if (data.message) {
                broadcastMessage({
                  type: 'chat',
                  userId: data.userId,
                  message: data.message,
                  timestamp: Date.now()
                });
              }
              break;

            case 'analysis_update':
              // Notify clients about analysis updates
              if (data.analysisId) {
                broadcastMessage({
                  type: 'analysis_update',
                  analysisId: data.analysisId,
                  status: data.status,
                  timestamp: Date.now()
                });
              }
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      // Handle disconnections
      socket.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(socket);
      });

      // Send welcome message
      socket.send(JSON.stringify({ 
        type: 'info', 
        message: 'Connected to TrackedFR WebSocket server',
        timestamp: Date.now()
      }));
    });

    // Function to broadcast messages to all connected clients
    const broadcastMessage = (data: any) => {
      const message = JSON.stringify(data);
      let sentCount = 0;

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          sentCount++;
        }
      });

      console.log(`Broadcast message sent to ${sentCount} clients:`, data.type);
    };

    // Heartbeat interval to keep connections alive
    setInterval(() => {
      console.log(`WebSocket heartbeat - Active connections: ${clients.size}`);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        }
      });
    }, 30000); // Send heartbeat every 30 seconds
  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
  }

  return httpServer;
}