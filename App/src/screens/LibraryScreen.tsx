import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { LibraryScreenProps } from '../types';
import { FileService, Document } from '../services/FileService';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await FileService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleImportDocument = async () => {
    setImporting(true);
    try {
      const document = await FileService.importDocument('pdf');
      if (document) {
        setDocuments(prev => [...prev, document]);
        Alert.alert('Success', 'Document imported successfully');
      }
    } catch (error) {
      console.error('Error importing document:', error);
      Alert.alert('Error', 'Failed to import document');
    } finally {
      setImporting(false);
    }
  };

  const handleCaptureDocument = () => {
    navigation.navigate('Camera');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fc" />
      
      <View style={styles.header}>
        <Text style={styles.title}>IntelliRead</Text>
        <Text style={styles.subtitle}>Your AI Document Companion</Text>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.importButton, importing && styles.buttonDisabled]}
          onPress={handleImportDocument}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Import Document</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.cameraButton]}
          onPress={handleCaptureDocument}
        >
          <Text style={styles.actionButtonText}>Capture Image</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Documents</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#3a86ff" size="large" />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No documents yet</Text>
            <Text style={styles.emptySubText}>Import or capture a document to get started</Text>
          </View>
        ) : (
          <ScrollView style={styles.documentList}>
            {documents.map((doc, index) => (
              <TouchableOpacity 
                key={`doc-${doc.id}-${index}`}
                style={styles.documentItem}
                onPress={() => navigation.navigate('Viewer', {
                  uri: doc.uri,
                  type: doc.type
                })}
              >
                <View style={styles.documentIconContainer}>
                  <View style={[
                    styles.documentIcon, 
                    doc.type === 'pdf' ? styles.pdfIcon : styles.imageIcon
                  ]}>
                    <Text style={styles.documentIconText}>
                      {doc.type === 'pdf' ? 'PDF' : 'IMG'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={styles.documentMeta}>{doc.type.toUpperCase()} • {doc.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a2a3a',
  },
  subtitle: {
    fontSize: 16,
    color: '#617d98',
    marginTop: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  actionButton: {
    flex: 1,
    margin: 5,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  importButton: {
    backgroundColor: '#3a86ff',
  },
  cameraButton: {
    backgroundColor: '#677ce6',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  recentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a2a3a',
    marginBottom: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#617d98',
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a2a3a',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#617d98',
    textAlign: 'center',
  },
  documentList: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f7f9fc',
    alignItems: 'center',
  },
  documentIconContainer: {
    marginRight: 15,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfIcon: {
    backgroundColor: '#ff5a5f',
  },
  imageIcon: {
    backgroundColor: '#3a86ff',
  },
  documentIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a2a3a',
    marginBottom: 5,
  },
  documentMeta: {
    fontSize: 12,
    color: '#617d98',
  }
}); 