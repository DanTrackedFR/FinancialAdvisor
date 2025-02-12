import OpenAI from "openai";
import { StandardType } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OpenAI API key is not configured");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export async function analyzeFinancialStatement(
  inputContent: string,
  standard: StandardType,
): Promise<string> {
  try {
    console.log("Starting financial statement analysis for", standard);
    console.log("Content length:", inputContent.length);

    const systemPrompt = `You are a financial expert specializing in ${standard} standards. 
    Provide clear, concise responses to questions about financial statements and reporting.
    Format your response as a detailed but conversational explanation.
    Focus on accurate, practical information that helps users understand their financial data.`;

    console.log("Calling OpenAI analysis...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: inputContent }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log("OpenAI response received");
    console.log("Response status:", response.id ? "Success" : "No ID");
    console.log("Response choices:", response.choices?.length || 0);

    if (!response.choices[0]?.message?.content) {
      console.error("No content in OpenAI response");
      throw new Error("No response received from OpenAI");
    }

    const content = response.choices[0].message.content;
    console.log("OpenAI response content length:", content.length);
    return content;

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