import { analyzeFinancialStatement as openAiAnalysis } from "../ai/openai";
import { StandardType } from "@shared/schema";

export async function analyzeFinancialStatement(content: string, standard: StandardType) {
  try {
    console.log("Starting financial statement analysis for", standard);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Attempting analysis with OpenAI...");

    try {
      return await openAiAnalysis(content, standard);
    } catch (error) {
      // If OpenAI fails, return a basic response
      console.log("OpenAI error, falling back to basic response");
      return "I apologize, but I'm currently experiencing high demand. I'm here to help with financial analysis. What would you like to know?";
    }

  } catch (error) {
    console.error("Error in financial statement analysis:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Configuration error. Please try again later.");
      }
      if (error.message.includes("quota") || error.message.includes("rate limit")) {
        return "I'm currently experiencing high demand and cannot provide a detailed analysis at the moment. Please try again in a few minutes.";
      }
      throw new Error(`Analysis error: ${error.message}`);
    }

    throw new Error("An unexpected error occurred");
  }
}