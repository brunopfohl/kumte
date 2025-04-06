/**
 * API Configuration Utility
 * 
 * This utility helps configure the API endpoint URLs, particularly when using
 * localtunnel to expose the API server to the internet.
 */

import { apiClient, API_TUNNEL_URL } from '../services/apiClient';

/**
 * Configure the API with a custom URL if needed
 * 
 * @param customUrl The full API URL (e.g., "https://your-custom-domain.com")
 * @returns A boolean indicating if the configuration was successful
 */
export const configureApiUrl = (customUrl: string): boolean => {
  if (!customUrl || typeof customUrl !== 'string') {
    console.error('Invalid URL provided');
    return false;
  }

  try {
    // Validate URL format
    new URL(customUrl);
    
    // Set the custom URL in the API client
    apiClient.setBaseUrl(customUrl);
    
    console.log(`API URL configured: ${customUrl}`);
    return true;
  } catch (error) {
    console.error('Invalid URL format:', customUrl);
    return false;
  }
};

/**
 * Get the current API URL being used
 */
export const getCurrentApiUrl = (): string => {
  return apiClient.getApiUrl();
};

/**
 * Get the tunnel URL for the API
 */
export const getApiTunnelUrl = (): string => {
  return API_TUNNEL_URL;
};

/**
 * Check if the API is reachable
 */
export const checkApiConnection = async (): Promise<boolean> => {
  return await apiClient.checkConnection();
};

/**
 * Instructions for connecting to the API
 */
export const getApiConnectionInstructions = (): string => {
  return `
To connect to the Gemini API from an Android tablet:

1. Make sure the API server is running with localtunnel enabled
   - The server will use the subdomain: ${API_TUNNEL_URL.replace('https://', '').replace('.loca.lt', '')}
   - The full tunnel URL is: ${API_TUNNEL_URL}

2. API requests will automatically use this URL when running on Android
   - The app will attempt to connect to: ${API_TUNNEL_URL}/api

3. If you need to use a different URL, call:
   import { configureApiUrl } from './utils/apiConfig';
   configureApiUrl('https://your-custom-domain.com');
`;
}; 