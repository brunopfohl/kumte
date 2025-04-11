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

  /**
   * Generate quiz questions from text using Google Gemini API
   * @param text Text to generate questions from
   * @param language Optional language code for response
   * @param pdfBase64 Optional base64 encoded PDF data
   * @returns JSON string containing quiz questions
   */
  public async generateQuizQuestions(
    text: string, 
    language?: string,
    pdfBase64?: string
  ): Promise<string> {
    try {
      // Construct prompt for quiz generation
      const prompt = `
        Generate 5 multiple choice questions based on the following text.
        Each question should have 4 options and one correct answer.
        Return the questions in the following JSON format:
        [
          {
            "question": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": 0,
            "explanation": "Explanation of the correct answer"
          }
        ]
        
        Only return the JSON array, no other text.
        Escape all special characters properly to ensure valid JSON.
        Do not wrap the response in markdown code blocks or any other formatting.
        Do not include any additional text before or after the JSON array.
        
        ${language && language !== 'en' ? `Please provide the questions in ${language} language.` : ''}
        
        Here is the text to analyze: "${text}"
      `;
      
      // Create contents array
      const contents: any[] = [{ text: prompt }];
      
      // If PDF data is provided, add it to the contents
      if (pdfBase64) {
        contents.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64
          }
        });
      }
      
      // Make API request
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: contents,
      });
      
      // Extract text from response
      let responseText = response.text || '';
      
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }
      
      // Remove markdown code block formatting if present
      responseText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      // Remove any non-JSON text before or after the array
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
      }
      responseText = jsonMatch[0];
      
      // Try to parse the response as JSON to validate it
      try {
        const parsed = JSON.parse(responseText);
        if (!Array.isArray(parsed)) {
          throw new Error('Response is not a JSON array');
        }
        return responseText;
      } catch (parseError) {
        console.error('Invalid JSON response from Gemini:', responseText);
        throw new Error('Invalid JSON response from Gemini API');
      }
    } catch (error) {
      console.error('Error generating quiz questions with Gemini API:', error);
      throw new Error(`Failed to generate quiz questions: ${(error as Error).message}`);
    }
  }

  /**
   * Extract keywords from text using Google Gemini API
   * @param text Text to extract keywords from
   * @param language Optional language code for response
   * @param pdfBase64 Optional base64 encoded PDF data
   * @returns JSON string containing keywords and their relevance
   */
  public async extractKeywords(
    text: string | null, 
    language?: string,
    pdfBase64?: string
  ): Promise<string> {
    try {
      // Construct prompt for keyword extraction
      const prompt = `
        Extract the 5 most important keywords from the following text.
        For each keyword, provide a brief summary of its relevance.
        Return the results in the following JSON format:
        [
          {
            "word": "keyword",
            "summary": "brief explanation of relevance",
            "relevance": 0.8
          }
        ]
        
        ${language && language !== 'en' ? `Please provide the keywords in ${language} language.` : ''}
        
        Format the output as valid JSON that can be parsed. Only return the JSON array, no other text.
        Do not wrap the response in markdown code blocks or any other formatting.
      `;
      
      // Create contents array
      const contents: any[] = [{ text: prompt }];
      
      // If PDF data is provided, add it to the contents
      if (pdfBase64) {
        contents.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64
          }
        });
      }
      
      // Make API request
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: contents,
      });
      
      // Extract text from response
      let responseText = response.text || '';
      
      // Remove markdown code block formatting if present
      responseText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      
      // Try to parse the response as JSON to validate it
      try {
        JSON.parse(responseText);
        return responseText;
      } catch (parseError) {
        console.error('Invalid JSON response from Gemini:', responseText);
        throw new Error('Invalid JSON response from Gemini API');
      }
    } catch (error) {
      console.error('Error extracting keywords with Gemini API:', error);
      throw new Error(`Failed to extract keywords: ${(error as Error).message}`);
    }
  }
}

// Export a singleton instance of the service
export const geminiService = new GeminiService(); 