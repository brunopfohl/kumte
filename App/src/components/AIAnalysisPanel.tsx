import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Animated, 
  TextInput, 
  Keyboard, 
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  useWindowDimensions,
  ViewStyle,
  TextStyle,
  ImageStyle
} from 'react-native';
import { DocumentService } from '../services/DocumentService';
import { Document } from '../services/FileService';
import Svg, { Path } from 'react-native-svg';
import Markdown from 'react-native-markdown-display';

// Send Icon component
const SendIcon = ({ color = "currentColor" }: { color?: string }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <Path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124z" />
    <Path d="M6.5 12h14.5" />
  </Svg>
);

interface AIAnalysisPanelProps {
  visible: boolean;
  selectedText: string;
  documentUri: string;
  documentType: 'pdf' | 'image';
  animValue: Animated.Value;
  keyboardHeight: number;
  keyboardVisible: boolean;
  onClose: () => void;
}

interface Keyword {
  word: string;
  summary: string;
  relevance: number;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Message content rendering with markdown support
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  const { width } = useWindowDimensions();
  const maxWidth = Math.min(width * 0.85, 550);

  // Define custom rules for better code block rendering
  const markdownRules = {
    code_block: (node: any, children: any, parent: any, styles: any) => {
      return (
        <View style={styles.code_block}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.code_block_scroll}
          >
            <Text style={styles.code_block_text}>{node.content}</Text>
          </ScrollView>
        </View>
      );
    }
  };

  const markdownStyles = {
    body: {
      color: '#374151',
      fontSize: 14,
      lineHeight: 22,
    } as TextStyle,
    paragraph: {
      marginBottom: 12,
      marginTop: 0,
    } as TextStyle,
    heading1: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      marginTop: 14,
      color: '#111827',
    } as TextStyle,
    heading2: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      marginTop: 12,
      color: '#1f2937',
    } as TextStyle,
    heading3: {
      fontSize: 15,
      fontWeight: 'bold',
      marginBottom: 6,
      marginTop: 10,
      color: '#374151',
    } as TextStyle,
    heading4: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
      marginTop: 8,
      color: '#4b5563',
    } as TextStyle,
    heading5: {
      fontSize:.95 * 14,
      fontWeight: 'bold',
      marginBottom: 4,
      marginTop: 8,
      color: '#4b5563',
    } as TextStyle,
    heading6: {
      fontSize: .9 * 14,
      fontWeight: 'bold',
      marginBottom: 4,
      marginTop: 8,
      color: '#4b5563',
    } as TextStyle,
    code_block: {
      backgroundColor: '#f3f4f6',
      borderRadius: 4,
      padding: 10,
      marginVertical: 8,
    } as ViewStyle,
    code_inline: {
      backgroundColor: '#f3f4f6',
      borderRadius: 3,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      paddingHorizontal: 4,
      paddingVertical: 2,
    } as TextStyle,
    blockquote: {
      backgroundColor: '#f9fafb',
      borderLeftColor: '#e5e7eb',
      borderLeftWidth: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 8,
    } as ViewStyle,
    bullet_list: {
      marginVertical: 8,
    } as ViewStyle,
    ordered_list: {
      marginVertical: 8,
    } as ViewStyle,
    list_item: {
      flexDirection: 'row',
      marginBottom: 6,
    } as ViewStyle,
    bullet_list_icon: {
      marginRight: 8,
      marginTop: 4,
    } as TextStyle,
    bullet_list_content: {
      flex: 1,
    } as ViewStyle,
    ordered_list_icon: {
      marginRight: 8,
      marginTop: 4,
    } as TextStyle,
    ordered_list_content: {
      flex: 1,
    } as ViewStyle,
    link: {
      color: '#8b5cf6',
      textDecorationLine: 'underline',
    } as TextStyle,
    table: {
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
      marginVertical: 10,
    } as ViewStyle,
    tableHeader: {
      backgroundColor: '#f9fafb',
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderColor: '#e5e7eb',
    } as ViewStyle,
    tableHeaderCell: {
      flex: 1,
      padding: 8,
      fontWeight: 'bold',
    } as TextStyle,
    tableRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderColor: '#e5e7eb',
    } as ViewStyle,
    tableRowCell: {
      flex: 1,
      padding: 8,
    } as TextStyle,
    hr: {
      backgroundColor: '#e5e7eb',
      height: 1,
      marginVertical: 16,
    } as ViewStyle,
    image: {
      maxWidth: maxWidth - 32, // Account for padding
      borderRadius: 4,
      marginVertical: 8,
    } as ImageStyle,
    strong: {
      fontWeight: 'bold',
    } as TextStyle,
    em: {
      fontStyle: 'italic',
    } as TextStyle,
    strikethrough: {
      textDecorationLine: 'line-through',
    } as TextStyle,
    code_block_scroll: {
      flexGrow: 0,
    } as ViewStyle,
    code_block_text: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 13,
      color: '#1f2937',
    } as TextStyle,
  };

  return (
    <Markdown 
      style={markdownStyles}
      rules={markdownRules}
    >
      {content}
    </Markdown>
  );
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  visible,
  selectedText,
  documentUri,
  documentType,
  animValue,
  keyboardHeight,
  keyboardVisible,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);

  // Animation calculated values
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  // On mount, analyze text automatically
  useEffect(() => {
    if (visible && selectedText) {
      analyzeWithGemini(selectedText);
      extractKeywords(selectedText);
    }
  }, [visible, selectedText]);

  // Function to analyze text with Gemini using DocumentService
  const analyzeWithGemini = async (text: string, instruction: string = "Explain this text") => {
    if (!text?.trim()) return;
    
    setGeminiLoading(true);
    setGeminiResponse('');
    
    try {
      // Create a document object using the actual document that's being viewed
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      // Use DocumentService.analyzeDocumentWithGemini with the selected text as instructions
      const fullInstruction = `${instruction}\n\nHere is the text to analyze: "${text}"`;
      const response = await DocumentService.analyzeDocumentWithGemini(doc, fullInstruction);
      
      setGeminiResponse(response);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGeminiResponse(`Error analyzing text: ${errorMessage}`);
    } finally {
      setGeminiLoading(false);
    }
  };

  // Function to extract keywords using Gemini API with structured output
  const extractKeywords = async (text: string) => {
    if (!text?.trim()) return;
    
    setKeywordsLoading(true);
    
    try {
      // Create a document object
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      // Instruction for Gemini to extract keywords with structured output
      const instruction = `
        Extract the top 20 most relevant keywords or key phrases from the text, and provide a brief summary for each.
        Return the results as a JSON array of objects, ordered by relevance (most relevant first).
        
        Each object should have:
        - "word": the keyword or key phrase (string)
        - "summary": a brief 1-2 sentence explanation of why this keyword is important (string)
        - "relevance": a number from 1-10 indicating importance (number)
        
        Format the output as valid JSON that can be parsed. Only return the JSON array, no other text.
        
        Here is the text to analyze: "${text}"
      `;
      
      const response = await DocumentService.analyzeDocumentWithGemini(doc, instruction);
      
      try {
        // Try to parse the response as JSON
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = response.substring(jsonStart, jsonEnd);
          const parsedKeywords = JSON.parse(jsonStr) as Keyword[];
          
          // Ensure we have valid keywords
          const validKeywords = parsedKeywords.filter(k => 
            k && typeof k.word === 'string' && 
            typeof k.summary === 'string' && 
            typeof k.relevance === 'number'
          );
          
          setKeywords(validKeywords);
        } else {
          console.error('Could not find JSON in response:', response);
          setKeywords([]);
        }
      } catch (parseError) {
        console.error('Error parsing keywords JSON:', parseError);
        setKeywords([]);
      }
    } catch (error) {
      console.error('Error extracting keywords:', error);
    } finally {
      setKeywordsLoading(false);
    }
  };

  const handleSendPress = () => {
    if (!inputText.trim()) return;
    
    // Use the input text as a follow-up instruction for Gemini
    analyzeWithGemini(selectedText, inputText);
    setInputText('');
    Keyboard.dismiss();
  };

  // Handle keyword selection to show details
  const handleKeywordPress = (keyword: Keyword) => {
    setSelectedKeyword(keyword);
  };

  // Close the keyword detail modal
  const closeKeywordModal = () => {
    setSelectedKeyword(null);
  };

  if (!visible) return null;

  return (
    <>
      <Animated.View 
        style={[
          styles.chatWindow,
          {
            opacity: opacity,
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <SafeAreaView style={styles.container}>
          {/* Fixed Header */}
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>AI Analysis</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {/* Scrollable Content */}
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              alwaysBounceVertical={true}
            >
              <View style={styles.selectedTextContainer}>
                <Text style={styles.selectedTextLabel}>SELECTED TEXT</Text>
                <Text style={styles.selectedTextContent}>
                  {selectedText}
                </Text>
              </View>
              
              {/* Keywords Section */}
              <View style={styles.keywordsContainer}>
                <Text style={styles.keywordsTitle}>KEY CONCEPTS</Text>
                {keywordsLoading ? (
                  <View style={styles.keywordsLoadingContainer}>
                    <ActivityIndicator size="small" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Extracting keywords...</Text>
                  </View>
                ) : keywords.length > 0 ? (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.keywordsScrollContent}
                    nestedScrollEnabled={true}
                  >
                    {keywords.map((keyword, index) => (
                      <TouchableOpacity 
                        key={`keyword-${index}`} 
                        style={styles.keywordBadge}
                        onPress={() => handleKeywordPress(keyword)}
                      >
                        <Text style={styles.keywordText}>{keyword.word}</Text>
                        <Text style={styles.keywordRelevance}>{keyword.relevance}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noKeywordsText}>No keywords found</Text>
                )}
              </View>
              
              <View style={styles.messageArea}>
                <Text style={styles.analysisTitle}>ANALYSIS</Text>
                {geminiLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#8b5cf6" />
                    <Text style={styles.loadingText}>Getting analysis from Gemini...</Text>
                  </View>
                ) : geminiResponse ? (
                  <MessageContent content={geminiResponse} />
                ) : (
                  <Text style={styles.messagePlaceholder}>
                    AI response will appear here...
                  </Text>
                )}
              </View>
              
              {/* Extra space at the bottom for better scrolling */}
              <View style={styles.scrollBottomSpacer} />
            </ScrollView>
            
            {/* Fixed Input Area */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask a follow-up question..."
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="send"
                onSubmitEditing={handleSendPress}
                multiline
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  inputText.trim().length === 0 && styles.sendButtonDisabled
                ]}
                disabled={inputText.trim().length === 0}
                onPress={handleSendPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <SendIcon color={inputText.trim().length === 0 ? "#9ca3af" : "#ffffff"} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>

      {/* Keyword Detail Modal */}
      <Modal
        visible={selectedKeyword !== null}
        transparent
        animationType="fade"
        onRequestClose={closeKeywordModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeKeywordModal}
        >
          <View style={styles.modalContent}>
            {selectedKeyword && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedKeyword.word}</Text>
                  <TouchableOpacity onPress={closeKeywordModal}>
                    <Text style={styles.closeButton}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.relevanceLabel}>RELEVANCE</Text>
                  <View style={styles.relevanceBar}>
                    <View 
                      style={[
                        styles.relevanceFill,
                        { width: `${(selectedKeyword.relevance / 10) * 100}%` }
                      ]}
                    />
                    <Text style={styles.relevanceText}>{selectedKeyword.relevance}/10</Text>
                  </View>
                  <Text style={styles.summaryLabel}>SUMMARY</Text>
                  <Text style={styles.summaryText}>{selectedKeyword.summary}</Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  keyboardAvoidContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollBottomSpacer: {
    height: 40,
  },
  chatWindow: {
    width: '94%',
    maxWidth: 600,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    height: SCREEN_HEIGHT * 0.7,
    maxHeight: SCREEN_HEIGHT * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButtonContainer: {
    padding: 8,
    marginRight: -8,
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '400',
    marginTop: -4,
  },
  selectedTextContainer: {
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  selectedTextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  selectedTextContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  keywordsContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  keywordsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  keywordsScrollContent: {
    paddingBottom: 8,
    paddingRight: 16,
  },
  keywordBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keywordText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  keywordRelevance: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '700',
    marginLeft: 6,
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  keywordsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  noKeywordsText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  messageArea: {
    padding: 16,
  },
  analysisTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  messagePlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  chatInputContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 45,
    fontSize: 14,
    color: '#374151',
    maxHeight: 100,
    minHeight: 45,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sendButton: {
    position: 'absolute',
    right: 24,
    backgroundColor: '#8b5cf6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sendButtonTextDisabled: {
    color: '#9ca3af',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '80%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 16,
  },
  relevanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  relevanceBar: {
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  relevanceFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#8b5cf6',
    borderRadius: 6,
  },
  relevanceText: {
    position: 'absolute',
    right: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#4b5563',
    top: -2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default AIAnalysisPanel; 