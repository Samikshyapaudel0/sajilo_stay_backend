import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../configs/constant";
import { HttpException } from "../exceptions/http-exception";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class GeminiService {
  private model;

  constructor() {
    console.log("GeminiService - GEMINI_API_KEY configured:", !!GEMINI_API_KEY);
    console.log("GeminiService - GEMINI_API_KEY length:", GEMINI_API_KEY?.length || 0);
    if (!GEMINI_API_KEY) {
      throw new HttpException(500, "GEMINI_API_KEY is not configured");
    }
    try {
      this.model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      console.log("GeminiService - model initialized successfully");
    } catch (error) {
      console.error("GeminiService - model initialization failed:", error);
      throw new HttpException(500, "Failed to initialize Gemini model");
    }
  }

  async generateResponse(prompt: string, context?: string, systemPrompt?: string): Promise<string> {
    try {
      console.log("GeminiService - generateResponse called");
      console.log("GeminiService - prompt:", prompt);
      console.log("GeminiService - context length:", context?.length || 0);
      console.log("GeminiService - systemPrompt:", systemPrompt?.substring(0, 100) || "none");
      
      let fullPrompt = "";

      if (systemPrompt) {
        fullPrompt += `System: ${systemPrompt}\n\n`;
      }

      if (context) {
        fullPrompt += `Context:\n${context}\n\n`;
      }

      fullPrompt += `User: ${prompt}`;

      console.log("GeminiService - calling model.generateContent");
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();
      console.log("GeminiService - response received, length:", text.length);
      return text;
    } catch (error: any) {
      console.error("Gemini API Error Status Code:", error.status || error.statusCode || "N/A");
      console.error("Gemini API Error Message:", error.message);
      console.error("Gemini API Error Response Body:", JSON.stringify(error.response || error, null, 2));
      console.error("Gemini API Error Stack:", error.stack);
      throw new HttpException(500, `Gemini API Error: ${error.message}`);
    }
  }
}
