import { Router } from "express";
import { analyzeFinancialStatement } from "../services/analysis";
import { storage } from "../storage";
import { insertMessageSchema, insertAnalysisSchema } from "@shared/schema";

const router = Router();

router.get("/analysis/:id", async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const analysis = await storage.getAnalysis(analysisId);

    if (!analysis) {
      console.error(`Analysis not found for ID: ${analysisId}`);
      res.status(404).json({ error: "Analysis not found" });
      return;
    }

    console.log(`Fetched analysis for ID ${analysisId}:`, analysis);
    res.json(analysis);
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch analysis"
    });
  }
});

router.patch("/analysis/:id/title", async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: "Valid title is required" });
      return;
    }

    await storage.updateAnalysisTitle(analysisId, title.trim());
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating analysis title:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update analysis title"
    });
  }
});

router.patch("/analysis/:id/content", async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const { content } = req.body;

    if (typeof content !== 'string') {
      res.status(400).json({ error: "Valid content is required" });
      return;
    }

    await storage.updateAnalysisContent(analysisId, content);

    // If content is provided, trigger AI analysis
    if (content.trim()) {
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        throw new Error("Analysis not found");
      }

      // Start AI analysis
      try {
        console.log("Starting AI analysis with new content");
        const result = await analyzeFinancialStatement(content, analysis.standard);
        console.log("AI analysis completed, response length:", result.length);

        await storage.createMessage({
          analysisId,
          role: "assistant",
          content: result,
          metadata: { type: "content_update" },
        });

        await storage.updateAnalysisStatus(analysisId, "Complete");
      } catch (error) {
        console.error("Error in AI analysis:", error);
        await storage.updateAnalysisStatus(analysisId, "Drafting");
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating analysis content:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update analysis content"
    });
  }
});

router.patch("/analysis/:id/status", async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const { status } = req.body;

    // Validate status value
    const validStatuses = ["Drafting", "In Review", "Complete"] as const;
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status. Must be one of: Drafting, In Review, Complete" });
      return;
    }

    await storage.updateAnalysisStatus(analysisId, status);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating analysis status:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update analysis status"
    });
  }
});

router.post("/analysis", async (req, res) => {
  try {
    console.log("Received analysis request:", {
      fileName: req.body.fileName,
      contentLength: req.body.fileContent?.length,
      standard: req.body.standard
    });

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

    const data = insertAnalysisSchema.parse(req.body);
    console.log("Analysis data validated");

    // Create analysis with validated data
    const analysisData = {
      ...data,
      userId: user.id,
    };

    const analysis = await storage.createAnalysis(analysisData);
    console.log("Analysis record created:", analysis.id);

    // Start AI analysis in the background
    try {
      console.log("Starting AI analysis with OpenAI");
      const result = await analyzeFinancialStatement(data.fileContent, data.standard);
      console.log("AI analysis completed, response length:", result.length);

      console.log("Creating message record...");
      const message = await storage.createMessage({
        analysisId: analysis.id,
        role: "assistant",
        content: result,
        metadata: { type: "initial_analysis" },
      });
      console.log("Analysis message stored:", message.id);

      await storage.updateAnalysisStatus(analysis.id, "Complete");
      console.log("Analysis status updated to Complete");
    } catch (error) {
      console.error("Error in AI analysis:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      await storage.updateAnalysisStatus(analysis.id, "Drafting");
    }

    res.json(analysis);
  } catch (error) {
    console.error("Error in /api/analysis:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
  }
});

router.get("/analysis/:id/messages", async (req, res) => {
  try {
    console.log("Fetching messages for analysis:", req.params.id);
    const analysisId = parseInt(req.params.id);
    const messages = await storage.getMessages(analysisId);
    console.log(`Found ${messages.length} messages`);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
  }
});

router.post("/analysis/:id/messages", async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    console.log("Creating new message for analysis:", analysisId);

    const analysis = await storage.getAnalysis(analysisId);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const data = insertMessageSchema.parse({
      ...req.body,
      analysisId,
    });

    console.log("Creating user message...");
    const message = await storage.createMessage(data);
    console.log("User message created:", message.id);

    // Generate AI response
    console.log("Generating AI response...");
    const context = analysis.fileContent
      ? `Previous content: ${analysis.fileContent}\n\nUser question: ${data.content}`
      : `You are analyzing a financial statement under ${analysis.standard} standards. User question: ${data.content}`;

    const response = await analyzeFinancialStatement(
      context,
      analysis.standard
    );
    console.log("AI response generated, length:", response.length);

    // Store AI response
    const aiMessage = await storage.createMessage({
      analysisId,
      role: "assistant",
      content: response,
      metadata: { type: "followup" },
    });
    console.log("AI message stored:", aiMessage.id);

    res.json([message, aiMessage]);
  } catch (error) {
    console.error("Error in message creation:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
  }
});

router.delete("/analysis/:id", async (req, res) => {
  try {
    console.log("Delete request for analysis:", req.params.id);
    const analysisId = parseInt(req.params.id);
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

    // Get the analysis to verify ownership
    const analysis = await storage.getAnalysis(analysisId);
    if (!analysis) {
      res.status(404).json({ error: "Analysis not found" });
      return;
    }

    if (analysis.userId !== user.id) {
      res.status(403).json({ error: "Unauthorized - Analysis belongs to another user" });
      return;
    }

    // Delete the analysis and its messages
    await storage.deleteAnalysis(analysisId);

    console.log("Analysis deleted successfully:", analysisId);
    res.status(200).json({ message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    res.status(500).json({ error: "Failed to delete analysis" });
  }
});

export default router;