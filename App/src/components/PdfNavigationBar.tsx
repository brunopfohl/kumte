import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, TextInput, Keyboard, KeyboardEvent, LayoutAnimation, EmitterSubscription, ActivityIndicator } from 'react-native';
import { PdfViewerMethods } from './PdfViewer';
import Svg, { Path, Circle } from 'react-native-svg';
import { DocumentService } from '../services/DocumentService';
import { Document } from '../services/FileService';

interface PdfNavigationBarProps {
  viewerRef: React.RefObject<PdfViewerMethods | null>;
  currentPage: number;
  totalPages: number;
  onAIExplain?: (selectedText: string) => void;
  selectedText?: string;
  style?: any;
  documentUri: string;
  documentType: 'pdf' | 'image';
}

// Custom SVG icons matching the web version
const ChevronLeftIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      fillRule="evenodd"
      d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
      clipRule="evenodd"
      fill={color}
    />
  </Svg>
);

const ChevronRightIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      fillRule="evenodd"
      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
      clipRule="evenodd"
      fill={color}
    />
  </Svg>
);

const ZoomOutIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M0 0h24v24H0z" stroke="none" fill="none" />
    <Circle cx={10} cy={10} r={7} />
    <Path d="M7 10h6" />
    <Path d="M21 21l-6-6" />
  </Svg>
);

const ZoomInIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M0 0h24v24H0z" stroke="none" fill="none" />
    <Circle cx={10} cy={10} r={7} />
    <Path d="M7 10h6" />
    <Path d="M10 7v6" />
    <Path d="M21 21l-6-6" />
  </Svg>
);

const ChatIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M0 0h24v24H0z" stroke="none" fill="none" />
    <Path d="M17.802 17.292s.077 -.055 .2 -.149c1.843 -1.425 3 -3.49 3 -5.789c0 -4.286 -4.03 -7.764 -9 -7.764c-4.97 0 -9 3.478 -9 7.764c0 4.288 4.03 7.646 9 7.646c.424 0 1.12 -.028 2.088 -.084c1.262 .82 3.104 1.493 4.716 1.493c.499 0 .734 -.41 .414 -.828c-.486 -.596 -1.156 -1.551 -1.416 -2.29z" />
    <Path d="M7.5 13.5c2.5 2.5 6.5 2.5 9 0" />
  </Svg>
);

/**
 * A navigation bar for controlling PDF viewer
 * Displays current page, allows page navigation, and shows AI explain button when text is selected
 */
const PdfNavigationBar: React.FC<PdfNavigationBarProps> = ({
  viewerRef,
  currentPage,
  totalPages,
  onAIExplain,
  selectedText,
  style,
  documentUri,
  documentType
}) => {
  const [chatVisible, setChatVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatAnimValue = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Gemini API state
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [geminiLoading, setGeminiLoading] = useState(false);

  // Listen to keyboard events
  useEffect(() => {
    let keyboardWillShowListener: EmitterSubscription;
    let keyboardWillHideListener: EmitterSubscription;
    let keyboardDidShowListener: EmitterSubscription;
    let keyboardDidHideListener: EmitterSubscription;

    if (Platform.OS === 'ios') {
      keyboardWillShowListener = Keyboard.addListener(
        'keyboardWillShow',
        (e: KeyboardEvent) => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setKeyboardHeight(e.endCoordinates.height);
          setKeyboardVisible(true);
        }
      );
      
      keyboardWillHideListener = Keyboard.addListener(
        'keyboardWillHide',
        () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setKeyboardHeight(0);
          setKeyboardVisible(false);
        }
      );
    } else {
      keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e: KeyboardEvent) => {
          setKeyboardHeight(e.endCoordinates.height);
          setKeyboardVisible(true);
        }
      );
      
      keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
          setKeyboardVisible(false);
        }
      );
    }

    // Clean up listeners
    return () => {
      if (Platform.OS === 'ios') {
        keyboardWillShowListener?.remove();
        keyboardWillHideListener?.remove();
      } else {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      }
    };
  }, []);

  const handlePreviousPage = () => {
    viewerRef.current?.goToPreviousPage();
  };

  const handleNextPage = () => {
    viewerRef.current?.goToNextPage();
  };

  // Function to analyze text with Gemini using DocumentService
  const analyzeWithGemini = async (text: string, instruction: string = "Explain this text") => {
    if (!text?.trim()) return;
    
    setGeminiLoading(true);
    setGeminiResponse('');
    
    try {
      // Create a document object using the actual PDF that's being viewed
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

  const handleAIExplain = () => {
    if (selectedText) {
      // Toggle chat window
      const isOpening = !chatVisible;
      setChatVisible(isOpening);
      
      // Animate chat window
      Animated.timing(chatAnimValue, {
        toValue: chatVisible ? 0 : 1,
        duration: 300,
        useNativeDriver: false
      }).start();
      
      // If we're closing the chat and keyboard is visible, dismiss it
      if (chatVisible && keyboardVisible) {
        Keyboard.dismiss();
      }
      
      // If opening the chat, automatically analyze with Gemini
      if (isOpening) {
        analyzeWithGemini(selectedText);
      }
      
      // Notify parent component
      if (onAIExplain) {
        onAIExplain(selectedText);
      }
    }
  };

  const handleSendPress = () => {
    if (!inputText.trim()) return;
    
    // Use the input text as a follow-up instruction for Gemini
    analyzeWithGemini(selectedText || '', inputText);
    setInputText('');
    Keyboard.dismiss();
  };

  // Define colors based on state
  const iconColor = "#6b7280"; // Default icon color
  const disabledColor = "#d1d5db"; // Lighter color for disabled state
  const activeColor = "#8b5cf6"; // Purple for active analyze text

  const chatTranslateY = chatAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  const chatOpacity = chatAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  // Calculate chat container position based on keyboard
  const chatContainerStyle = {
    bottom: keyboardVisible ? keyboardHeight - 50 : 30,
  };

  const toolbarContainerStyle = {
    opacity: keyboardVisible ? 0 : 1,
    transform: [{ translateY: keyboardVisible ? 100 : 0 }]
  };

  return (
    <View style={[styles.container, chatContainerStyle]}>
      {/* Chat Window */}
      {chatVisible && (
        <Animated.View 
          style={[
            styles.chatWindow,
            {
              opacity: chatOpacity,
              transform: [{ translateY: chatTranslateY }]
            }
          ]}
        >
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>AI Analysis</Text>
            <TouchableOpacity onPress={handleAIExplain}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedTextContainer}>
            <Text style={styles.selectedTextLabel}>SELECTED TEXT</Text>
            <Text style={styles.selectedTextContent} numberOfLines={2}>
              {selectedText}
            </Text>
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
      )}

      {/* Toolbar */}
      <Animated.View style={[styles.toolbarContainer, toolbarContainerStyle]}>
        {/* Pagination */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          <ChevronLeftIcon color={currentPage <= 1 ? disabledColor : iconColor} />
        </TouchableOpacity>

        <Text style={styles.pageNumber}>{currentPage} / {totalPages}</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          <ChevronRightIcon color={currentPage >= totalPages ? disabledColor : iconColor} />
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Zoom controls */}
        <TouchableOpacity style={styles.iconButton}>
          <ZoomOutIcon color={iconColor} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <ZoomInIcon color={iconColor} />
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* Analyze Text */}
        <TouchableOpacity 
          style={styles.textButton}
          onPress={handleAIExplain}
          disabled={!selectedText}
        >
          <ChatIcon color={chatVisible ? activeColor : (selectedText ? iconColor : disabledColor)} />
          <Text style={[
            styles.buttonText,
            { color: chatVisible ? activeColor : (selectedText ? iconColor : disabledColor) }
          ]}>
            Analyze Text
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    margin: 2,
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    paddingHorizontal: 6,
    minWidth: 40,
    textAlign: 'center',
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#d1d5db',
    marginHorizontal: 6,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 9999,
    height: 36,
    margin: 2,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Chat window styles
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
  messageArea: {
    padding: 16,
    minHeight: 80,
    maxHeight: 200,
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
  }
});

export default PdfNavigationBar; 