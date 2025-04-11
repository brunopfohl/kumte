/**
 * API Client for Kumte PDF application
 * 
 * Provides a centralized service for all API requests
 */

import { Platform } from 'react-native';

// Static tunnel subdomain to match the server
const TUNNEL_SUBDOMAIN = 'kumte-pdf-api-8749';
const TUNNEL_URL = `https://${TUNNEL_SUBDOMAIN}.loca.lt`;

class ApiClient {
  private baseUrl: string;
  private isConnected: boolean = false;
  
  constructor() {
    this.baseUrl = this.getBaseUrl();
  }
  
  /**
   * Get the appropriate base URL based on platform and environment
   */
  private getBaseUrl(): string {
    // When running on a real Android device, use the tunnel URL
    if (Platform.OS === 'android') {
      return `${TUNNEL_URL}/api`;
    }
    
    // For iOS simulator or web or dev environment, use localhost
    return 'http://localhost:3000/api';
  }
  
  /**
   * Set a custom API base URL if needed
   */
  public setBaseUrl(url: string): void {
    if (!url) return;
    
    try {
      new URL(url); // Validate URL format
      this.baseUrl = url.endsWith('/api') ? url : `${url}/api`;
      console.log(`API base URL set to: ${this.baseUrl}`);
    } catch (error) {
      console.error('Invalid API URL format:', url);
    }
  }
  
  /**
   * Get the current API base URL
   */
  public getApiUrl(): string {
    return this.baseUrl;
  }
  
  /**
   * Check if the API is reachable
   */
  public async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/gemini`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      console.error('API connection check failed:', error);
      this.isConnected = false;
      return false;
    }
  }
  
  /**
   * Analyze text or document using Gemini API
   * @param text Text to analyze or instructions for PDF analysis
   * @param instructions Optional additional instructions for analysis
   * @param pdfBase64 Optional Base64 encoded PDF data
   * @param language Optional language code for response
   * @returns Analysis result
   */
  public async analyzeText(
    text: string, 
    instructions: string = "Explain this text",
    pdfBase64?: string,
    language?: string
  ): Promise<string> {
    if (!text?.trim() && !pdfBase64) {
      return "No content provided for analysis";
    }
    
    try {
      // Determine which endpoint to use based on whether we have PDF data
      const endpoint = pdfBase64 
        ? `${this.baseUrl}/gemini/analyze-pdf`
        : `${this.baseUrl}/gemini/analyze`;
      
      console.log(`Calling Gemini API at: ${endpoint}`);
      
      // Prepare request body based on what we're analyzing
      const requestBody = pdfBase64
        ? { 
            pdfBase64: pdfBase64, 
            instructions: text, // When sending PDF, text is used as instructions
            language: language
          }
        : { 
            text: text,
            instructions: instructions
          };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return pdfBase64 ? result.data.analysis : result.data.analysis;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to connect to Gemini API';
        
      return `Unable to get analysis: ${errorMessage}\n\nCheck if the API server is running and accessible at ${this.baseUrl}.`;
    }
  }

  /**
   * Generate quiz questions from text using Gemini API
   * @param text Text to generate questions from
   * @param language Optional language code for response
   * @param base64Data Optional Base64 encoded data for analysis
   * @returns JSON string containing quiz questions
   */
  public async generateQuizQuestions(
    text: string,
    language?: string,
    base64Data?: string
  ): Promise<string> {
    try {
      const endpoint = `${this.baseUrl}/gemini/generate-quiz`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          language: language,
          pdfBase64: base64Data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.quiz;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate quiz questions';
        
      return `Unable to generate quiz questions: ${errorMessage}`;
    }
  }

  /**
   * Extract keywords from text using Gemini API
   * @param text Text to extract keywords from
   * @param language Optional language code for response
   * @param base64Data Optional Base64 encoded data for analysis
   * @returns JSON string containing keywords and their relevance
   */
  public async extractKeywords(
    text: string,
    language?: string,
    base64Data?: string
  ): Promise<string> {
    try {
      const endpoint = `${this.baseUrl}/gemini/extract-keywords`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          language: language,
          pdfBase64: base64Data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.keywords;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error extracting keywords:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to extract keywords';
        
      return `Unable to extract keywords: ${errorMessage}`;
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// For easy access to the tunnel URL across the app
export const API_TUNNEL_URL = TUNNEL_URL; 