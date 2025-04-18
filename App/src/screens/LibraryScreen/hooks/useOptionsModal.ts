import { useState } from 'react';
import { Alert } from 'react-native';
import { Document } from '../../../services/FileService';

type OptionsHandlers = {
  onRename: (document: Document) => void;
  onDeleteDocument: (id: string) => Promise<boolean>;
  onNavigateToViewer: (uri: string, type: "pdf" | "image") => void;
};

export const useOptionsModal = ({ onRename, onDeleteDocument, onNavigateToViewer }: OptionsHandlers) => {
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const openOptionsModal = (document: Document) => {
    setSelectedDocument(document);
    setOptionsModalVisible(true);
  };

  const handleViewDocument = () => {
    if (selectedDocument) {
      onNavigateToViewer(selectedDocument.uri, selectedDocument.type);
      setOptionsModalVisible(false);
    }
  };

  const handleRenameDocument = () => {
    if (selectedDocument) {
      onRename(selectedDocument);
      setOptionsModalVisible(false);
    }
  };

  const handleDeleteDocument = () => {
    if (selectedDocument) {
      Alert.alert(
        'Confirm Delete',
        `Are you sure you want to delete "${selectedDocument.title}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await onDeleteDocument(selectedDocument.id);
            }
          }
        ]
      );
      setOptionsModalVisible(false);
    }
  };

  return {
    optionsModalVisible,
    selectedDocument,
    setOptionsModalVisible,
    openOptionsModal,
    handleViewDocument,
    handleRenameDocument,
    handleDeleteDocument
  };
}; 