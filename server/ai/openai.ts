import OpenAI from "openai";
import { StandardType } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeFinancialStatement(
  content: string,
  standard: StandardType,
): Promise<{
  summary: string;
  reviewPoints: string[];
  improvements: string[];
  performance: string;
}> {
  const prompt = `Analyze the following financial statement according to ${standard} standards. 
  Provide a detailed analysis with the following components in JSON format:
  - summary: A concise overview of the financial statement
  - reviewPoints: An array of key review points and potential issues
  - improvements: An array of suggested improvements
  - performance: Commentary on financial performance

  Financial Statement:
  ${content}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error(`Failed to analyze financial statement: ${error.message}`);
  }
}

export async function generateFollowupResponse(
  conversation: { role: string; content: string }[],
  standard: StandardType,
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert in ${standard} financial reporting standards. Provide detailed, technical responses to questions about financial statements.`,
        },
        ...conversation,
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}
