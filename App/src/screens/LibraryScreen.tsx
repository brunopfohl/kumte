import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { LibraryScreenProps } from '../types';
import { FileService, Document, documentService } from '../services/FileService';
import Icon from '../components/icons';
import { StyledButton } from '../components/StyledButton';

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
      const docs = await documentService.getDocuments();
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
      // Show options for import type
      Alert.alert(
        'Import Document',
        'Choose document type',
        [
          {
            text: 'PDF',
            onPress: async () => {
              try {
                const document = await documentService.importDocument();
                if (document) {
                  setDocuments(prev => [...prev, document]);
                  Alert.alert('Success', 'PDF document imported successfully');
                }
              } catch (error) {
                console.error('Error importing PDF:', error);
                Alert.alert('Error', 'Failed to import PDF document');
              }
            }
          },
          {
            text: 'Image',
            onPress: async () => {
              try {
                const document = await documentService.importDocument();
                if (document) {
                  setDocuments(prev => [...prev, document]);
                  Alert.alert('Success', 'Image document imported successfully');
                }
              } catch (error) {
                console.error('Error importing image:', error);
                Alert.alert('Error', 'Failed to import image document');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setImporting(false);
    }
  };

  const handleCaptureDocument = () => {
    navigation.navigate('Camera');
  };

  const getIconForDocument = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'file-pdf';
      case 'doc':
        return 'file-doc';
      case 'docx':
        return 'file-docx';
      case 'txt':
        return 'file-txt';
      case 'jpg':
      case 'jpeg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'svg':
        return 'svg';
      default:
        return 'file';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
      
      <View style={styles.header}>
        <Text style={styles.title}>IntelliRead</Text>
        <Text style={styles.subtitle}>Your AI Document Companion</Text>
      </View>
      
      <View className="flex-row px-5 pt-5 mb-5 gap-3">
        <StyledButton
          title="Import"
          onPress={handleImportDocument}
          variant="primary"
        />
        
        <StyledButton
          title="Capture"
          onPress={handleCaptureDocument}
          variant="secondary"
        />
      </View>
      
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>My Documents</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#6c5ce7" size="large" />
            <Text style={styles.loadingText}>Loading your documents...</Text>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Icon name="file" size={48} color="#a8b3cf" style={styles.emptyIcon} />
            </View>
            <Text style={styles.emptyText}>Your library is empty</Text>
            <Text style={styles.emptySubText}>Import or capture documents to get started</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.documentList}
            showsVerticalScrollIndicator={false}
          >
            {documents.map((doc, index) => (
              <TouchableOpacity 
                key={`doc-${doc.id}-${index}`}
                style={styles.documentItem}
                onPress={() => navigation.navigate('Viewer', {
                  uri: doc.uri,
                  type: doc.type
                })}
              >
                <View style={[
                  styles.documentIconContainer,
                  doc.type === 'pdf' ? styles.pdfIconContainer : styles.imageIconContainer
                ]}>
                  <Icon 
                    name={getIconForDocument(doc.type)} 
                    size={24} 
                    color="white" 
                  />
                </View>
                
                <View style={styles.documentInfo}>
                  <Text style={styles.documentTitle}>{doc.title}</Text>
                  <Text style={styles.documentMeta}>
                    {doc.type.toUpperCase()} • {doc.date instanceof Date ? 
                      doc.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 
                      String(doc.date)
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={styles.listBottom} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  header: {
    padding: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2d3436',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c5ce7',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  importButton: {
    backgroundColor: '#f3f0ff',
    borderWidth: 1,
    borderColor: '#e9e4ff',
  },
  cameraButton: {
    backgroundColor: '#e6fff9',
    borderWidth: 1,
    borderColor: '#d1ffe9',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  importButtonText: {
    color: '#6c5ce7',
  },
  cameraButtonText: {
    color: '#00b894',
  },
  recentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6c5ce7',
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
    backgroundColor: '#f6f8ff',
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
    color: '#2d3436',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: '#a8b3cf',
    textAlign: 'center',
    lineHeight: 22,
  },
  documentList: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#f8faff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  documentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pdfIconContainer: {
    backgroundColor: '#ff7675',
  },
  imageIconContainer: {
    backgroundColor: '#74b9ff',
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 13,
    color: '#a8b3cf',
    letterSpacing: 0.2,
  },
  listBottom: {
    height: 20,
  }
}); 