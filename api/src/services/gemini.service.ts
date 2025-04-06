import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

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
  fileData?: {
    base64Data?: string;
    mimeType?: string;
    filePath?: string;
  };
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
      const model = request.modelName || 'gemini-1.5-flash';
      
      // Create contents array with the prompt
      const contents: any[] = [{ text: request.prompt }];
      
      // If file data is provided, add it to the contents
      if (request.fileData) {
        if (request.fileData.base64Data && request.fileData.mimeType) {
          // Use inline data for base64 encoded file
          contents.push({
            inlineData: {
              mimeType: request.fileData.mimeType,
              data: request.fileData.base64Data
            }
          });
        } else if (request.fileData.filePath) {
          // Read file directly from disk
          try {
            const data = readFileSync(request.fileData.filePath);
            const base64Data = data.toString('base64');
            const mimeType = request.fileData.mimeType || 'application/pdf';
            
            contents.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            });
          } catch (fileError) {
            console.error('Error reading file:', fileError);
            throw new Error(`Failed to read file: ${(fileError as Error).message}`);
          }
        }
      }
      
      // Make API request
      const response = await genAI.models.generateContent({
        model: model,
        contents: contents,
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
        model: 'gemini-1.5-flash',
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

  /**
   * Analyze PDF document using Google Gemini API
   * @param pdfBase64 Base64 encoded PDF data
   * @param instructions Instructions for analysis
   * @param language Optional language to use for analysis and response
   * @returns Analysis result
   */
  public async analyzePDF(
    pdfBase64: string, 
    instructions: string,
    language?: string
  ): Promise<string> {
    try {
      // Construct prompt with language awareness if provided
      let prompt = instructions;
      
      // Add language instruction if provided
      if (language && language !== 'en') {
        prompt = `${instructions}\n\nPlease respond in ${language} language.`;
      }
      
      // Create contents array
      const contents: any[] = [{ text: prompt }];
      
      // Add PDF data
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64
        }
      });
      
      // Make API request
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: contents,
      });
      
      // Extract text from response
      const responseText = response.text || '';
      
      return responseText;
    } catch (error) {
      console.error('Error analyzing PDF with Gemini API:', error);
      throw new Error(`Failed to analyze PDF: ${(error as Error).message}`);
    }
  }
}

// Export a singleton instance of the service
export const geminiService = new GeminiService(); 