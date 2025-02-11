import OpenAI from "openai";
import { StandardType } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Implement exponential backoff retry
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (error?.response?.status !== 429) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

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

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }

    const operation = async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert financial analyst specializing in accounting standards compliance.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      if (!response.choices[0]?.message?.content) {
        throw new Error("No valid response received from OpenAI");
      }

      return response.choices[0].message.content;
    };

    console.log("Attempting analysis with retry mechanism...");
    const result = await retryWithBackoff(operation);
    console.log("Analysis completed successfully");
    return result;

  } catch (error: any) {
    console.error("Error analyzing financial statement:", error);

    if (error.response?.status === 401) {
      throw new Error("Invalid OpenAI API key");
    }

    if (error.response?.status === 429) {
      throw new Error("OpenAI rate limit exceeded. The service is currently experiencing high demand. Please try again in a few minutes.");
    }

    throw new Error(`Failed to analyze financial statement: ${error.message}`);
  }
}