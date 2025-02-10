import { analyses, messages, users, type Analysis, type InsertAnalysis, type Message, type InsertMessage, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  updateLastLogin(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>; // New method

  // Analysis methods
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalyses(): Promise<Analysis[]>;
  updateAnalysisStatus(id: number, status: "pending" | "completed" | "failed"): Promise<void>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(analysisId: number): Promise<Message[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return result;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [result] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLoggedIn: new Date() })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select()
      .from(users)
      .orderBy(desc(users.id));
  }

  // Analysis methods
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

  // Message methods
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