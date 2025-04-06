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
  Modal
} from 'react-native';
import { DocumentService } from '../services/DocumentService';
import { Document } from '../services/FileService';

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
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>AI Analysis</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.selectedTextContainer}>
          <Text style={styles.selectedTextLabel}>SELECTED TEXT</Text>
          <Text style={styles.selectedTextContent} numberOfLines={2}>
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
          {geminiLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.loadingText}>Getting analysis from Gemini...</Text>
            </View>
          ) : geminiResponse ? (
            <Text style={styles.messageText}>{geminiResponse}</Text>
          ) : (
            <Text style={styles.messagePlaceholder}>
              AI response will appear here...
            </Text>
          )}
        </View>
        
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask a follow-up question..."
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={handleSendPress}
          />
          <TouchableOpacity 
            style={styles.sendButton}
            disabled={inputText.trim().length === 0}
            onPress={handleSendPress}
          >
            <Text style={[
              styles.sendButtonText,
              inputText.trim().length === 0 && styles.sendButtonDisabled
            ]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
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
  chatWindow: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    maxHeight: 400,
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
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
    maxHeight: 100,
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
    borderBottomColor: '#f3f4f6',
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
    minHeight: 80,
    maxHeight: 160,
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
    borderTopColor: '#f3f4f6',
    padding: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#374151',
  },
  sendButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 14,
  },
  sendButtonDisabled: {
    color: '#d1d5db',
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