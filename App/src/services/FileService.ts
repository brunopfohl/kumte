import { Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'image';
  uri: string;
  date: string;
}

// Mock document data for now - will be replaced with actual API/storage calls
const mockDocuments: Document[] = [
  { id: '1001', title: 'Research Paper', type: 'pdf', uri: 'mock-uri-1', date: '10 May 2023' },
  { id: '1002', title: 'Meeting Notes', type: 'image', uri: 'mock-uri-2', date: '12 June 2023' },
  { id: '1003', title: 'Project Proposal', type: 'pdf', uri: 'mock-uri-3', date: '23 July 2023' },
];

/**
 * Service to handle document operations
 * This abstraction will make it easier to switch between local storage and API later
 */
export class FileService {
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
      date: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
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
   * Import a document using document picker
   */
  static async importDocument(type: 'pdf' | 'image'): Promise<Document | null> {
    try {
      const result = await DocumentPicker.pick({
        type: type === 'pdf' 
          ? [DocumentPicker.types.pdf]
          : [DocumentPicker.types.images]
      });

      if (result && result[0]) {
        const file = result[0];
        const newDoc = {
          title: file.name || (type === 'pdf' ? 'Imported PDF' : 'Imported Image'),
          type: type,
          uri: file.uri
        };
        
        return await FileService.addDocument(newDoc);
      }
    } catch (error: any) {
      // User cancelled the picker
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled document picker');
        return null;
      }
      console.error('Error importing document:', error);
      Alert.alert('Error', 'Failed to import document');
    }
    return null;
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
} 