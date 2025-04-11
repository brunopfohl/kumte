import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  StatusBar,
  TextInput,
  FlatList,
  Dimensions,
  Modal
} from 'react-native';
import { LibraryScreenProps } from '../types';
import { FileService, Document, documentService } from '../services/FileService';
import { DocumentService } from '../services/DocumentService';
import Icon from '../components/icons';
import PdfThumbnail from '../components/PdfThumbnail';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

type FilterTab = 'all' | 'recent';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Create a memoized loadDocuments function that we can use in useEffect
  const loadDocuments = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadDocuments();

    // Add listeners for both focus (when returning to screen) and beforeRemove (cleanup)
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('Library screen focused, refreshing documents');
      loadDocuments();
    });

    return () => {
      unsubscribeFocus();
    };
  }, [navigation, loadDocuments]);

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

  const filteredDocuments = documents.filter(doc => {
    // Apply search filter
    if (searchQuery) {
      return doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Apply tab filter
    if (activeFilter === 'recent') {
      // Consider documents from the last 7 days as recent
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return doc.date > sevenDaysAgo;
    }
    
    return true; // 'all' filter
  });

  const handleDocumentAction = (doc: Document) => {
    Alert.alert(
      'Document Actions',
      `What would you like to do with "${doc.title}"?`,
      [
        { 
          text: 'View Document', 
          onPress: () => navigation.navigate('Viewer', {
            uri: doc.uri,
            type: doc.type
          })
        },
        {
          text: 'Delete Document',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Delete',
              `Are you sure you want to delete "${doc.title}"?`,
              [
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const success = await documentService.deleteDocument(doc.id);
                      if (success) {
                        // Update state to remove the document
                        setDocuments(prevDocs => prevDocs.filter(d => d.id !== doc.id));
                        Alert.alert('Success', 'Document has been deleted');
                      } else {
                        Alert.alert('Error', 'Failed to delete document');
                      }
                    } catch (error) {
                      console.error('Error deleting document:', error);
                      Alert.alert('Error', 'An error occurred while deleting the document');
                    }
                  }
                }
              ]
            );
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const renderDocumentItem = ({ item: doc }: { item: Document }) => (
    <TouchableOpacity 
      style={styles.documentCard}
      onPress={() => navigation.navigate('Viewer', {
        uri: doc.uri,
        type: doc.type
      })}
    >
      <View style={styles.documentPreviewContainer}>
        {doc.type === 'pdf' ? (
          <PdfThumbnail 
            document={doc} 
            width={ITEM_WIDTH}  // Use full width since card has no padding now
            height={180} 
          />
        ) : (
          <View style={styles.documentIcon}>
            <Icon 
              name={getIconForDocument(doc.type)} 
              size={40} 
              color="#3498db" 
            />
          </View>
        )}
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => handleDocumentAction(doc)}
        >
          <Icon name="more" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={2}>{doc.title}</Text>
        <View style={styles.documentMeta}>
          <Icon name="clock" size={12} color="#94a3b8" style={styles.metaIcon} />
          <Text style={styles.documentDate}>
            {doc.date instanceof Date ? 
              doc.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              }) : 
              String(doc.date)
            }
          </Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.documentType}>{doc.type.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getLoadingState = () => {
    return loading;
  };

  const getEmptyMessage = () => {
    return {
      title: 'Your library is empty',
      subtitle: 'Import or capture documents to get started'
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3498db" />
      
      {/* Header with gradient-like effect */}
      <View style={styles.headerContainer}>
        {/* Base gradient layer */}
        <View style={styles.headerGradient} />
        {/* Diagonal gradient overlay */}
        <View style={styles.diagonalGradient} />
        {/* Bottom accent */}
        <View style={styles.bottomAccent} />
        {/* Top highlight */}
        <View style={styles.topHighlight} />
        
        {/* Content layer */}
        <View style={styles.headerContent}>
          <Text style={styles.title}>IntelliRead</Text>
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="rgba(255, 255, 255, 0.8)" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleImportDocument}
          disabled={importing}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="download" size={24} color="#3498db" />
          </View>
          <Text style={styles.actionButtonText}>Import Document</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCaptureDocument}
        >
          <View style={styles.actionIconContainer}>
            <Icon name="camera" size={24} color="#3498db" />
          </View>
          <Text style={styles.actionButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            activeFilter === 'all' && styles.filterTabActive
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === 'all' && styles.filterTabTextActive
          ]}>All Files</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterTab, 
            activeFilter === 'recent' && styles.filterTabActive
          ]}
          onPress={() => setActiveFilter('recent')}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === 'recent' && styles.filterTabTextActive
          ]}>Recent</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.documentListContainer}>
        {getLoadingState() ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#3498db" size="large" />
            <Text style={styles.loadingText}>
              Loading your documents
            </Text>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Icon name="file" size={48} color="#a8b3cf" style={styles.emptyIcon} />
            </View>
            <Text style={styles.emptyText}>{getEmptyMessage().title}</Text>
            <Text style={styles.emptySubText}>{getEmptyMessage().subtitle}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDocuments}
            renderItem={renderDocumentItem}
            keyExtractor={(doc, index) => `doc-${doc.id}-${index}`}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa', // Light gray background
  },
  headerContainer: {
    paddingTop: 30,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3498db', // Primary blue color
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#ffffff',
    opacity: 0.15,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  diagonalGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#2ecc71', // Secondary color
    opacity: 0.6,
    transform: [{ skewY: '-20deg' }, { translateY: -120 }],
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#2980b9', // Darker blue
    opacity: 0.3,
  },
  headerContent: {
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    padding: 0, // Remove default padding
    height: 40,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0', // Light gray border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#ebf5ff', // Light blue background
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155', // Dark gray text
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: '#f1f5f9', // Light gray background
  },
  filterTabActive: {
    backgroundColor: '#3498db', // Primary blue color
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b', // Medium gray text
  },
  filterTabTextActive: {
    color: 'white', // White text for active tab
  },
  documentListContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gridContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  documentCard: {
    width: ITEM_WIDTH,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    borderColor: '#e2e8f0', // Light gray border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  documentPreviewContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    position: 'relative',
  },
  documentIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155', // Dark gray text
    marginBottom: 8,
    textAlign: 'center',
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#94a3b8', // Medium gray text
  },
  metaSeparator: {
    fontSize: 12,
    color: '#cbd5e1', // Light gray text
    marginHorizontal: 4,
  },
  documentType: {
    fontSize: 12,
    color: '#94a3b8', // Medium gray text
  },
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
    backgroundColor: '#f1f5f9', // Light blue background
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
    color: '#334155', // Dark gray text
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: '#94a3b8', // Medium gray text
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  thumbnailContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#eef2ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pdfIconContainer: {
    backgroundColor: '#ff7675',
  },
  imageIconContainer: {
    backgroundColor: '#74b9ff',
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  optionsButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
}); 