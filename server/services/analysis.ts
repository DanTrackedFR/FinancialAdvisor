import { analyzeFinancialStatement as openAiAnalysis } from "../ai/openai";
import { StandardType } from "@shared/schema";

export async function analyzeFinancialStatement(content: string, standard: StandardType) {
  try {
    console.log("Starting financial statement analysis for", standard);
    console.log("Content length:", content.length);

    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured");
      throw new Error("OpenAI API key is not configured");
    }

    try {
      console.log("Calling OpenAI analysis...");
      const response = await openAiAnalysis(content, standard);
      console.log("OpenAI response received, type:", typeof response);

      // Handle different response types
      if (typeof response === 'string') {
        return response;
      }

      if (!response || (!response.summary && !response.reviewPoints)) {
        console.warn("Unexpected response format from OpenAI:", response);
        return "I'm here to help with financial analysis. What would you like to know?";
      }

      return response.summary || "I'm here to help with your financial questions. What would you like to know?";
    } catch (error) {
      console.error("OpenAI error:", error);
      if (error instanceof Error) {
        console.error("OpenAI error details:", error.message);
        if (error.message.includes("Incorrect API key")) {
          throw new Error("Authentication error with AI service. Please try again later.");
        }
      }
      return "I'm here to help with financial analysis. What would you like to know?";
    }

  } catch (error) {
    console.error("Error in financial statement analysis:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Configuration error. Please try again later.");
      }
      if (error.message.includes("quota") || error.message.includes("rate limit")) {
        return "I'm currently experiencing high demand. Please try again in a few minutes.";
      }
      throw new Error(`Analysis error: ${error.message}`);
    }

    throw new Error("An unexpected error occurred");
  }
}