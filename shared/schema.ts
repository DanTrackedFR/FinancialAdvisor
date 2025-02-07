import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const standardTypes = ["IFRS", "US_GAAP", "UK_GAAP"] as const;
export type StandardType = typeof standardTypes[number];

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(),
  standard: text("standard", { enum: standardTypes }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull().default("pending"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").references(() => analyses.id),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  metadata: jsonb("metadata"),
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

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
