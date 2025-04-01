import { Alert, Platform, NativeModules } from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'image';
  uri: string;
  originalUri?: string; // Store the original content:// URI if available
  date: Date;
}

// Mock document data for now - will be replaced with actual API/storage calls
const mockDocuments: Document[] = [
  { id: '1001', title: 'Research Paper', type: 'pdf', uri: 'mock-uri-1', date: new Date('2023-05-10') },
  { id: '1002', title: 'Meeting Notes', type: 'image', uri: 'mock-uri-2', date: new Date('2023-06-12') },
  { id: '1003', title: 'Project Proposal', type: 'pdf', uri: 'mock-uri-3', date: new Date('2023-07-23') },
];

/**
 * Service to handle document operations
 * This abstraction will make it easier to switch between local storage and API later
 */
export class FileService {
  private documents: Document[] = [];

  /**
   * Get all documents
   */
  static async getDocuments(): Promise<Document[]> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDocuments);
      }, 500);
    });
  }

  /**
   * Get a document by ID
   */
  static async getDocumentById(id: string): Promise<Document | undefined> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const document = mockDocuments.find(doc => doc.id === id);
        resolve(document);
      }, 300);
    });
  }

  /**
   * Add a new document
   */
  static async addDocument(document: Omit<Document, 'id' | 'date'>): Promise<Document> {
    // Create a new document with generated ID and current date
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
      date: new Date(),
    };

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        mockDocuments.push(newDocument);
        resolve(newDocument);
      }, 500);
    });
  }

  /**
   * Delete a document
   */
  static async deleteDocument(id: string): Promise<boolean> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockDocuments.findIndex(doc => doc.id === id);
        if (index !== -1) {
          mockDocuments.splice(index, 1);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }

  /**
   * Import a document using the Storage Access Framework and convert to file URI
   * Creates a local copy in the app's cache directory for reliable access
   */
  async importDocument(): Promise<Document | null> {
    try {
      // Use ACTION_OPEN_DOCUMENT via @react-native-documents/picker
      const [result] = await pick({
        type: [types.pdf, types.images],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory', // Always copy to cache for reliable file:// access
      });

      console.log('File selected:', result);
      
      if (!result.uri) {
        throw new Error("Document URI is undefined");
      }

      // Create document object
      const fileExtension = result.name?.split('.').pop()?.toLowerCase() || '';
      const documentType = fileExtension === 'pdf' ? 'pdf' : 'image';
      
      // Get a file:// URI from the result
      let fileUri = result.uri;
      const originalUri = result.uri;
      
      // For content:// URIs, create a local copy manually if necessary
      if (result.uri.startsWith('content://')) {
        // First check if we already have a file copy from the picker
        const response = result as any; // Use any to bypass TypeScript checking
        if (response.fileCopyUri) {
          fileUri = response.fileCopyUri;
          console.log('Using copied file URI from picker:', fileUri);
        } else {
          try {
            const timestamp = Date.now();
            const fileName = result.name || `document_${timestamp}.${fileExtension || 'pdf'}`;
            const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
            
            // On Android, use copyFile
            if (Platform.OS === 'android') {
              console.log('Copying content URI to file URI:', result.uri, ' -> ', destPath);
              await RNFS.copyFile(result.uri, destPath);
              fileUri = `file://${destPath}`;
              console.log('Copied to file URI:', fileUri);
            }
          } catch (copyError) {
            console.warn('Failed to copy file, falling back to content URI:', copyError);
            // If copy fails, use original URI as fallback
            fileUri = result.uri;
          }
        }
      }

      // Create new document
      const newDocument: Document = {
        id: Date.now().toString(),
        title: result.name || 'Untitled Document',
        type: documentType,
        uri: fileUri,
        originalUri: originalUri !== fileUri ? originalUri : undefined,
        date: new Date(),
      };

      // Store document
      this.documents.push(newDocument);
      console.log('Imported document:', newDocument);
      
      return newDocument;
    } catch (error: any) {
      // Handle cancellation by user
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('User cancelled document picking');
        return null;
      }
      
      console.error('Error importing document:', error);
      throw error;
    }
  }

  /**
   * Capture a document (simulated for now)
   */
  static async captureDocument(): Promise<Document | null> {
    // Simulate camera capture - in a real app this would use camera
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const newDoc = {
            title: 'Captured Document',
            type: 'image' as const,
            uri: `mock-captured-${Date.now()}`
          };
          
          FileService.addDocument(newDoc)
            .then(document => resolve(document))
            .catch(() => resolve(null));
        } catch (error) {
          console.error('Error capturing document:', error);
          resolve(null);
        }
      }, 1000);
    });
  }

  /**
   * Get all documents that have been imported
   */
  getDocuments(): Document[] {
    return [...this.documents];
  }

  /**
   * Get a document by ID
   */
  getDocumentById(id: string): Document | undefined {
    return this.documents.find(doc => doc.id === id);
  }
}

// Singleton instance
export const documentService = new FileService();
export type { Document };
export { FileService }; 