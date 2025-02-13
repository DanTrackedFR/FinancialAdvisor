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

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoggedIn: true,
  stripeCustomerId: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  trialEndsAt: true,
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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;