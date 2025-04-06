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
      if (document.uri.startsWith('data:')) {
        documentUriCache[cacheKey] = document.uri;
        return document.uri;
      }
      
      // For content:// or file:// URIs
      if (document.uri.startsWith('content://') || document.uri.startsWith('file://')) {
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
              // Read file as base64
              const base64Data = await RNFS.readFile(path, 'base64');
              const dataUri = `data:application/pdf;base64,${base64Data}`;
              
              // Cache the result
              documentUriCache[cacheKey] = dataUri;
              
              return dataUri;
            }
          } catch (error) {
            console.error('Failed to convert document to data URI:', error);
            throw new Error(`Cannot read document: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // For images, convert to data URI if needed
        if (document.type === 'image') {
          try {
            const path = document.uri.startsWith('file://') && Platform.OS === 'android' 
              ? document.uri.replace('file://', '') 
              : document.uri;
            
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
   * Analyze document using Gemini API
   * @param document Document to analyze
   * @param instructions Instructions for analysis
   * @param language Optional language code for response
   */
  static async analyzeDocumentWithGemini(
    document: Document,
    instructions: string = "Summarize this document",
    language?: string
  ): Promise<string> {
    try {
      console.log('Analyzing document with Gemini:', document.id);
      
      // Ensure we have a valid document
      if (!document || !document.uri) {
        throw new Error("Invalid document");
      }
      
      // For PDF documents
      if (document.type === 'pdf') {
        // Get document data as base64
        let base64Data: string;
        
        // If we already have a data URI
        if (document.dataUri && document.dataUri.startsWith('data:application/pdf;base64,')) {
          base64Data = document.dataUri.split(',')[1];
          console.log('Using existing data URI for Gemini analysis');
        } else {
          // Otherwise read the file
          console.log('Reading document for Gemini analysis:', document.uri);
          const path = document.uri.startsWith('file://') && Platform.OS === 'android' 
            ? document.uri.replace('file://', '') 
            : document.uri;
          
          // Check if path is already a data URI
          if (path.startsWith('data:application/pdf;base64,')) {
            base64Data = path.split(',')[1];
            console.log('Path is already a data URI, extracted base64 data');
          } else {
            base64Data = await RNFS.readFile(path, 'base64');
            console.log('Document read successfully, length:', base64Data.length);
          }
        }
        
        // Call the API with the PDF data
        return await apiClient.analyzeText(instructions, undefined, base64Data, language);
      } 
      
      // For non-PDF documents
      console.log('Non-PDF document, using text analysis instead');
      const content = await DocumentService.getDocumentContent(document);
      return await apiClient.analyzeText(content, instructions);
    } catch (error) {
      console.error('Error analyzing document with Gemini:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 