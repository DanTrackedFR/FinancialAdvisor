import { analyses, messages, users, subscriptions, pageViews, userSessions, userActions, feedback,
  type Analysis, type InsertAnalysis, type Message, type InsertMessage, 
  type User, type InsertUser, type Subscription, type InsertSubscription,
  type PageView, type InsertPageView, type UserSession, type InsertUserSession,
  type UserAction, type InsertUserAction, type Feedback, type InsertFeedback } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, between, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>; // Add method to get user by ID
  updateUser(id: number, data: Partial<InsertUser> & { isAdmin?: boolean }): Promise<User>; // Add isAdmin to allowed properties
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

  // Analytics methods
  createPageView(pageView: InsertPageView): Promise<PageView>;
  getPageViews(userId?: number, startDate?: Date, endDate?: Date): Promise<PageView[]>;

  createUserSession(session: InsertUserSession): Promise<UserSession>;
  updateUserSession(id: number, endTime: Date): Promise<void>;
  getUserSessions(userId: number): Promise<UserSession[]>;

  createUserAction(action: InsertUserAction): Promise<UserAction>;
  getUserActions(userId: number): Promise<UserAction[]>;

  // Analytics aggregation methods
  getDailyActiveUsers(startDate: Date, endDate: Date): Promise<{ date: string; count: number; }[]>;
  getPopularPages(startDate: Date, endDate: Date): Promise<{ path: string; views: number; }[]>;
  getAverageSessionDuration(): Promise<number>;

  // Feedback methods
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  getUserFeedback(userId: number): Promise<Feedback[]>;
  getAllFeedback(): Promise<Feedback[]>;
  updateFeedbackResolution(id: number, resolved: boolean, adminResponse?: string): Promise<void>;
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

  // Add method to get user by ID
  async getUser(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async updateUser(id: number, data: Partial<InsertUser> & { isAdmin?: boolean }): Promise<User> {
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

  // Analytics methods
  async createPageView(pageView: InsertPageView): Promise<PageView> {
    const [result] = await db.insert(pageViews).values(pageView).returning();
    return result;
  }

  // Fix query chaining in getPageViews method
  async getPageViews(userId?: number, startDate?: Date, endDate?: Date): Promise<PageView[]> {
    let baseQuery = db.select().from(pageViews);

    const conditions = [];

    if (userId) {
      conditions.push(eq(pageViews.userId, userId));
    }

    if (startDate && endDate) {
      conditions.push(between(pageViews.timestamp, startDate, endDate));
    }

    if (conditions.length > 0) {
      return baseQuery.where(and(...conditions)).orderBy(desc(pageViews.timestamp));
    }

    return baseQuery.orderBy(desc(pageViews.timestamp));
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [result] = await db.insert(userSessions).values(session).returning();
    return result;
  }

  async updateUserSession(id: number, endTime: Date): Promise<void> {
    await db.update(userSessions)
      .set({ endTime, lastActivity: new Date() })
      .where(eq(userSessions.id, id));
  }

  async getUserSessions(userId: number): Promise<UserSession[]> {
    return db.select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.startTime));
  }

  async createUserAction(action: InsertUserAction): Promise<UserAction> {
    const [result] = await db.insert(userActions).values(action).returning();
    return result;
  }

  async getUserActions(userId: number): Promise<UserAction[]> {
    return db.select()
      .from(userActions)
      .where(eq(userActions.userId, userId))
      .orderBy(desc(userActions.timestamp));
  }

  // Analytics aggregation methods
  async getDailyActiveUsers(startDate: Date, endDate: Date): Promise<{ date: string; count: number; }[]> {
    const result = await db.execute(sql`
      SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as count
      FROM page_views
      WHERE timestamp BETWEEN ${startDate} AND ${endDate}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `);
    return result.rows as { date: string; count: number; }[];
  }

  async getPopularPages(startDate: Date, endDate: Date): Promise<{ path: string; views: number; }[]> {
    const result = await db.execute(sql`
      SELECT path, COUNT(*) as views
      FROM page_views
      WHERE timestamp BETWEEN ${startDate} AND ${endDate}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `);
    return result.rows as { path: string; views: number; }[];
  }

  // Fix average duration calculation
  async getAverageSessionDuration(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COALESCE(
        AVG(
          EXTRACT(EPOCH FROM (end_time - start_time))
        )::integer,
        0
      ) as avg_duration
      FROM user_sessions 
      WHERE end_time IS NOT NULL
    `);
    return Number(result.rows[0]?.avg_duration ?? 0);
  }

  // Feedback methods
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [result] = await db.insert(feedback).values(feedbackData).returning();
    return result;
  }

  async getUserFeedback(userId: number): Promise<Feedback[]> {
    return db.select()
      .from(feedback)
      .where(eq(feedback.userId, userId))
      .orderBy(desc(feedback.createdAt));
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return db.select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt));
  }

  async updateFeedbackResolution(id: number, resolved: boolean, adminResponse?: string): Promise<void> {
    const updateData: any = { 
      resolved,
    };

    if (adminResponse) {
      updateData.adminResponse = adminResponse;
      updateData.respondedAt = new Date();
    }

    await db.update(feedback)
      .set(updateData)
      .where(eq(feedback.id, id));
  }
}

export const storage = new DatabaseStorage();