import OpenAI from "openai";
import { StandardType } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeFinancialStatement(
  content: string,
  standard: StandardType,
): Promise<string> {
  try {
    console.log("Initiating OpenAI request...");

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a financial expert specializing in ${standard} standards. Provide concise, accurate responses.`
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log("OpenAI response received");

    if (!response.choices[0].message?.content) {
      console.error("No content in OpenAI response");
      throw new Error("No response received from OpenAI");
    }

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Analysis Error:", error);
    console.error("Error details:", error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : "Unknown error type");

    if (error instanceof Error) {
      if (error.message.includes("Incorrect API key")) {
        throw new Error("Authentication failed with AI service");
      }
      throw new Error(`Failed to analyze financial statement: ${error.message}`);
    }
    throw new Error("An unknown error occurred during financial analysis");
  }
}

export async function generateFollowupResponse(
  conversation: { role: string; content: string }[],
  standard: StandardType,
): Promise<string> {
  try {
    console.log("Generating followup response for standard:", standard);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert in ${standard} financial reporting standards. 
          Provide detailed, technical responses while maintaining clarity. 
          Focus on practical implications and compliance requirements.`
        },
        ...conversation.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      console.error("No content in OpenAI followup response");
      throw new Error("No response received from OpenAI");
    }

    console.log("Successfully generated followup response");
    return content;
  } catch (error) {
    console.error("OpenAI Followup Error:", error);
    console.error("Error details:", error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : "Unknown error type");

    if (error instanceof Error) {
      throw new Error(`Failed to generate response: ${error.message}`);
    }
    throw new Error("An unknown error occurred during response generation");
  }
}