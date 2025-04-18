import React from 'react';
import { SafeAreaView, StatusBar, View, StyleSheet } from 'react-native';
import { LibraryScreenProps } from '../../types';
import { useDocuments } from './hooks/useDocuments';
import { useDocumentFilters } from './hooks/useDocumentFilters';
import { useRenameModal } from './hooks/useRenameModal';
import { useOptionsModal } from './hooks/useOptionsModal';
import { Header } from './components/Header';
import { ActionButtons } from './components/ActionButtons';
import { FilterTabs } from './components/FilterTabs';
import { DocumentList } from './components/DocumentList';
import { RenameModal } from './components/RenameModal';
import { DocumentOptionsModal } from './components/DocumentOptionsModal';
import { Document } from '../../services/FileService';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const { 
    documents, 
    loading, 
    importing, 
    handleImportDocument, 
    handleRenameDocument,
    handleDeleteDocument 
  } = useDocuments(navigation);
  
  const { 
    searchQuery, 
    setSearchQuery, 
    activeFilter, 
    setActiveFilter, 
    filteredDocuments 
  } = useDocumentFilters(documents);

  const { 
    renameModalVisible, 
    selectedDocument: renameDocument, 
    newDocumentName, 
    setNewDocumentName, 
    openRenameModal, 
    closeRenameModal, 
    handleRename 
  } = useRenameModal(handleRenameDocument);

  const navigateToViewer = (uri: string, type: "pdf" | "image") => {
    navigation.navigate('Viewer', { uri, type });
  };

  const { 
    optionsModalVisible, 
    selectedDocument: optionsDocument, 
    setOptionsModalVisible, 
    openOptionsModal, 
    handleViewDocument, 
    handleRenameDocument: triggerRename, 
    handleDeleteDocument: confirmDelete 
  } = useOptionsModal({
    onRename: openRenameModal,
    onDeleteDocument: handleDeleteDocument,
    onNavigateToViewer: navigateToViewer
  });

  const handleCaptureDocument = () => {
    navigation.navigate('Camera');
  };

  const handleDocumentPress = (document: Document) => {
    navigateToViewer(document.uri, document.type);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3498db" />
      
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
      />
      
      <ActionButtons 
        onImport={handleImportDocument} 
        onCapture={handleCaptureDocument} 
        importing={importing} 
      />
      
      <FilterTabs 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
      />
      
      <View style={styles.documentListContainer}>
        <DocumentList 
          documents={filteredDocuments}
          loading={loading}
          onDocumentPress={handleDocumentPress}
          onDocumentOptionsPress={openOptionsModal}
        />
      </View>

      <RenameModal
        visible={renameModalVisible}
        document={renameDocument}
        newName={newDocumentName}
        onNameChange={setNewDocumentName}
        onClose={closeRenameModal}
        onRename={handleRename}
      />

      <DocumentOptionsModal
        visible={optionsModalVisible}
        document={optionsDocument!}
        onClose={() => setOptionsModalVisible(false)}
        onView={handleViewDocument}
        onRename={triggerRename}
        onDelete={confirmDelete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  documentListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
}); 