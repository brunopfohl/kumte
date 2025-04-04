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
  dataUri?: string; // Store data URI for direct viewing
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
class FileServiceClass {
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
   * Process a content:// URI into a data URI for viewing
   */
  static async createDataUri(uri: string, mimeType: string): Promise<string> {
    try {
      console.log(`Converting ${uri} to data URI`);
      
      // For content:// or file:// URIs
      if (uri.startsWith('content://') || uri.startsWith('file://')) {
        try {
          // Get file stats to check size
          const path = uri.startsWith('file://') && Platform.OS === 'android' 
            ? uri.replace('file://', '') 
            : uri;
          
          let fileSize = 0;
          try {
            // For content URIs, this might fail but we'll still try to read the file
            const stats = await RNFS.stat(path);
            fileSize = stats.size;
            console.log(`File size: ${fileSize} bytes`);
            
            // Check if file is too large (>50MB) for direct data URI conversion
            const MAX_SAFE_SIZE = 50 * 1024 * 1024; // 50MB limit for data URIs
            if (fileSize > MAX_SAFE_SIZE) {
              console.log('File too large for data URI, creating temp file copy instead');
              
              // For large files, create a copy in cache instead of data URI
              const timestamp = Date.now();
              const extension = path.split('.').pop() || (mimeType.includes('pdf') ? 'pdf' : 'jpg');
              const fileName = `large_file_${timestamp}.${extension}`;
              const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
              
              console.log(`Copying large file to: ${destPath}`);
              await RNFS.copyFile(path, destPath);
              
              // Verify the copy worked
              const fileExists = await RNFS.exists(destPath);
              if (!fileExists) {
                throw new Error('Failed to create temp file copy');
              }
              
              // Return file:// URI instead of data URI
              return `file://${destPath}`;
            }
          } catch (statError) {
            console.log('Could not get file stats, will attempt to read anyway:', statError);
          }
          
          // For reasonable size files, read as base64
          console.log('Reading file to base64');
          const base64Data = await RNFS.readFile(path, 'base64');
          
          if (!base64Data || base64Data.length === 0) {
            throw new Error('No data read from file');
          }
          
          return `data:${mimeType};base64,${base64Data}`;
        } catch (error) {
          console.error('Error reading URI:', error);
          throw error;
        }
      }
      
      throw new Error(`Unsupported URI scheme: ${uri}`);
    } catch (error) {
      console.error('Failed to create data URI:', error);
      throw error;
    }
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
      
      // For content:// URIs
      let dataUri: string | undefined;
      if (result.uri.startsWith('content://')) {
        try {
          // First check if we already have a file copy from the picker
          const response = result as any; // Use any to bypass TypeScript checking
          if (response.fileCopyUri) {
            fileUri = response.fileCopyUri;
            console.log('Using copied file URI from picker:', fileUri);
          }
          
          // Create a data URI for immediate viewing regardless of if we have a file copy
          const mimeType = documentType === 'pdf' ? 'application/pdf' : `image/${fileExtension}`;
          dataUri = await FileServiceClass.createDataUri(result.uri, mimeType);
          console.log('Created data URI for direct viewing');
        } catch (copyError) {
          console.warn('Failed during content URI processing:', copyError);
          // Still use original URI as fallback
          fileUri = result.uri;
        }
      }

      // Create new document
      const newDocument: Document = {
        id: Date.now().toString(),
        title: result.name || 'Untitled Document',
        type: documentType,
        uri: fileUri,
        originalUri: originalUri !== fileUri ? originalUri : undefined,
        dataUri,
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
          
          FileServiceClass.addDocument(newDoc)
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

// Export the class and create a singleton instance
export const FileService = FileServiceClass;
export const documentService = new FileServiceClass();
// Export Document type (without redeclaring it)
// export type { Document }; 