import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated, Keyboard, KeyboardEvent, LayoutAnimation, EmitterSubscription } from 'react-native';
import { PdfViewerMethods } from './PdfViewer';
import { Icon } from './icons';
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

const PdfNavigationBar: React.FC<PdfNavigationBarProps> = ({
  viewerRef,
  currentPage,
  totalPages,
  onAIExplain,
  onQuizGenerate,
  selectedText,
  documentUri,
  documentType
}) => {
  const [chatVisible, setChatVisible] = useState(false);
  const chatAnimValue = useRef(new Animated.Value(0)).current;
  const [quizVisible, setQuizVisible] = useState(false);
  const quizAnimValue = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
    
    Animated.timing(chatAnimValue, {
      toValue: chatVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
    
    if (chatVisible && keyboardVisible) {
      Keyboard.dismiss();
    }
    
    if (onAIExplain) {
      onAIExplain(selectedText);
    }
  };

  const handleQuizGenerate = () => {
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
    
    Animated.timing(quizAnimValue, {
      toValue: quizVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: false
    }).start();
    
    if (quizVisible && keyboardVisible) {
      Keyboard.dismiss();
    }
    
    if (onQuizGenerate) {
      onQuizGenerate(selectedText);
    }
  };

  const iconColor = "#6b7280";
  const disabledColor = "#d1d5db";
  const activeColor = "#8b5cf6";
  const quizActiveColor = "#EC4899";

  const chatContainerStyle = {
    bottom: keyboardVisible ? keyboardHeight - 50 : 30,
  };

  const toolbarContainerStyle = {
    opacity: keyboardVisible ? 0 : 1,
    transform: [{ translateY: keyboardVisible ? 100 : 0 }]
  };

  return (
    <View style={[styles.container, chatContainerStyle]}>
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

      <Animated.View style={[styles.toolbarContainer, toolbarContainerStyle]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handlePreviousPage}
          disabled={currentPage <= 1}
        >
          <Icon name="chevron-left" size={20} color={currentPage <= 1 ? disabledColor : iconColor} />
        </TouchableOpacity>

        <Text style={styles.pageNumber}>{currentPage} / {totalPages}</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNextPage}
          disabled={currentPage >= totalPages}
        >
          <Icon name="chevron-right" size={20} color={currentPage >= totalPages ? disabledColor : iconColor} />
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity 
          style={styles.textButton}
          onPress={handleAIExplain}
        >
          <Icon name="chat" size={16} color={chatVisible ? activeColor : iconColor} />
          <Text style={[
            styles.buttonText,
            {color: chatVisible ? activeColor : iconColor}
          ]}>
            Analyze
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.textButton}
          onPress={handleQuizGenerate}
        >
          <Icon name="quiz" size={16} color={quizVisible ? quizActiveColor : iconColor} />
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