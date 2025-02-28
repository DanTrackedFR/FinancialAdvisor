import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import analysisRoutes from "./routes/analysis";
import chatRoutes from "./routes/chat";
import authRoutes from "./routes/auth";
import analyticsRoutes from "./routes/analytics";
import { WebSocketServer, WebSocket } from "ws";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Register routes
  app.use("/api", analysisRoutes);
  app.use("/api", chatRoutes);
  app.use("/api", authRoutes);
  app.use("/api", analyticsRoutes); // Add analytics routes

  // User routes
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByFirebaseUid(data.firebaseUid);

      if (existingUser) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      const user = await storage.createUser(data);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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

  // Initialize WebSocket server only after the HTTP server is ready
  let wsInitialized = false;

  httpServer.on('listening', () => {
    if (wsInitialized) return; // Prevent duplicate initialization

    // Initialize WebSocket server on a distinct path to avoid conflicts with Vite's HMR WebSocket
    const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    wsInitialized = true;

    console.log('WebSocket server initialized');

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

    // Utility function to broadcast messages to all connected clients
    function broadcastMessage(data: any) {
      const message = JSON.stringify(data);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }

    // Heartbeat interval to keep connections alive - delayed startup and reduced frequency
    setTimeout(() => {
      setInterval(() => {
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
          }
        });
      }, 60000); // Send heartbeat every 60 seconds
    }, 30000); // Delay the first heartbeat by 30 seconds
  });

  return httpServer;
}