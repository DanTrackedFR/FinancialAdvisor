import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import analysisRoutes from "./routes/analysis";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Register analysis routes
  app.use("/api", analysisRoutes);

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

  app.get("/api/users/profile", async (req, res) => {
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

      // Update last login timestamp
      await storage.updateLastLogin(user.id);

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/profile", async (req, res) => {
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

      const data = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(user.id, data);
      res.json(updatedUser);
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

  return httpServer;
}