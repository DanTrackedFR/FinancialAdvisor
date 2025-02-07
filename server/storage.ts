import { Analysis, Message, InsertAnalysis, InsertMessage } from "@shared/schema";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  updateAnalysisStatus(id: number, status: "pending" | "completed" | "failed"): Promise<void>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(analysisId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<number, Analysis>;
  private messages: Map<number, Message>;
  private currentAnalysisId: number;
  private currentMessageId: number;

  constructor() {
    this.analyses = new Map();
    this.messages = new Map();
    this.currentAnalysisId = 1;
    this.currentMessageId = 1;
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentAnalysisId++;
    const newAnalysis: Analysis = {
      ...analysis,
      id,
      status: "pending",
    };
    this.analyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async updateAnalysisStatus(
    id: number,
    status: "pending" | "completed" | "failed",
  ): Promise<void> {
    const analysis = this.analyses.get(id);
    if (analysis) {
      this.analyses.set(id, { ...analysis, status });
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const newMessage: Message = {
      ...message,
      id,
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessages(analysisId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.analysisId === analysisId,
    );
  }
}

export const storage = new MemStorage();
