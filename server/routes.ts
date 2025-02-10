import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertAnalysisSchema, insertMessageSchema } from "@shared/schema";
import { analyzeFinancialStatement, generateFollowupResponse } from "./ai/openai";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAnalyses();
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analysis", async (req, res) => {
    try {
      const data = insertAnalysisSchema.parse(req.body);
      const analysis = await storage.createAnalysis(data);

      // Start AI analysis
      try {
        const result = await analyzeFinancialStatement(
          data.fileContent,
          data.standard,
        );

        await storage.createMessage({
          analysisId: analysis.id,
          role: "assistant",
          content: JSON.stringify(result),
          metadata: result,
        });

        await storage.updateAnalysisStatus(analysis.id, "completed");
      } catch (error: any) {
        await storage.updateAnalysisStatus(analysis.id, "failed");
        throw error;
      }

      res.json(analysis);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(Number(req.params.id));
      if (!analysis) {
        res.status(404).json({ error: "Analysis not found" });
        return;
      }
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analysis/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(Number(req.params.id));
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analysis/:id/messages", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        res.status(404).json({ error: "Analysis not found" });
        return;
      }

      const data = insertMessageSchema.parse({
        ...req.body,
        analysisId,
      });

      const message = await storage.createMessage(data);

      // Get conversation history
      const messages = await storage.getMessages(analysisId);
      const conversation = messages.map(({ role, content }) => ({
        role,
        content,
      }));

      // Generate AI response
      const aiResponse = await generateFollowupResponse(
        conversation,
        analysis.standard,
      );

      const aiMessage = await storage.createMessage({
        analysisId,
        role: "assistant",
        content: aiResponse,
        metadata: null,
      });

      res.json([message, aiMessage]);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}