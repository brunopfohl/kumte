import { useState } from 'react';
import { Alert } from 'react-native';
import { Document } from '../../../services/FileService';

export const useRenameModal = (onRenameDocument: (id: string, newName: string) => Promise<boolean>) => {
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [newDocumentName, setNewDocumentName] = useState('');

  const openRenameModal = (document: Document) => {
    setSelectedDocument(document);
    setNewDocumentName(document.title);
    setRenameModalVisible(true);
  };

  const closeRenameModal = () => {
    setRenameModalVisible(false);
  };

  const handleRename = async () => {
    if (!selectedDocument || !newDocumentName.trim()) {
      Alert.alert('Error', 'Please enter a valid document name');
      return;
    }

    const success = await onRenameDocument(selectedDocument.id, newDocumentName);
    if (success) {
      setRenameModalVisible(false);
    }
  };

  return {
    renameModalVisible,
    selectedDocument,
    newDocumentName,
    setNewDocumentName,
    openRenameModal,
    closeRenameModal,
    handleRename
  };
}; 