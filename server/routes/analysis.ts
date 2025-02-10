import { Router } from "express";
import { analyzeFinancialStatement } from "../services/analysis";
import { db } from "../db";
import { analyses, messages } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/analysis", async (req, res) => {
  try {
    const { fileContent, fileName, standard } = req.body;

    if (!fileContent || !fileName || !standard) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Starting analysis for file:", fileName);

    // Create analysis record
    const [analysis] = await db
      .insert(analyses)
      .values({
        fileName,
        fileContent,
        standard,
        status: "Drafting",
        userId: req.user?.id || null,
      })
      .returning();

    console.log("Analysis record created:", analysis.id);

    // Generate initial AI analysis
    const initialAnalysis = await analyzeFinancialStatement(fileContent, standard);
    console.log("Initial AI analysis generated");

    // Store the AI message
    await db.insert(messages).values({
      analysisId: analysis.id,
      content: initialAnalysis,
      role: "assistant",
    });

    res.json(analysis);
  } catch (error: any) {
    console.error("Error creating analysis:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/analysis/:id/messages", async (req, res) => {
  try {
    const messages = await db.query.messages.findMany({
      where: eq(messages.analysisId, parseInt(req.params.id)),
      orderBy: [messages.createdAt],
    });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/analysis/:id/messages", async (req, res) => {
  try {
    const { content } = req.body;
    const analysisId = parseInt(req.params.id);

    // Store user message
    await db.insert(messages).values({
      analysisId,
      content,
      role: "user",
    });

    // Get the analysis details
    const analysis = await db.query.analyses.findFirst({
      where: eq(analyses.id, analysisId),
    });

    if (!analysis) {
      throw new Error("Analysis not found");
    }

    // Generate AI response
    const response = await analyzeFinancialStatement(
      `Previous content: ${analysis.fileContent}\n\nUser question: ${content}`,
      analysis.standard
    );

    // Store AI response
    const [message] = await db
      .insert(messages)
      .values({
        analysisId,
        content: response,
        role: "assistant",
      })
      .returning();

    res.json(message);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;