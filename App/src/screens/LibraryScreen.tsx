import React, { useState, useEffect } from 'react';
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

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Date;
  documentUri: string;
}

type FilterTab = 'all' | 'recent' | 'quizzes';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [quizQuestionCounts, setQuizQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadDocuments();
    loadQuizzes().then(loadedQuizzes => {
      if (loadedQuizzes?.length) {
        loadQuizQuestionCounts(loadedQuizzes.map(q => q.id));
      }
    });

    // Add listener to reload quizzes when focusing screen
    const unsubscribe = navigation.addListener('focus', () => {
      loadQuizzes().then(loadedQuizzes => {
        if (loadedQuizzes?.length) {
          loadQuizQuestionCounts(loadedQuizzes.map(q => q.id));
        }
      });
    });

    return unsubscribe;
  }, [navigation]);

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

  const loadQuizzes = async (): Promise<Quiz[]> => {
    setLoadingQuizzes(true);
    try {
      // Try the new storage format first
      try {
        const indexStr = await AsyncStorage.getItem('quiz_index');
        if (indexStr) {
          const quizIndex = JSON.parse(indexStr) as Omit<Quiz, 'questions'>[];
          
          // Convert string dates to Date objects
          const processedQuizMeta = quizIndex.map(quiz => ({
            ...quiz,
            createdAt: new Date(quiz.createdAt)
          }));
          
          // For display in the library, we include empty questions arrays
          // We'll load the actual questions only when needed in QuizScreen
          const quizzesWithEmptyQuestions = processedQuizMeta.map(meta => ({
            ...meta,
            questions: [] as Question[] // Empty placeholder, not needed for list view
          }));
          
          setQuizzes(quizzesWithEmptyQuestions);
          setLoadingQuizzes(false);
          return quizzesWithEmptyQuestions; // Return quizzes
        }
      } catch (error) {
        console.log('Could not find quizzes in new storage format, trying legacy format...');
      }
      
      // Fall back to the old storage format
      const quizzesStr = await AsyncStorage.getItem('quizzes');
      if (quizzesStr) {
        const parsedQuizzes = JSON.parse(quizzesStr) as Quiz[];
        // Convert string dates to Date objects
        const processedQuizzes = parsedQuizzes.map(quiz => ({
          ...quiz,
          createdAt: new Date(quiz.createdAt)
        }));
        setQuizzes(processedQuizzes);
        setLoadingQuizzes(false);
        return processedQuizzes; // Return quizzes
      } else {
        setQuizzes([]);
        setLoadingQuizzes(false);
        return []; // Return empty array
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      Alert.alert('Error', 'Failed to load quizzes');
      setLoadingQuizzes(false);
      return []; // Return empty array on error
    }
  };

  const loadQuizQuestionCounts = async (quizIds: string[]) => {
    const counts: Record<string, number> = {};
    
    for (const id of quizIds) {
      try {
        const questionsStr = await AsyncStorage.getItem(`quiz_${id}`);
        if (questionsStr) {
          const questions = JSON.parse(questionsStr) as Question[];
          counts[id] = questions.length;
        }
      } catch (error) {
        console.error(`Error loading question count for quiz ${id}:`, error);
        counts[id] = 0;
      }
    }
    
    setQuizQuestionCounts(counts);
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
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleQuizAction = (quiz: Quiz) => {
    Alert.alert(
      'Quiz Actions',
      `What would you like to do with "${quiz.title}"?`,
      [
        { 
          text: 'Start Quiz', 
          onPress: () => {
            // Navigate to quiz screen
            navigation.navigate('Quiz', { quizId: quiz.id });
          }
        },
        {
          text: 'View Document',
          onPress: () => navigation.navigate('Viewer', {
            uri: quiz.documentUri,
            type: 'pdf'
          })
        },
        {
          text: 'Delete Quiz',
          style: 'destructive',
          onPress: async () => {
            try {
              // Check if we're using the new storage format
              const indexStr = await AsyncStorage.getItem('quiz_index');
              if (indexStr) {
                // Delete from the new storage format
                const quizIndex = JSON.parse(indexStr) as Omit<Quiz, 'questions'>[];
                const updatedIndex = quizIndex.filter(q => q.id !== quiz.id);
                
                // Update the index
                await AsyncStorage.setItem('quiz_index', JSON.stringify(updatedIndex));
                
                // Delete the questions
                await AsyncStorage.removeItem(`quiz_${quiz.id}`);
                
                // Update the state
                const updatedQuizzes = quizzes.filter(q => q.id !== quiz.id);
                setQuizzes(updatedQuizzes);
                
                Alert.alert('Success', 'Quiz deleted successfully');
                return; // Success, exit early
              }
              
              // Fall back to the old storage format
              const quizzesStr = await AsyncStorage.getItem('quizzes');
              if (quizzesStr) {
                const parsedQuizzes = JSON.parse(quizzesStr) as Quiz[];
                const updatedQuizzes = parsedQuizzes.filter(q => q.id !== quiz.id);
                await AsyncStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
                setQuizzes(updatedQuizzes.map(q => ({
                  ...q,
                  createdAt: new Date(q.createdAt)
                })));
                Alert.alert('Success', 'Quiz deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting quiz:', error);
              Alert.alert('Error', 'Failed to delete quiz');
            }
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
      onLongPress={() => handleDocumentAction(doc)}
      delayLongPress={500}
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

  const renderQuizItem = ({ item: quiz }: { item: Quiz }) => {
    // Get question count from state, or fall back to questions array length if using old format
    const questionCount = quizQuestionCounts[quiz.id] || quiz.questions.length || 0;
    
    return (
      <TouchableOpacity 
        style={styles.quizCard}
        onPress={() => {
          // Navigate to quiz screen
          navigation.navigate('Quiz', { quizId: quiz.id });
        }}
        onLongPress={() => handleQuizAction(quiz)}
        delayLongPress={500}
      >
        <View style={styles.quizIconContainer}>
          <Icon name="quiz" size={32} color="#EC4899" />
        </View>
        
        <View style={styles.quizInfo}>
          <Text style={styles.quizTitle} numberOfLines={2}>
            {quiz.title}
          </Text>
          <View style={styles.quizMeta}>
            <Icon name="question" size={12} color="#94a3b8" style={styles.metaIcon} />
            <Text style={styles.quizQuestionCount}>
              {questionCount} questions
            </Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.quizDate}>
              {quiz.createdAt instanceof Date ? 
                quiz.createdAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                }) : 
                String(quiz.createdAt)
              }
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getLoadingState = () => {
    if (activeFilter === 'quizzes') {
      return loadingQuizzes;
    }
    return loading;
  };

  const getEmptyMessage = () => {
    if (activeFilter === 'quizzes') {
      return {
        title: 'No Quizzes Found',
        subtitle: 'Create quizzes from your documents using the Quiz feature'
      };
    }
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

        <TouchableOpacity 
          style={[
            styles.filterTab, 
            activeFilter === 'quizzes' && styles.filterTabActive
          ]}
          onPress={() => setActiveFilter('quizzes')}
        >
          <Text style={[
            styles.filterTabText,
            activeFilter === 'quizzes' && styles.filterTabTextActive
          ]}>Quizzes</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.documentListContainer}>
        {getLoadingState() ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#3498db" size="large" />
            <Text style={styles.loadingText}>
              {activeFilter === 'quizzes' ? 'Loading your quizzes...' : 'Loading your documents...'}
            </Text>
          </View>
        ) : activeFilter === 'quizzes' ? (
          quizzes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Icon name="quiz" size={48} color="#EC4899" style={styles.emptyIcon} />
              </View>
              <Text style={styles.emptyText}>{getEmptyMessage().title}</Text>
              <Text style={styles.emptySubText}>{getEmptyMessage().subtitle}</Text>
            </View>
          ) : (
            <FlatList
              data={quizzes}
              renderItem={renderQuizItem}
              keyExtractor={(quiz) => `quiz-${quiz.id}`}
              numColumns={1}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )
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
  quizCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quizIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizQuestionCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  quizDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
}); 