import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import analysisRoutes from "./routes/analysis";
import chatRoutes from "./routes/chat";
// Import correct auth routes 
import authRoutes from "./routes/auth-routes"; // Updated to use auth-routes.ts
import analyticsRoutes from "./routes/analytics";
import feedbackRoutes from "./routes/feedback";
// import bigqueryRoutes from "./routes/bigquery"; // Removed as per the changes
import { WebSocketServer, WebSocket } from "ws";

// Declare global type for the WebSocket server
declare global {
  var wss: WebSocketServer | undefined;
}

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Use the firebase-admin module imported from lib folder which is already configured
  try {
    // Import and use the pre-configured firebase-admin from our lib folder
    import('./lib/firebase-admin.js').then(() => {
      console.log('Firebase Admin SDK imported successfully.');
    }).catch(error => {
      console.error('Failed to import Firebase Admin SDK:', error);
    });
  } catch (error) {
    console.error('Failed to import Firebase Admin SDK:', error);
  }


  // Register routes
  app.use("/api", analysisRoutes);
  app.use("/api", chatRoutes);
  app.use("/api/auth", authRoutes); //Use new auth routes
  app.use("/api", analyticsRoutes);
  app.use("/api", feedbackRoutes);
  // app.use("/api", bigqueryRoutes); // BigQuery routes removed as requested

  // Debug endpoint to echo the routes
  app.get("/api/debug/routes", (_req, res) => {
    res.json({
      message: "Routes are registered correctly",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


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

  app.get("/api/ws-status", (_req, res) => {
    res.json({
      wsInitialized: global.wss !== undefined,
      activeSockets: global.wss ? global.wss.clients.size : 0,
      serverPid: process.pid
    });
  });

  console.log('Initializing WebSocket server...');

  try {
    const wss = new WebSocketServer({
      server: httpServer, // This ensures WebSocket uses the same port as Express
      path: '/ws',
      clientTracking: true,
      // Add production-friendly settings
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        concurrencyLimit: 10,
        threshold: 1024
      }
    });

    global.wss = wss;
    console.log('WebSocket server initialized successfully on path /ws');

    const clients = new Set<WebSocket>();

    wss.on('connection', (socket) => {
      console.log('New WebSocket connection established');
      clients.add(socket);

      socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received message:', data);

          switch (data.type) {
            case 'ping':
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              }
              break;

            case 'chat':
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

      socket.on('close', () => {
        console.log('WebSocket connection closed');
        clients.delete(socket);
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(socket);
      });

      socket.send(JSON.stringify({
        type: 'info',
        message: 'Connected to TrackedFR WebSocket server',
        timestamp: Date.now()
      }));
    });

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

    setInterval(() => {
      console.log(`WebSocket heartbeat - Active connections: ${clients.size}`);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        }
      });
    }, 30000);
  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
  }

  return httpServer;
}