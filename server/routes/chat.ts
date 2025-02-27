import { Router } from "express";
import { storage } from "../storage";
import { analyzeFinancialStatement } from "../services/analysis";
import { StandardType } from "@shared/schema";

// Simple in-memory cache for repeated questions
const responseCache = new Map<string, {
  response: string,
  timestamp: number
}>();

// Cache expiration time in milliseconds (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000;

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRATION) {
      responseCache.delete(key);
    }
  }
}, 60 * 1000); // Run cleanup every minute

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
  const startTime = Date.now();
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

    // Create a cache key based on user, message and standard
    const cacheKey = `${user.id}-${standard}-${message}`;

    // Check if we have a cached response for exact message
    if (!fileContent && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_EXPIRATION) {
        console.log("Using cached response, saved time:", Date.now() - startTime, "ms");

        // Create user message
        const userMessage = {
          id: Date.now(),
          role: "user" as const,
          content: message,
          analysisId: -1,
        };

        // Return cached AI response
        const aiMessage = {
          id: Date.now() + 1,
          role: "assistant" as const,
          content: cached.response,
          analysisId: -1,
        };

        res.json([userMessage, aiMessage]);
        return;
      } else {
        // Cache expired, remove it
        responseCache.delete(cacheKey);
      }
    }

    // Get AI response using our analysis service
    console.log("Getting AI response for chat message:", message);
    const aiResponse = await analyzeFinancialStatement(analysisContext, standard as StandardType);

    // Cache the response if it doesn't contain file content 
    // (we don't want to cache file-specific responses)
    if (!fileContent) {
      responseCache.set(cacheKey, {
        response: aiResponse,
        timestamp: Date.now()
      });
    }

    console.log("Response generated in:", Date.now() - startTime, "ms");

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
    const errorTime = Date.now() - startTime;
    console.log("Error occurred after:", errorTime, "ms");

    // Return a faster error response for very slow requests
    if (errorTime > 10000) { // 10 seconds
      res.status(500).json({
        error: "The request took too long to process. Please try again with a simpler question."
      });
    } else {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to process chat message"
      });
    }
  }
});

export default router;