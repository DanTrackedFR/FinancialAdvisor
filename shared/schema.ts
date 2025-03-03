import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const standardTypes = ["IFRS", "US_GAAP", "UK_GAAP"] as const;
export type StandardType = typeof standardTypes[number];

export const analysisStatus = ["Drafting", "In Review", "Complete"] as const;
export type AnalysisStatus = typeof analysisStatus[number];

export const subscriptionStatus = ["trial", "active", "cancelled", "expired"] as const;
export type SubscriptionStatus = typeof subscriptionStatus[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  firstName: text("first_name").notNull(),
  surname: text("surname").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  lastLoggedIn: timestamp("last_logged_in"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionStatus: text("subscription_status", { enum: subscriptionStatus }).notNull().default("trial"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  trialEndsAt: timestamp("trial_ends_at"),
  isAdmin: boolean("is_admin").default(false), // New field for admin privileges
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  status: text("status", { enum: subscriptionStatus }).notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  canceledAt: timestamp("canceled_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(),
  standard: text("standard", { enum: standardTypes }).notNull(),
  status: text("status", { enum: analysisStatus }).notNull().default("Drafting"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").references(() => analyses.id).notNull(),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  metadata: jsonb("metadata"),
});

// New feedback table
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolved: boolean("resolved").default(false),
  adminResponse: text("admin_response"),
  respondedAt: timestamp("responded_at"),
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoggedIn: true,
  stripeCustomerId: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  trialEndsAt: true,
  isAdmin: true, // Omitting isAdmin from insertion schema for security
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  userId: true,
  status: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  analysisId: true,
  content: true,
  role: true,
  metadata: true,
});

// Schema for inserting feedback
export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  resolved: true,
  adminResponse: true,
  respondedAt: true,
});

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  path: text("path").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  duration: integer("duration"), // in seconds
  referrer: text("referrer"),
  userAgent: text("user_agent"),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  device: text("device"),
  browser: text("browser"),
  ipAddress: text("ip_address"),
});

export const userActions = pgTable("user_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // e.g., 'login', 'logout', 'analysis_created'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Additional context about the action
});

// Add insert schemas for new tables
export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  timestamp: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  startTime: true,
  lastActivity: true,
});

export const insertUserActionSchema = createInsertSchema(userActions).omit({
  id: true,
  timestamp: true,
});

// Export types for new tables
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserAction = typeof userActions.$inferSelect;
export type InsertUserAction = z.infer<typeof insertUserActionSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Keep existing exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;