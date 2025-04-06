import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Check if API key is defined
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
  process.exit(1);
}

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GenerationRequest {
  prompt: string;
  modelName?: string;
}

export class GeminiService {
  /**
   * Generate text content using Google Gemini API
   * @param request Object containing prompt and optional modelName
   * @returns Generated text content
   */
  public async generateContent(request: GenerationRequest): Promise<string> {
    try {
      // Default model if not provided
      const model = request.modelName || 'gemini-2.0-flash';
      
      // Make API request
      const response = await genAI.models.generateContent({
        model: model,
        contents: request.prompt,
      });
      
      // Extract text from response
      const responseText = response.text || '';
      
      return responseText;
    } catch (error) {
      console.error('Error generating content from Gemini API:', error);
      throw new Error(`Failed to generate content: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze text using Google Gemini API
   * @param text Text to analyze
   * @param instructions Optional instructions for analysis
   * @returns Analysis result
   */
  public async analyzeText(text: string, instructions?: string): Promise<string> {
    try {
      // Construct prompt for text analysis
      const prompt = instructions 
        ? `${instructions}\n\nText to analyze: ${text}`
        : `Analyze the following text: ${text}`;
      
      // Make API request
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      
      // Extract text from response
      const responseText = response.text || '';
      
      return responseText;
    } catch (error) {
      console.error('Error analyzing text with Gemini API:', error);
      throw new Error(`Failed to analyze text: ${(error as Error).message}`);
    }
  }
}

// Export a singleton instance of the service
export const geminiService = new GeminiService(); 