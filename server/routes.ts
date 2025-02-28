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

  // WebSocket server diagnostic endpoint
  app.get("/api/ws-status", (_req, res) => {
    res.json({
      wsInitialized: typeof global.wss !== 'undefined',
      activeSockets: global.wss ? Array.from(global.wss.clients).length : 0,
    });
  });

  // Initialize WebSocket server immediately to avoid timing issues
  console.log('Initializing WebSocket server...');

  // Store WebSocket server globally so it can be accessed by the status endpoint
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Set clientTracking to true to track active connections
    clientTracking: true
  });

  // Make WSS available globally for diagnostics
  (global as any).wss = wss;

  console.log('WebSocket server initialized successfully');

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
    let sentCount = 0;

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        sentCount++;
      }
    });

    console.log(`Broadcast message sent to ${sentCount} clients:`, data.type);
  }

  // Heartbeat interval to keep connections alive - more frequent to ensure connections stay open
  setInterval(() => {
    console.log(`WebSocket heartbeat - Active connections: ${clients.size}`);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }
    });
  }, 30000); // Send heartbeat every 30 seconds

  return httpServer;
}