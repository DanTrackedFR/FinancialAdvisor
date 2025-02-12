import { analyzeFinancialStatement as openAiAnalysis } from "../ai/openai";
import { StandardType } from "@shared/schema";

export async function analyzeFinancialStatement(content: string, standard: StandardType) {
  try {
    console.log("Starting financial statement analysis for", standard);

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    console.log("Attempting analysis with OpenAI...");
    const analysis = await openAiAnalysis(content, standard);

    console.log("Analysis completed successfully");

    // Format the response for better readability
    const formattedAnalysis = [
      `Summary: ${analysis.summary}`,
      '\nKey Review Points:',
      ...analysis.reviewPoints.map(point => `• ${point}`),
      '\nSuggested Improvements:',
      ...analysis.improvements.map(improvement => `• ${improvement}`),
      '\nPerformance Analysis:',
      analysis.performance,
      '\nCompliance Status:',
      `• Status: ${analysis.compliance.status}`,
      ...analysis.compliance.issues.map(issue => `• ${issue}`)
    ].join('\n');

    return formattedAnalysis;

  } catch (error) {
    console.error("Error analyzing financial statement:", error);

    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Invalid OpenAI API key");
      }
      if (error.message.includes("quota") || error.message.includes("rate limit")) {
        throw new Error("API quota exceeded. Please try again later.");
      }
      throw new Error(`Failed to analyze financial statement: ${error.message}`);
    }

    throw new Error("An unexpected error occurred during analysis");
  }
}