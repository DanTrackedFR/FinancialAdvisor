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
    const systemPrompt = `You are a knowledgeable financial advisor. Provide concise, accurate responses. For financial questions, include relevant ${standard} standards if applicable.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: inputContent }
      ],
      temperature: 0.7,
      max_tokens: 500, 
      presence_penalty: 0.0,
      frequency_penalty: 0.0,
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error("No response received from OpenAI");
    }

    return response.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Authentication failed with AI service. Please check your API key configuration.");
      }
      throw new Error(`Failed to analyze: ${error.message}`);
    }
    throw new Error("An unknown error occurred during analysis");
  }
}