import React, { useState, useEffect } from 'react';
import { Animated, SafeAreaView, StyleSheet, Platform, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, STORAGE_KEY, Language } from '../../../../components/LanguageSelector';
import { GenerationForm } from './components/GenerationForm';
import { QuizContent } from './components/QuizContent';
import { useQuizGeneration } from './hooks/useQuizGeneration';
import { useQuizState } from './hooks/useQuizState';
import { QuizPanelProps } from './types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const QuizPanel: React.FC<QuizPanelProps> = ({
  visible,
  selectedText,
  documentUri,
  documentType,
  animValue,
  keyboardHeight,
  keyboardVisible,
  onClose
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  
  const { 
    currentQuiz, 
    quizGenerated, 
    currentQuestionIndex,
    selectedAnswer,
    answerSubmitted,
    score,
    resetQuiz,
    setQuizGenerated,
    setCurrentQuiz,
    setCurrentQuestionIndex,
    setSelectedAnswer,
    setAnswerSubmitted,
    setScore,
  } = useQuizState();

  const {
    numberOfQuestions, 
    setNumberOfQuestions,
    additionalPrompt, 
    setAdditionalPrompt,
    generating, 
    setGenerating,
    includeMultipleChoice, 
    setIncludeMultipleChoice,
    includeTrueFalse, 
    setIncludeTrueFalse,
    difficultyLevel, 
    setDifficultyLevel,
    generateQuiz
  } = useQuizGeneration({
    documentUri,
    documentType,
    selectedText,
    selectedLanguage,
    setQuizGenerated,
    setCurrentQuiz,
    resetQuiz
  });

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguageCode = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedLanguageCode) {
          const language = LANGUAGES.find(lang => lang.code === savedLanguageCode);
          if (language) {
            setSelectedLanguage(language);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadLanguage();
  }, [visible]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const dismissQuiz = () => {
    resetQuiz();
  };

  const handleAnswerSelect = (index: number) => {
    if (!answerSubmitted) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !currentQuiz) return;

    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prevScore: number) => prevScore + 1);
    }

    setAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!currentQuiz) return;

    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev: number) => prev + 1);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } else {
      Alert.alert(
        'Quiz Completed!',
        `Your score: ${score}/${currentQuiz.questions.length}`,
        [
          { text: 'Try Again', onPress: resetQuiz },
          { text: 'Back to Document', onPress: onClose }
        ]
      );
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.quizWindow,
        {
          opacity: opacity,
          transform: [{ translateY: translateY }]
        }
      ]}
    >
      <SafeAreaView style={styles.container}>
        {quizGenerated && currentQuiz ? (
          <QuizContent
            currentQuiz={currentQuiz}
            currentQuestionIndex={currentQuestionIndex}
            selectedAnswer={selectedAnswer}
            answerSubmitted={answerSubmitted}
            score={score}
            onClose={onClose}
            onAnswerSelect={handleAnswerSelect}
            onSubmitAnswer={handleSubmitAnswer}
            onNextQuestion={handleNextQuestion}
            onDismissQuiz={dismissQuiz}
          />
        ) : (
          <GenerationForm
            selectedText={selectedText}
            numberOfQuestions={numberOfQuestions}
            setNumberOfQuestions={setNumberOfQuestions}
            additionalPrompt={additionalPrompt}
            setAdditionalPrompt={setAdditionalPrompt}
            generating={generating}
            includeMultipleChoice={includeMultipleChoice}
            setIncludeMultipleChoice={setIncludeMultipleChoice}
            includeTrueFalse={includeTrueFalse}
            setIncludeTrueFalse={setIncludeTrueFalse}
            difficultyLevel={difficultyLevel}
            setDifficultyLevel={setDifficultyLevel}
            onGenerateQuiz={generateQuiz}
            onClose={onClose}
            keyboardHeight={keyboardHeight}
            keyboardVisible={keyboardVisible}
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  quizWindow: {
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
});

export default QuizPanel; 