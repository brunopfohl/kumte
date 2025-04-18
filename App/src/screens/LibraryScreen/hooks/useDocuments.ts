import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { Document, documentService } from '../../../services/FileService';

export const useDocuments = (navigation: any) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();

    const unsubscribeFocus = navigation.addListener('focus', () => {
      loadDocuments();
    });

    return () => {
      unsubscribeFocus();
    };
  }, [navigation, loadDocuments]);

  const handleImportDocument = async () => {
    setImporting(true);
    try {
      const document = await documentService.importDocument();
      if (document) {
        setDocuments(prev => [...prev, document]);
        Alert.alert('Success', 'Document imported successfully');
      }
    } catch (error) {
      console.log('Import cancelled or failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleRenameDocument = async (documentId: string, newName: string) => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a valid document name');
      return false;
    }

    try {
      const success = await documentService.renameDocument(documentId, newName.trim());
      if (success) {
        setDocuments(prevDocs => 
          prevDocs.map(d => 
            d.id === documentId ? { ...d, title: newName.trim() } : d
          )
        );
        Alert.alert('Success', 'Document renamed successfully');
        return true;
      } else {
        Alert.alert('Error', 'Failed to rename document');
        return false;
      }
    } catch (error) {
      console.error('Error renaming document:', error);
      Alert.alert('Error', 'An error occurred while renaming the document');
      return false;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const success = await documentService.deleteDocument(documentId);
      if (success) {
        setDocuments(prevDocs => prevDocs.filter(d => d.id !== documentId));
        return true;
      } else {
        Alert.alert('Error', 'Failed to delete document');
        return false;
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      Alert.alert('Error', 'An error occurred while deleting the document');
      return false;
    }
  };

  return {
    documents,
    loading,
    importing,
    selectedDocument,
    setSelectedDocument,
    loadDocuments,
    handleImportDocument,
    handleRenameDocument,
    handleDeleteDocument
  };
}; 