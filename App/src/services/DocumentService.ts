import { Document } from './FileService';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

// Cache for document URIs to avoid repeated processing
const documentUriCache: Record<string, string> = {};

/**
 * Service to handle document content and AI operations
 */
export class DocumentService {
  /**
   * Get document content (simulated for now)
   */
  static async getDocumentContent(document: Document): Promise<string> {
    // Simulate getting document content - in a real app this would parse the document
    return new Promise((resolve) => {
      setTimeout(() => {
        if (document.type === 'pdf') {
          resolve(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. 
          Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.

          Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, 
          euismod non, mi. Proin porttitor, orci nec nonummy molestie.

          Fusce neque. Etiam posuere lacus quis dolor. Praesent lectus.`);
        } else {
          resolve('Image document content (extracted text from OCR would appear here)');
        }
      }, 300);
    });
  }

  /**
   * Process a document URI to ensure it can be viewed
   * For content:// URIs, this will create a data URI
   */
  static async prepareDocumentForViewing(document: Document): Promise<string> {
    try {
      console.log('Preparing document for viewing:', document.uri);
      
      // Check if we have this document in the cache
      const cacheKey = `${document.id}-${document.uri}`;
      if (documentUriCache[cacheKey]) {
        console.log('Using cached URI for document:', document.id);
        return documentUriCache[cacheKey];
      }
      
      // If the document has a data URI already, cache and return it
      if (document.dataUri) {
        documentUriCache[cacheKey] = document.dataUri;
        return document.dataUri;
      }
      
      // Handle content:// URIs by making a copy if needed
      if (document.uri.startsWith('content://')) {
        console.log('Found content:// URI, creating a local copy to avoid permission issues');
        try {
          // Create a local copy to avoid permission issues
          const timestamp = Date.now();
          const extension = document.type === 'pdf' ? 'pdf' : 'jpg';
          const fileName = `temp_${document.id}_${timestamp}.${extension}`;
          const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
          
          // Copy the file to cache
          await RNFS.copyFile(document.uri, destPath);
          console.log('Created local copy at:', destPath);
          
          // Use the local file instead
          const localUri = `file://${destPath}`;
          documentUriCache[cacheKey] = localUri;
          return localUri;
        } catch (copyError) {
          console.error('Failed to create local copy from content URI:', copyError);
          // Continue with normal processing, might fail due to permissions
        }
      }
      
      // For file:// URIs
      if (document.uri.startsWith('file://')) {
        console.log('Converting local document to data URI');
        
        // For PDFs, convert to data URI
        if (document.type === 'pdf') {
          try {
            // For file:// URIs on Android, remove the prefix
            const path = document.uri.startsWith('file://') && Platform.OS === 'android' 
              ? document.uri.replace('file://', '') 
              : document.uri;
            
            // Check if path is already a data URI
            if (path.startsWith('data:application/pdf;base64,')) {
              const base64Data = path.split(',')[1];
              console.log('Path is already a data URI, extracted base64 data');
              const dataUri = path; // Path is already a data URI
              // Cache the result
              documentUriCache[cacheKey] = dataUri;
              return dataUri;
            } else {
              // Check file size before reading
              const stats = await RNFS.stat(path);
              if (stats.size > 20 * 1024 * 1024) { // 20MB limit
                console.log('File too large for data URI, using direct file path instead');
                // For very large PDFs, use the file:// URI directly
                documentUriCache[cacheKey] = document.uri;
                return document.uri;
              }
              
              // Read file as base64
              const base64Data = await RNFS.readFile(path, 'base64');
              const dataUri = `data:application/pdf;base64,${base64Data}`;
              
              // Cache the result
              documentUriCache[cacheKey] = dataUri;
              
              return dataUri;
            }
          } catch (error) {
            console.error('Failed to convert document to data URI:', error);
            // Fall back to file URI
            documentUriCache[cacheKey] = document.uri;
            return document.uri;
          }
        }
        
        // For images, convert to data URI if needed
        if (document.type === 'image') {
          try {
            const path = document.uri.startsWith('file://') && Platform.OS === 'android' 
              ? document.uri.replace('file://', '') 
              : document.uri;
            
            // Check file size before reading
            const stats = await RNFS.stat(path);
            if (stats.size > 5 * 1024 * 1024) { // 5MB limit for images
              console.log('Image too large for data URI, using direct file path instead');
              documentUriCache[cacheKey] = document.uri;
              return document.uri;
            }
            
            // Read file as base64
            const base64Data = await RNFS.readFile(path, 'base64');
            const dataUri = `data:image/${document.uri.split('.').pop()};base64,${base64Data}`;
            
            // Cache the result
            documentUriCache[cacheKey] = dataUri;
            
            return dataUri;
          } catch (error) {
            console.error('Failed to convert image to data URI:', error);
            // For images, we can fall back to the original URI
            documentUriCache[cacheKey] = document.uri;
            return document.uri;
          }
        }
      }
      
      // For URLs, return as-is but still cache
      documentUriCache[cacheKey] = document.uri;
      return document.uri;
    } catch (error) {
      console.error('Error preparing document for viewing:', error);
      throw error;
    }
  }

  /**
   * Convert document to base64 data
   * @param document Document to convert
   * @returns Base64 encoded document data
   */
  static async convertDocumentToBase64(document: Document): Promise<string> {
    try {
      // Ensure we have a valid document
      if (!document || !document.uri) {
        throw new Error("Invalid document");
      }
      
      // First, prepare the document for viewing - this will create local copies
      // of content URIs and handle permissions properly
      const preparedUri = await DocumentService.prepareDocumentForViewing(document);
      
      // For PDF documents
      if (document.type === 'pdf') {
        // If we already have a data URI
        if (preparedUri.startsWith('data:application/pdf;base64,')) {
          return preparedUri.split(',')[1];
        } else {
          // Otherwise read the file
          console.log('Reading document for base64 conversion:', preparedUri);
          const path = preparedUri.startsWith('file://') && Platform.OS === 'android' 
            ? preparedUri.replace('file://', '') 
            : preparedUri;
          
          // Read the file as base64
          return await RNFS.readFile(path, 'base64');
        }
      }
      
      // For non-PDF documents, get the content as text
      return await DocumentService.getDocumentContent(document);
    } catch (error) {
      console.error('Error converting document to base64:', error);
      throw new Error(`Failed to convert document to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate quiz questions from document content
   * @param document Document to analyze
   * @param textToAnalyze Specific text to generate questions from
   * @param language Optional language code for response
   */
  static async generateQuizQuestions(
    document: Document,
    textToAnalyze: string,
    language?: string
  ): Promise<string> {
    const base64Data = await DocumentService.convertDocumentToBase64(document);
    return await apiClient.generateQuizQuestions(textToAnalyze, language, base64Data);
  }

  /**
   * Analyze text with language support
   * @param document Document to analyze
   * @param text Text to analyze
   * @param instruction Analysis instruction
   * @param language Optional language code for response
   */
  static async analyzeText(
    document: Document,
    text: string,
    instruction: string = "Explain this text",
    language?: string
  ): Promise<string> {
    const base64Data = await DocumentService.convertDocumentToBase64(document);
    return await apiClient.analyzeText(text, instruction, base64Data, language);
  }

  /**
   * Extract keywords from text with language support
   * @param document Document to analyze
   * @param text Text to extract keywords from
   * @param language Optional language code for response
   */
  static async extractKeywords(
    document: Document,
    text: string,
    language?: string
  ): Promise<string> {
    const base64Data = await DocumentService.convertDocumentToBase64(document);
    return await apiClient.extractKeywords(text, language, base64Data);
  }
} 