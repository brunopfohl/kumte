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
   * Analyze text using Gemini API
   */
  public async analyzeText(text: string, instructions: string = "Explain this text"): Promise<string> {
    if (!text?.trim()) {
      return "No text provided for analysis";
    }
    
    try {
      console.log(`Calling Gemini API at: ${this.baseUrl}/gemini/analyze`);
      
      const response = await fetch(`${this.baseUrl}/gemini/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text: text,
          instructions: instructions
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.analysis;
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
   * Generate content using Gemini API
   */
  public async generateContent(prompt: string, modelName?: string): Promise<string> {
    if (!prompt?.trim()) {
      return "No prompt provided for generation";
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/gemini/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: prompt,
          modelName: modelName
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        return result.data.generatedText;
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to connect to Gemini API';
        
      return `Unable to generate content: ${errorMessage}\n\nCheck if the API server is running and accessible at ${this.baseUrl}.`;
    }
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// For easy access to the tunnel URL across the app
export const API_TUNNEL_URL = TUNNEL_URL; 