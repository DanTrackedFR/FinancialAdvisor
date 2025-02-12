import OpenAI from "openai";
import { StandardType } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OpenAI API key is not configured");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeFinancialStatement(
  content: string,
  standard: StandardType,
): Promise<string> {
  try {
    console.log("Initiating OpenAI request for content length:", content.length);

    const systemPrompt = `You are a financial expert specializing in ${standard} standards. 
    Provide clear, concise responses to questions about financial statements and reporting.
    Focus on accurate, practical information that helps users understand their financial data.`;

    console.log("Creating OpenAI chat completion request..."); //This line is added
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log("OpenAI response received");

    if (!response.choices[0]?.message?.content) {
      console.error("No content in OpenAI response");
      throw new Error("No response received from OpenAI");
    }

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Analysis Error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });

      if (error.message.includes("API key")) {
        throw new Error("Authentication failed with AI service. Please check your API key configuration.");
      }
      throw new Error(`Failed to analyze: ${error.message}`);
    }
    throw new Error("An unknown error occurred during analysis");
  }
}