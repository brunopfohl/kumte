import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, TextInput } from 'react-native';
import { PdfViewerMethods } from './PdfViewer';
import Svg, { Path, Circle } from 'react-native-svg';

interface PdfNavigationBarProps {
  viewerRef: React.RefObject<PdfViewerMethods | null>;
  currentPage: number;
  totalPages: number;
  onAIExplain?: (selectedText: string) => void;
  selectedText?: string;
  style?: any;
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
  style
}) => {
  const [chatVisible, setChatVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatAnimValue = useRef(new Animated.Value(0)).current;

  const handlePreviousPage = () => {
    viewerRef.current?.goToPreviousPage();
  };

  const handleNextPage = () => {
    viewerRef.current?.goToNextPage();
  };

  const handleAIExplain = () => {
    if (selectedText) {
      // Toggle chat window
      setChatVisible(!chatVisible);
      
      // Animate chat window
      Animated.timing(chatAnimValue, {
        toValue: chatVisible ? 0 : 1,
        duration: 300,
        useNativeDriver: false
      }).start();
      
      // Notify parent component
      if (onAIExplain) {
        onAIExplain(selectedText);
      }
    }
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

  return (
    <View style={[styles.container, style]}>
      {/* Chat Window */}
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
          <Text style={styles.messagePlaceholder}>
            AI response will appear here...
          </Text>
        </View>
        
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask a follow-up question..."
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            style={styles.sendButton}
            disabled={inputText.trim().length === 0}
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

      {/* Toolbar */}
      <View style={styles.toolbarContainer}>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 80,
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
    minHeight: 100,
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