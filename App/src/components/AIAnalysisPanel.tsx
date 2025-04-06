import React, { useState, useEffect, Fragment } from 'react';
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
    <Path d="M8 9h8" />
    <Path d="M8 13h6" />
    <Path d="M14.5 18.5l-2.5 2.5l-3 -3h-3a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v4.5" />
    <Path d="M19 22v.01" />
    <Path d="M19 19a2.003 2.003 0 0 0 .914 -3.782a1.98 1.98 0 0 0 -2.414 .483" />
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

type Language = {
  code: string;
  name: string;
};

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'cs', name: 'Czech' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

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

// Message item component to handle key prop correctly
const MessageHistoryItem = React.memo(
  ({message, index}: {message: Message; index: number}) => {
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyBadge}>
          <Text style={styles.historyBadgeText}>Q</Text>
        </View>
        <Text style={styles.historyText} numberOfLines={2}>{message.text}</Text>
      </View>
    );
  }
);

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(LANGUAGES[0]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  
  useEffect(() => {
    if (visible) {
      analyzeWithGemini(selectedText);
      extractKeywords(selectedText);
      setCurrentQuery('Initial analysis');
    }
  }, [visible, selectedText, currentLanguage.code]);
  
  useEffect(() => {
    if (visible && currentLanguage) {
      analyzeWithGemini(selectedText);
      extractKeywords(selectedText);
    }
  }, [currentLanguage.code]);

  const analyzeWithGemini = async (text: string, instruction: string = "Explain this text") => {
    setGeminiLoading(true);
    setGeminiResponse('');
    
    try {
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      const langToUse = currentLanguage;
      
      const languageInstruction = langToUse.code !== 'en' 
        ? `Please provide your answer in ${langToUse.name} (${langToUse.code}).` 
        : '';
      
      const fullInstruction = `${instruction}\n\n${languageInstruction}\n\nHere is the text to analyze: "${text}"`;
      
      console.log(`Analyzing text with language: ${langToUse.name} (${langToUse.code})`);
      const response = await DocumentService.analyzeDocumentWithGemini(doc, fullInstruction);
      
      setGeminiResponse(response);
      
      if (instruction !== "Explain this text") {
        const newUserMessage: Message = {
          id: `user-${Date.now()}`,
          text: instruction,
          isUser: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newUserMessage]);
      }

      setCurrentQuery(instruction);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGeminiResponse(`Error analyzing text: ${errorMessage}`);
    } finally {
      setGeminiLoading(false);
    }
  };

  const extractKeywords = async (text: string) => {
    setKeywordsLoading(true);
    
    try {
      const doc: Document = {
        id: `selection-${Date.now()}`,
        title: 'Current Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };
      
      const langToUse = currentLanguage;
      
      const languageInstruction = langToUse.code !== 'en' 
        ? `Extract and generate the keywords in ${langToUse.name} (${langToUse.code}).` 
        : '';
      
      console.log(`Extracting keywords with language: ${langToUse.name} (${langToUse.code})`);
      
      const instruction = `
        Extract the top 20 most relevant keywords or key phrases from the text, and provide a brief summary for each.
        Return the results as a JSON array of objects, ordered by relevance (most relevant first).
        
        Each object should have:
        - "word": the keyword or key phrase (string)
        - "summary": a brief 1-2 sentence explanation of why this keyword is important (string)
        - "relevance": a number from 1-10 indicating importance (number)
        
        ${languageInstruction}
        
        Format the output as valid JSON that can be parsed. Only return the JSON array, no other text.
        
        Here is the text to analyze: "${text}"
      `;
      
      const response = await DocumentService.analyzeDocumentWithGemini(doc, instruction);
      
      try {
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = response.substring(jsonStart, jsonEnd);
          const parsedKeywords = JSON.parse(jsonStr) as Keyword[];
          
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
    
    analyzeWithGemini(selectedText, inputText);
    setInputText('');
    Keyboard.dismiss();
  };

  const handleKeywordPress = (keyword: Keyword) => {
    setSelectedKeyword(keyword);
  };

  const closeKeywordModal = () => {
    setSelectedKeyword(null);
  };

  // Handle language change
  const handleLanguageChange = (language: Language) => {
    console.log(`Language changed to: ${language.name} (${language.code})`);
    setCurrentLanguage(language);
    setShowLanguageDropdown(false);
    
    if (visible && selectedText) {
      setGeminiResponse('');
      setKeywords([]);
      
      setTimeout(() => {
        analyzeWithGemini(selectedText);
        extractKeywords(selectedText);
      }, 50);
    }
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
          <View style={styles.chatHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.chatTitle}>AI Analysis</Text>
              
              <TouchableOpacity 
                style={styles.languageSelector}
                onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
              >
                <Text style={styles.languageText}>{currentLanguage.name}</Text>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={2}>
                  <Path d={showLanguageDropdown ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                </Svg>
              </TouchableOpacity>
              
              {showLanguageDropdown && (
                <View style={styles.languageDropdown}>
                  <ScrollView style={{maxHeight: 200}}>
                    {LANGUAGES.map((language) => (
                      <TouchableOpacity
                        key={language.code}
                        style={[
                          styles.languageOption,
                          language.code === currentLanguage.code && styles.selectedLanguageOption
                        ]}
                        onPress={() => handleLanguageChange(language)}
                      >
                        <Text 
                          style={[
                            styles.languageOptionText,
                            language.code === currentLanguage.code && styles.selectedLanguageOptionText
                          ]}
                        >
                          {language.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              alwaysBounceVertical={true}
            >
              <View style={styles.selectedTextContainer}>
                <View style={styles.selectedTextRow}>
                  <Text style={styles.selectedTextLabel}>SELECTED TEXT:</Text>
                  <Text style={styles.selectedTextContent} numberOfLines={1} ellipsizeMode="tail">
                    {selectedText}
                  </Text>
                </View>
              </View>
              
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
                <View style={styles.headerRow}>
                  <Text style={styles.analysisTitle}>ANALYSIS</Text>
                  {currentQuery !== "Explain this text" && (
                    <View style={styles.queryBadge}>
                      <Text style={styles.queryBadgeText}>{currentQuery.length > 20 ? currentQuery.substring(0, 20) + '...' : currentQuery}</Text>
                    </View>
                  )}
                </View>
                
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
              
              {messages.length > 0 && (
                <View style={styles.messageHistoryContainer}>
                  <Text style={styles.messageHistoryTitle}>PREVIOUS QUERIES</Text>
                  {messages.map((message, index) => {
                    const historyItem = (
                      <View style={styles.historyItem}>
                        <View style={styles.historyBadge}>
                          <Text style={styles.historyBadgeText}>Q</Text>
                        </View>
                        <Text style={styles.historyText} numberOfLines={2}>{message.text}</Text>
                      </View>
                    );
                    return React.cloneElement(historyItem, {key: `message-${index}`});
                  })}
                </View>
              )}
              
              <View style={styles.scrollBottomSpacer} />
            </ScrollView>
            
            <View style={styles.chatInputContainer}>
              <View style={styles.inputWrapper}>
                {currentLanguage.code !== 'en' && (
                  <View style={styles.languageIndicator}>
                    <Text style={styles.languageIndicatorText}>{currentLanguage.code}</Text>
                  </View>
                )}
                <TextInput
                  style={[
                    styles.chatInput,
                    currentLanguage.code !== 'en' && { paddingLeft: 40 }
                  ]}
                  placeholder="Type a message..."
                  placeholderTextColor="#9ca3af"
                  value={inputText}
                  onChangeText={setInputText}
                  returnKeyType="send"
                  onSubmitEditing={handleSendPress}
                  multiline
                />
              </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 20,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8b5cf6',
    marginRight: 4,
  },
  languageDropdown: {
    position: 'absolute',
    top: 28,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    zIndex: 30,
  },
  languageOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedLanguageOption: {
    backgroundColor: '#f5f3ff',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  selectedLanguageOptionText: {
    color: '#8b5cf6',
    fontWeight: '600',
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
    padding: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTextLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  selectedTextContent: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  queryBadge: {
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  queryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
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
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  languageIndicator: {
    position: 'absolute',
    left: 10,
    zIndex: 10,
    backgroundColor: '#f5f3ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  languageIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 45,
    fontSize: 14,
    color: '#374151',
    maxHeight: 100,
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  messageHistoryContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  messageHistoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  historyItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  } as ViewStyle,
  historyBadge: {
    backgroundColor: '#e0e7ff',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 10,
  } as ViewStyle,
  historyBadgeText: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 13,
    color: '#4b5563',
  },
});

export default AIAnalysisPanel; 