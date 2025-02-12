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
  compliance: {
    status: "compliant" | "partially_compliant" | "non_compliant";
    issues: string[];
  };
}> {
  const prompt = `As a financial expert, analyze this financial statement according to ${standard} standards.
  Provide a detailed analysis covering:
  1. Overall summary
  2. Key review points and potential issues
  3. Suggested improvements
  4. Financial performance analysis
  5. Compliance status with ${standard}

  Respond in JSON format with the following structure:
  {
    "summary": "Brief overview of the financial statement",
    "reviewPoints": ["Array of key points and issues found"],
    "improvements": ["Array of suggested improvements"],
    "performance": "Detailed financial performance analysis",
    "compliance": {
      "status": "compliant|partially_compliant|non_compliant",
      "issues": ["Array of compliance issues if any"]
    }
  }

  Financial Statement:
  ${content}`;

  try {
    console.log("Initiating OpenAI request with model: gpt-4o");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert financial analyst specializing in ${standard} standards. Focus on providing accurate, actionable insights.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    console.log("OpenAI response received:", response.choices[0].message?.content ? "Content present" : "No content");

    if (!response.choices[0].message.content) {
      console.error("No response content received from OpenAI");
      throw new Error("No response received from OpenAI");
    }

    try {
      const analysis = JSON.parse(response.choices[0].message.content);
      console.log("Successfully parsed OpenAI response");
      return analysis;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw response:", response.choices[0].message.content);
      throw new Error("Failed to parse AI response");
    }
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
      model: "gpt-4o",
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
      ]
    });

    const content = response.choices[0].message.content;
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