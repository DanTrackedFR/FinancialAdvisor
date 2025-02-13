import { analyses, messages, users, subscriptions, type Analysis, type InsertAnalysis, type Message, type InsertMessage, type User, type InsertUser, type Subscription, type InsertSubscription } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
  updateLastLogin(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(userId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription>;
  updateUserSubscriptionStatus(userId: number, status: "trial" | "active" | "cancelled" | "expired"): Promise<void>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void>;

  // Analysis methods
  createAnalysis(analysis: InsertAnalysis & { userId: number }): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalyses(): Promise<Analysis[]>;
  updateAnalysisStatus(id: number, status: "Drafting" | "In Review" | "Complete"): Promise<void>;
  getUserAnalyses(userId: number): Promise<Analysis[]>;
  deleteAnalysis(id: number): Promise<void>;
  getOrCreateGeneralChat(userId: number): Promise<Analysis>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(analysisId: number): Promise<Message[]>;

  // Title and content update methods
  updateAnalysisTitle(id: number, title: string): Promise<void>;
  updateAnalysisContent(id: number, content: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods remain unchanged
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
  async createAnalysis(analysis: InsertAnalysis & { userId: number }): Promise<Analysis> {
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
    status: "Drafting" | "In Review" | "Complete",
  ): Promise<void> {
    await db.update(analyses)
      .set({ status })
      .where(eq(analyses.id, id));
  }

  async getUserAnalyses(userId: number): Promise<Analysis[]> {
    return db.select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));
  }

  async deleteAnalysis(id: number): Promise<void> {
    // First delete all messages associated with this analysis
    await db.delete(messages).where(eq(messages.analysisId, id));
    // Then delete the analysis itself
    await db.delete(analyses).where(eq(analyses.id, id));
  }

  async getOrCreateGeneralChat(userId: number): Promise<Analysis> {
    // Try to find existing general chat
    const [existingChat] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.id))
      .limit(1);

    if (existingChat) {
      return existingChat;
    }

    // Create new general chat
    const [newChat] = await db.insert(analyses).values({
      userId,
      fileName: "General Chat",
      fileContent: "",
      standard: "IFRS",
      status: "Complete"
    } as InsertAnalysis & { userId: number }).returning();

    return newChat;
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

  // Title and content update methods
  async updateAnalysisTitle(id: number, title: string): Promise<void> {
    await db.update(analyses)
      .set({ fileName: title })
      .where(eq(analyses.id, id));
  }

  async updateAnalysisContent(id: number, content: string): Promise<void> {
    await db.update(analyses)
      .set({ fileContent: content })
      .where(eq(analyses.id, id));
  }

  // New subscription methods
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [result] = await db.insert(subscriptions).values(subscription).returning();
    return result;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          gte(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return result;
  }

  async updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<Subscription> {
    const [result] = await db.update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id))
      .returning();
    return result;
  }

  async updateUserSubscriptionStatus(
    userId: number,
    status: "trial" | "active" | "cancelled" | "expired"
  ): Promise<void> {
    await db.update(users)
      .set({ subscriptionStatus: status })
      .where(eq(users.id, userId));
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
    await db.update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();