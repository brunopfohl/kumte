import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated, Keyboard, KeyboardEvent, LayoutAnimation, EmitterSubscription } from 'react-native';
import { PdfViewerMethods } from './PdfViewer';
import Svg, { Path } from 'react-native-svg';
import AIAnalysisPanel from './AIAnalysisPanel';
import QuizPanel from './QuizPanel';

interface PdfNavigationBarProps {
  viewerRef: React.RefObject<PdfViewerMethods | null>;
  currentPage: number;
  totalPages: number;
  onAIExplain?: (selectedText?: string) => void;
  onQuizGenerate?: (selectedText?: string) => void;
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

const ChatIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M0 0h24v24H0z" stroke="none" fill="none" />
    <Path d="M17.802 17.292s.077 -.055 .2 -.149c1.843 -1.425 3 -3.49 3 -5.789c0 -4.286 -4.03 -7.764 -9 -7.764c-4.97 0 -9 3.478 -9 7.764c0 4.288 4.03 7.646 9 7.646c.424 0 1.12 -.028 2.088 -.084c1.262 .82 3.104 1.493 4.716 1.493c.499 0 .734 -.41 .414 -.828c-.486 -.596 -1.156 -1.551 -1.416 -2.29z" />
    <Path d="M7.5 13.5c2.5 2.5 6.5 2.5 9 0" />
  </Svg>
);

// Quiz Icon component
const QuizIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 16L10.8787 13.1213M10.8787 13.1213C11.4216 12.5784 11.7071 11.8284 11.7071 11.0503C11.7071 10.2722 11.4216 9.5222 10.8787 8.97934C10.3358 8.43645 9.58582 8.15096 8.8077 8.15096C8.02958 8.15096 7.27963 8.43645 6.73675 8.97934C6.19386 9.5222 5.90837 10.2722 5.90837 11.0503C5.90837 11.8284 6.19386 12.5784 6.73675 13.1213C7.27963 13.6642 8.02958 13.9497 8.8077 13.9497C9.58582 13.9497 10.3358 13.6642 10.8787 13.1213Z" />
    <Path d="M18 16L14 8" />
    <Path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" />
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
  onQuizGenerate,
  selectedText,
  style,
  documentUri,
  documentType
}) => {
  const [chatVisible, setChatVisible] = useState(false);
  const chatAnimValue = useRef(new Animated.Value(0)).current;
  const [quizVisible, setQuizVisible] = useState(false);
  const quizAnimValue = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  const handleAIExplain = () => {
    // Close quiz panel if open
    if (quizVisible) {
      setQuizVisible(false);
      Animated.timing(quizAnimValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
      
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
    
    // Notify parent component
    if (onAIExplain) {
      onAIExplain(selectedText);
    }
  };

  const handleQuizGenerate = () => {
    // Close AI panel if open
    if (chatVisible) {
      setChatVisible(false);
      Animated.timing(chatAnimValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
    
    const isOpening = !quizVisible;
    setQuizVisible(isOpening);
    
    // Animate quiz window
    Animated.timing(quizAnimValue, {
      toValue: quizVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
    
    // If we're closing the quiz and keyboard is visible, dismiss it
    if (quizVisible && keyboardVisible) {
      Keyboard.dismiss();
    }
    
    // Notify parent component
    if (onQuizGenerate) {
      onQuizGenerate(selectedText);
    }
  };

  // Define colors based on state
  const iconColor = "#6b7280"; // Default icon color
  const disabledColor = "#d1d5db"; // Lighter color for disabled state
  const activeColor = "#8b5cf6"; // Purple for active analyze text
  const quizActiveColor = "#EC4899"; // Pink for active quiz

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
      {/* AIAnalysisPanel */}
      <AIAnalysisPanel
        visible={chatVisible}
        selectedText={selectedText || ''}
        documentUri={documentUri}
        documentType={documentType}
        animValue={chatAnimValue}
        keyboardHeight={keyboardHeight}
        keyboardVisible={keyboardVisible}
        onClose={handleAIExplain}
      />

      {/* QuizPanel */}
      <QuizPanel
        visible={quizVisible}
        selectedText={selectedText || ''}
        documentUri={documentUri}
        documentType={documentType}
        animValue={quizAnimValue}
        keyboardHeight={keyboardHeight}
        keyboardVisible={keyboardVisible}
        onClose={handleQuizGenerate}
      />

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

        {/* Analyze */}
        <TouchableOpacity 
          style={styles.textButton}
          onPress={handleAIExplain}
        >
          <ChatIcon color={chatVisible ? activeColor : iconColor} />
          <Text style={[
            styles.buttonText,
            {color: chatVisible ? activeColor : iconColor}
          ]}>
            Analyze
          </Text>
        </TouchableOpacity>

        {/* Quiz */}
        <TouchableOpacity 
          style={styles.textButton}
          onPress={handleQuizGenerate}
        >
          <QuizIcon color={quizVisible ? quizActiveColor : iconColor} />
          <Text style={[
            styles.buttonText,
            {color: quizVisible ? quizActiveColor : iconColor}
          ]}>
            Quiz
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
  }
});

export default PdfNavigationBar; 