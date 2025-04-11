import { Alert, Platform, NativeModules } from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'image';
  uri: string;
  originalUri?: string; // Store the original content:// URI if available
  date: Date;
  dataUri?: string; // Store data URI for direct viewing
}

// Storage key for documents
const DOCUMENTS_STORAGE_KEY = 'app_documents';

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
  private initialized = false;
  private static instance: FileServiceClass;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): FileServiceClass {
    if (!FileServiceClass.instance) {
      FileServiceClass.instance = new FileServiceClass();
    }
    return FileServiceClass.instance;
  }

  /**
   * Initialize the service by loading saved documents
   */
  private async init() {
    if (this.initialized) return;
    
    try {
      await this.loadDocumentsFromStorage();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize FileService:', error);
      // Fall back to empty documents array
      this.documents = [];
    }
  }

  /**
   * Load documents from AsyncStorage
   */
  private async loadDocumentsFromStorage(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem(DOCUMENTS_STORAGE_KEY);
      
      if (jsonValue) {
        // Parse the JSON and ensure dates are converted back to Date objects
        const parsedDocs = JSON.parse(jsonValue);
        this.documents = parsedDocs.map((doc: any) => ({
          ...doc,
          date: new Date(doc.date)
        }));
        console.log(`Loaded ${this.documents.length} documents from storage`);
      } else {
        // No documents in storage yet, initialize with empty array
        this.documents = [];
        console.log('No documents found in storage');
      }
    } catch (error) {
      console.error('Error loading documents from storage:', error);
      throw error;
    }
  }

  /**
   * Save documents to AsyncStorage
   */
  private async saveDocumentsToStorage(): Promise<void> {
    try {
      // Create a lighter version of documents for storage
      // Don't store dataUri which can be very large
      const storageDocuments = this.documents.map(doc => {
        const { dataUri, ...lightDoc } = doc;
        return lightDoc;
      });
      
      const jsonValue = JSON.stringify(storageDocuments);
      await AsyncStorage.setItem(DOCUMENTS_STORAGE_KEY, jsonValue);
      console.log(`Saved ${storageDocuments.length} documents to storage (without data URIs)`);
    } catch (error) {
      console.error('Error saving documents to storage:', error);
      throw error;
    }
  }

  /**
   * Get all documents
   */
  static async getDocuments(): Promise<Document[]> {
    const instance = FileServiceClass.getInstance();
    if (!instance.initialized) {
      await instance.init();
    }
    return instance.documents;
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
  async addDocument(document: Omit<Document, 'id' | 'date'>): Promise<Document> {
    // Create a new document with generated ID and current date
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
      date: new Date(),
    };

    // Add to documents array
    this.documents.push(newDocument);
    
    // Save to persistent storage
    await this.saveDocumentsToStorage();
    
    return newDocument;
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
  async createDataUri(uri: string, mimeType: string): Promise<string> {
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
      // Ensure we use the proper options for persistent permissions
      const [result] = await pick({
        type: [types.pdf, types.images],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory', // Always copy to cache for reliable file:// access
        mode: 'open', // Explicitly use ACTION_OPEN_DOCUMENT
        // Request persistent permissions
        extraOptions: {
          persistableUriPermission: true,
          grantReadPermissionOnly: true
        }
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
          } else {
            // If no file copy, we need to make one to avoid permission issues
            console.log('No file copy provided by picker, creating one manually');
            try {
              const timestamp = Date.now();
              const extension = fileExtension || (documentType === 'pdf' ? 'pdf' : 'jpg');
              const fileName = `document_${timestamp}.${extension}`;
              const destPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
              
              // Copy the file to cache
              await RNFS.copyFile(result.uri, destPath);
              console.log('File copied successfully to:', destPath);
              
              // Update fileUri to use our cached copy
              fileUri = `file://${destPath}`;
            } catch (copyErr) {
              console.error('Failed to copy file to cache:', copyErr);
              // We'll continue with the content URI and handle permission issues elsewhere
            }
          }
          
          // For smaller files (< 5MB), create data URI for immediate viewing
          try {
            const path = fileUri.startsWith('file://') && Platform.OS === 'android' 
              ? fileUri.replace('file://', '') 
              : fileUri;
            
            const stats = await RNFS.stat(path);
            const fileSize = stats.size;
            console.log(`File size: ${fileSize} bytes`);
            
            // Only create data URI for files smaller than 5MB to prevent SQLite errors
            const MAX_SIZE_FOR_DATA_URI = 5 * 1024 * 1024; // 5MB
            if (fileSize < MAX_SIZE_FOR_DATA_URI) {
              const mimeType = documentType === 'pdf' ? 'application/pdf' : `image/${fileExtension}`;
              dataUri = await FileServiceClass.createDataUri(fileUri, mimeType);
              console.log('Created data URI for direct viewing');
            } else {
              console.log('File too large for data URI storage, will load on demand when needed');
            }
          } catch (statError) {
            console.log('Could not get file stats, skipping data URI creation:', statError);
          }
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
      
      // Save to persistent storage
      await this.saveDocumentsToStorage();
      
      console.log('Imported document:', newDocument);
      
      return newDocument;
    } catch (error: any) {
      // Handle cancellation by user
      if (error.code === 'DOCUMENT_PICKER_CANCELED') {
        console.log('User cancelled document picking');
        return null;
      }
      
      // todo: better handling per error type
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
          
          const instance = FileServiceClass.getInstance();
          instance.addDocument(newDoc)
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

  /**
   * Delete a document by ID
   */
  async deleteDocument(id: string): Promise<boolean> {
    const index = this.documents.findIndex(doc => doc.id === id);
    
    if (index !== -1) {
      this.documents.splice(index, 1);
      
      // Save changes to persistent storage
      await this.saveDocumentsToStorage();
      
      return true;
    }
    
    return false;
  }

  /**
   * Rename a document
   */
  async renameDocument(id: string, newName: string): Promise<boolean> {
    try {
      const docIndex = this.documents.findIndex(doc => doc.id === id);
      
      if (docIndex === -1) {
        console.error('Document not found:', id);
        return false;
      }

      // Update the document title
      this.documents[docIndex] = {
        ...this.documents[docIndex],
        title: newName
      };

      // Save the updated documents array
      await this.saveDocumentsToStorage();
      return true;
    } catch (error) {
      console.error('Error renaming document:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const documentService = FileServiceClass.getInstance();
// Export Document type (without redeclaring it)
// export type { Document }; 