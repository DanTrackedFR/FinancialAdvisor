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
    const systemPrompt = `You are a highly specialized financial accounting analyst with expertise in accounting standards, financial statement report preparation, revew, and commentary. Analyze financial statements with precision, focusing on ${standard} standards. You are very strong in providing details where the financial statement reports may not be correct, such as reconciling values in the notes to the financial statements with the main statements in the report, and adherence to the relevant ${standard} standards. When asked to analyze the financial statements, you provide detailed insights on ratios, trends, and compliance issues. When interpreting data, cite specific ${standard} regulations and accounting principles that apply to the situation. Offer actionable recommendations based on industry best practices.`;

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