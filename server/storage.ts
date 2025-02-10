import { analyses, messages, type Analysis, type InsertAnalysis, type Message, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalyses(): Promise<Analysis[]>;
  updateAnalysisStatus(id: number, status: "pending" | "completed" | "failed"): Promise<void>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(analysisId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [result] = await db.insert(analyses).values(analysis).returning();
    return result;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [result] = await db.select().from(analyses).where(eq(analyses.id, id));
    return result;
  }

  async getAnalyses(): Promise<Analysis[]> {
    return db.select()
      .from(analyses)
      .orderBy(desc(analyses.id));
  }

  async updateAnalysisStatus(
    id: number,
    status: "pending" | "completed" | "failed",
  ): Promise<void> {
    await db.update(analyses)
      .set({ status })
      .where(eq(analyses.id, id));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getMessages(analysisId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.analysisId, analysisId));
  }
}

export const storage = new DatabaseStorage();