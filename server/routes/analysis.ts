import { Router } from "express";
import { analyzeFinancialStatement } from "../services/analysis";
import { storage } from "../storage";
import { insertAnalysisSchema, insertMessageSchema } from "@shared/schema";

const router = Router();

router.post("/analysis", async (req, res) => {
  try {
    console.log("Received analysis request:", {
      fileName: req.body.fileName,
      contentLength: req.body.fileContent?.length,
      standard: req.body.standard
    });

    const data = insertAnalysisSchema.parse(req.body);
    console.log("Analysis data validated");

    const analysis = await storage.createAnalysis(data);
    console.log("Analysis record created:", analysis.id);

    // Start AI analysis in the background
    try {
      console.log("Starting AI analysis");
      const result = await analyzeFinancialStatement(data.fileContent, data.standard);
      console.log("AI analysis completed");

      await storage.createMessage({
        analysisId: analysis.id,
        role: "assistant",
        content: result,
        metadata: { type: "initial_analysis" },
      });
      console.log("Analysis message stored");

      await storage.updateAnalysisStatus(analysis.id, "Complete");
      console.log("Analysis status updated to Complete");
    } catch (error) {
      console.error("Error in AI analysis:", error);
      await storage.updateAnalysisStatus(analysis.id, "Drafting");
      // Don't throw here - we still want to return the analysis object
    }

    res.json(analysis);
  } catch (error) {
    console.error("Error in /api/analysis:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
  }
});

router.get("/analysis/:id/messages", async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const messages = await storage.getMessages(analysisId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
  }
});

router.post("/analysis/:id/messages", async (req, res) => {
  try {
    const analysisId = parseInt(req.params.id);
    const analysis = await storage.getAnalysis(analysisId);

    if (!analysis) {
      throw new Error("Analysis not found");
    }

    const data = insertMessageSchema.parse({
      ...req.body,
      analysisId,
    });

    const message = await storage.createMessage(data);

    // Generate AI response
    const response = await analyzeFinancialStatement(
      `Previous content: ${analysis.fileContent}\n\nUser question: ${data.content}`,
      analysis.standard
    );

    // Store AI response
    const aiMessage = await storage.createMessage({
      analysisId,
      role: "assistant",
      content: response,
      metadata: { type: "followup" },
    });

    res.json([message, aiMessage]);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error occurred" });
  }
});

export default router;