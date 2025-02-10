import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const standardTypes = ["IFRS", "US_GAAP", "UK_GAAP"] as const;
export type StandardType = typeof standardTypes[number];

export const analysisStatus = ["Drafting", "In Review", "Complete"] as const;
export type AnalysisStatus = typeof analysisStatus[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  firstName: text("first_name").notNull(),
  surname: text("surname").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  lastLoggedIn: timestamp("last_logged_in"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(),
  standard: text("standard", { enum: standardTypes }).notNull(),
  status: text("status", { enum: analysisStatus }).notNull().default("Drafting"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").references(() => analyses.id),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  metadata: jsonb("metadata"),
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoggedIn: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  fileName: true,
  fileContent: true,
  standard: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  analysisId: true,
  content: true,
  role: true,
  metadata: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;