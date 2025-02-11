import { GoogleGenerativeAI } from "@google/generative-ai";
import { StandardType } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function analyzeFinancialStatement(content: string, standard: StandardType) {
  try {
    console.log("Starting financial statement analysis for", standard);
    const prompt = `You are a financial expert analyzing financial statements. Review the following financial statement content and provide a detailed analysis comparing it against ${standard} standards. Focus on:

1. Compliance with ${standard} presentation requirements
2. Required disclosures
3. Potential gaps or missing elements
4. Areas that need attention or improvement

Format your response as bullet points for clarity. Here's the financial statement:

${content}`;

    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("Google API key is not configured");
    }

    console.log("Attempting analysis with Gemini...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No valid response received from Gemini");
    }

    console.log("Analysis completed successfully");
    return text;

  } catch (error: any) {
    console.error("Error analyzing financial statement:", error);

    if (error.message?.includes("API key")) {
      throw new Error("Invalid Google API key");
    }

    // Handle other potential Gemini-specific errors
    if (error.message?.includes("quota")) {
      throw new Error("API quota exceeded. Please try again later.");
    }

    throw new Error(`Failed to analyze financial statement: ${error.message}`);
  }
}