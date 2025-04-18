import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Document } from '../../../services/FileService';
import { DocumentItem } from './DocumentItem';
import Icon from '../../../components/icons';

const { width } = Dimensions.get('window');

interface DocumentListProps {
  documents: Document[];
  loading: boolean;
  onDocumentPress: (document: Document) => void;
  onDocumentOptionsPress: (document: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading,
  onDocumentPress,
  onDocumentOptionsPress
}) => {
  const getEmptyMessage = () => {
    return {
      title: 'Your library is empty',
      subtitle: 'Import or capture documents to get started'
    };
  };

  const renderDocumentItem = ({ item: doc }: { item: Document }) => (
    <DocumentItem
      document={doc}
      onPress={onDocumentPress}
      onOptionsPress={onDocumentOptionsPress}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#3498db" size="large" />
        <Text style={styles.loadingText}>
          Loading your documents
        </Text>
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Icon name="file" size={48} color="#a8b3cf" style={styles.emptyIcon} />
        </View>
        <Text style={styles.emptyText}>{getEmptyMessage().title}</Text>
        <Text style={styles.emptySubText}>{getEmptyMessage().subtitle}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={documents}
      renderItem={renderDocumentItem}
      keyExtractor={(doc, index) => `doc-${doc.id}-${index}`}
      numColumns={2}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.row}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#3498db',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  gridContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
}); 