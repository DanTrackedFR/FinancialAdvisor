import { Router } from "express";
import { storage } from "../storage";
import { analyzeFinancialStatement } from "../services/analysis";
import { StandardType } from "@shared/schema";

const router = Router();

router.post("/chat/init", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"] as string;
    if (!firebaseUid) {
      res.status(401).json({ error: "Unauthorized - Missing firebase-uid header" });
      return;
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error initializing chat:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to initialize chat"
    });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const firebaseUid = req.headers["firebase-uid"] as string;
    if (!firebaseUid) {
      res.status(401).json({ error: "Unauthorized - Missing firebase-uid header" });
      return;
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { message, standard = "IFRS", fileContent } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // If fileContent is provided, use it as context for the analysis
    const analysisContext = fileContent 
      ? `Document Content:\n${fileContent}\n\nUser Question: ${message}`
      : message;

    // Get AI response using our analysis service
    console.log("Getting AI response for chat message:", message);
    const aiResponse = await analyzeFinancialStatement(analysisContext, standard as StandardType);

    // Create user message
    const userMessage = {
      id: Date.now(),
      role: "user" as const,
      content: message,
      analysisId: -1,
    };

    // Create AI response message
    const aiMessage = {
      id: Date.now() + 1,
      role: "assistant" as const,
      content: aiResponse,
      analysisId: -1,
    };

    res.json([userMessage, aiMessage]);
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to process chat message"
    });
  }
});

export default router;