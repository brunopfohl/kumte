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
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
  Switch,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import { DocumentService } from '../services/DocumentService';
import { Document } from '../services/FileService';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, STORAGE_KEY, Language } from './LanguageSelector';

// Generate Icon component
const GenerateIcon = ({ color = "currentColor" }: { color?: string }) => (
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
    <Path d="M3 8l4.394 4.394a2 2 0 0 1 0 2.83L3 19.5" />
    <Path d="M13.757 6.833l1.122 1.122a3 3 0 0 1 0 4.243l-1.122 1.122a3 3 0 0 1 -4.243 0l-1.122 -1.122a3 3 0 0 1 0 -4.243l1.122 -1.122a3 3 0 0 1 4.243 0z" />
    <Path d="M21 15l-4.394 -4.394a2 2 0 0 1 0 -2.83L21 4" />
  </Svg>
);

interface QuizPanelProps {
  visible: boolean;
  selectedText: string;
  documentUri: string;
  documentType: 'pdf' | 'image';
  animValue: Animated.Value;
  keyboardHeight: number;
  keyboardVisible: boolean;
  onClose: () => void;
}

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

// Constants for quiz state
const QUIZ_STATES_KEY = 'quiz_states';
interface QuizState {
  quizId: string;
  currentQuestionIndex: number;
  score: number;
  completed: boolean;
  dismissed: boolean;
  timestamp: number;
}

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
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true);
  const [includeTrueFalse, setIncludeTrueFalse] = useState(true);
  const [difficultyLevel, setDifficultyLevel] = useState(2); // 1-easy, 2-medium, 3-hard
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizGenerated, setQuizGenerated] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(LANGUAGES[0]);
  const [showQuizSelection, setShowQuizSelection] = useState(false);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [dismissedQuizzes, setDismissedQuizzes] = useState<Record<string, QuizState>>({});

  // Load the selected language from AsyncStorage
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
  }, [visible]); // Reload whenever panel becomes visible

  // Handle initial quiz selection display
  useEffect(() => {
    if (visible && !quizGenerated && !generating && savedQuizzes.length > 0) {
      setShowQuizSelection(true);
    }
  }, [visible, savedQuizzes, quizGenerated, generating]);

  useEffect(() => {
    // Load dismissed quiz states when component mounts
    const loadQuizStates = async () => {
      try {
        const statesStr = await AsyncStorage.getItem(QUIZ_STATES_KEY);
        if (statesStr) {
          const states = JSON.parse(statesStr) as Record<string, QuizState>;
          setDismissedQuizzes(states);
        }
      } catch (error) {
        console.error('Error loading quiz states:', error);
      }
    };

    // Load saved quizzes
    const loadSavedQuizzes = async () => {
      try {
        // Try the new storage format first
        try {
          const indexStr = await AsyncStorage.getItem('quiz_index');
          if (indexStr) {
            const quizIndex = JSON.parse(indexStr) as Omit<Quiz, 'questions'>[];
            
            // Convert string dates to Date objects
            const processedQuizMeta = quizIndex.map(quiz => ({
              ...quiz,
              createdAt: new Date(quiz.createdAt),
              questions: [] as Question[] // Empty placeholder
            }));
            
            setSavedQuizzes(processedQuizMeta);
            return;
          }
        } catch (error) {
          console.log('Could not find quizzes in new storage format, trying legacy format...');
        }
        
        // Fall back to the old storage format
        const quizzesStr = await AsyncStorage.getItem('quizzes');
        if (quizzesStr) {
          const parsedQuizzes = JSON.parse(quizzesStr) as Quiz[];
          const processedQuizzes = parsedQuizzes.map(quiz => ({
            ...quiz,
            createdAt: new Date(quiz.createdAt)
          }));
          setSavedQuizzes(processedQuizzes);
        }
      } catch (error) {
        console.error('Error loading saved quizzes:', error);
      }
    };
    
    if (visible) {
      loadQuizStates();
      loadSavedQuizzes();
    }
  }, [visible]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const resetQuiz = () => {
    setQuizGenerated(false);
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setScore(0);
    setShowQuizSelection(false);
  };

  // Function to dismiss a quiz and save its state
  const dismissQuiz = async () => {
    if (currentQuiz) {
      try {
        // Save the current state of the quiz
        const quizState: QuizState = {
          quizId: currentQuiz.id,
          currentQuestionIndex,
          score,
          completed: false,
          dismissed: true,
          timestamp: Date.now()
        };
        
        // Update the local state
        setDismissedQuizzes(prev => ({
          ...prev,
          [currentQuiz.id]: quizState
        }));
        
        // Save to AsyncStorage
        const statesStr = await AsyncStorage.getItem(QUIZ_STATES_KEY);
        const states: Record<string, QuizState> = statesStr ? JSON.parse(statesStr) : {};
        states[currentQuiz.id] = quizState;
        await AsyncStorage.setItem(QUIZ_STATES_KEY, JSON.stringify(states));
        
        // Reset the quiz view
        resetQuiz();
        setShowQuizSelection(true);
      } catch (error) {
        console.error('Error dismissing quiz:', error);
        Alert.alert('Error', 'Failed to save quiz state');
      }
    } else {
      resetQuiz();
    }
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
      setScore(prevScore => prevScore + 1);
    }
    
    setAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!currentQuiz) return;
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } else {
      // Quiz completed, update quiz state
      if (currentQuiz) {
        const updateQuizState = async () => {
          try {
            const quizState: QuizState = {
              quizId: currentQuiz.id,
              currentQuestionIndex: currentQuiz.questions.length - 1,
              score,
              completed: true,
              dismissed: false,
              timestamp: Date.now()
            };
            
            // Update the local state
            setDismissedQuizzes(prev => ({
              ...prev,
              [currentQuiz.id]: quizState
            }));
            
            // Save to AsyncStorage
            const statesStr = await AsyncStorage.getItem(QUIZ_STATES_KEY);
            const states: Record<string, QuizState> = statesStr ? JSON.parse(statesStr) : {};
            states[currentQuiz.id] = quizState;
            await AsyncStorage.setItem(QUIZ_STATES_KEY, JSON.stringify(states));
          } catch (error) {
            console.error('Error saving quiz completion state:', error);
          }
        };
        
        updateQuizState();
      }
      
      // Show quiz completed alert
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
  
  // Load a saved quiz with its questions
  const loadSavedQuiz = async (quizId: string) => {
    try {
      setGenerating(true); // Show loading state
      
      // Get the quiz metadata
      const indexStr = await AsyncStorage.getItem('quiz_index');
      if (indexStr) {
        const quizIndex = JSON.parse(indexStr) as Omit<Quiz, 'questions'>[];
        const quizMeta = quizIndex.find(q => q.id === quizId);
        
        if (quizMeta) {
          // Get the questions
          const questionsStr = await AsyncStorage.getItem(`quiz_${quizId}`);
          if (questionsStr) {
            const questions = JSON.parse(questionsStr) as Question[];
            
            // Create the full quiz object
            const quiz: Quiz = {
              ...quizMeta,
              questions,
              createdAt: new Date(quizMeta.createdAt)
            };
            
            // Check if we have a saved state
            const state = dismissedQuizzes[quizId];
            if (state && !state.completed) {
              // Resume from saved state
              setCurrentQuestionIndex(state.currentQuestionIndex);
              setScore(state.score);
            } else {
              // Start from beginning
              setCurrentQuestionIndex(0);
              setScore(0);
            }
            
            setSelectedAnswer(null);
            setAnswerSubmitted(false);
            setCurrentQuiz(quiz);
            setQuizGenerated(true);
            setShowQuizSelection(false);
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
    } finally {
      setGenerating(false);
    }
  };

  // Generate a new quiz from document content
  const generateQuiz = async () => {
    if (!documentUri) {
      Alert.alert('Error', 'Document URI is missing');
      return;
    }

    setGenerating(true);
    resetQuiz();

    try {
      const doc: Document = {
        id: `quiz-${Date.now()}`,
        title: 'Quiz Document',
        type: documentType,
        uri: documentUri,
        date: new Date()
      };

      const questionTypes = [];
      if (includeMultipleChoice) questionTypes.push('multiple-choice');
      if (includeTrueFalse) questionTypes.push('true-false');

      if (questionTypes.length === 0) {
        Alert.alert('Please select at least one question type');
        setGenerating(false);
        return;
      }

      const difficultyMap = {
        1: 'easy',
        2: 'medium',
        3: 'hard'
      };

      const textToAnalyze = selectedText?.trim() 
        ? `Here is the text to analyze: "${selectedText}"` 
        : 'No text is selected. Generate questions from the entire document instead.';

      // Add language instruction
      const languageInstruction = selectedLanguage.code !== 'en'
        ? `Generate the quiz in ${selectedLanguage.name}. Both questions and answers should be in ${selectedLanguage.name}.`
        : '';

      const instruction = `
        Create a quiz with ${numberOfQuestions} questions based on the provided content.
        ${additionalPrompt ? `Additional instructions: ${additionalPrompt}` : ''}
        
        The questions should be ${difficultyMap[difficultyLevel as keyof typeof difficultyMap]} difficulty.
        Include these question types: ${questionTypes.join(', ')}.
        ${languageInstruction}
        
        Format the output as a valid JSON array that can be parsed. Each question object should have:
        - "id": unique string (use just numbers 1, 2, 3...)
        - "question": the full question text (concise)
        - "options": array of possible answers (4 options for multiple choice, 2 for true/false)
        - "correctAnswer": index of the correct answer (0-based)
        - "explanation": brief explanation of why the answer is correct (keep this short)
        
        Keep all text as concise as possible while maintaining accuracy.
        Make sure all questions are clear, accurate, and based on the provided content.
        Only return the JSON array, no other text.
        Escape all special characters properly to ensure valid JSON.
        
        ${textToAnalyze}
      `;

      console.log('Generating quiz...');
      const response = await DocumentService.analyzeDocumentWithGemini(doc, instruction);
      
      try {
        // Clean up the response to ensure it's valid JSON
        const cleanResponse = cleanJsonResponse(response);
        
        let parsedQuestions: Question[] = [];
        try {
          // First attempt: try parsing the full response
          parsedQuestions = JSON.parse(cleanResponse) as Question[];
        } catch (parseError) {
          console.log('First parsing attempt failed, trying to extract JSON array:', parseError);
          
          // Second attempt: try to extract the JSON array using regex
          const jsonStart = cleanResponse.indexOf('[');
          const jsonEnd = cleanResponse.lastIndexOf(']') + 1;
          
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            const jsonStr = cleanResponse.substring(jsonStart, jsonEnd);
            parsedQuestions = JSON.parse(jsonStr) as Question[];
          } else {
            throw new Error('Could not find JSON array in response');
          }
        }
        
        if (parsedQuestions && parsedQuestions.length > 0) {
          // Create a new quiz
          const quizId = `quiz-${Date.now()}`;
          const quizTitle = selectedText ? 'Quiz on Selected Text' : 'Quiz on Document';
          const quiz: Quiz = {
            id: quizId,
            title: quizTitle,
            questions: parsedQuestions,
            createdAt: new Date(),
            documentUri
          };
          
          // Save to AsyncStorage more efficiently by chunking the questions
          try {
            await saveQuizToStorage(quiz);
            
            // Set current quiz and show it immediately
            setCurrentQuiz(quiz);
            setQuizGenerated(true);
            setCurrentQuestionIndex(0);
          } catch (storageError) {
            console.error('Error saving quiz to storage:', storageError);
            
            // Even if storage fails, still allow the user to take the quiz
            setCurrentQuiz(quiz);
            setQuizGenerated(true);
            setCurrentQuestionIndex(0);
            
            // Inform the user their quiz won't be saved
            Alert.alert(
              'Storage Error',
              'We couldn\'t save this quiz for later, but you can still take it now.',
              [{ text: 'OK' }]
            );
          }
        } else {
          throw new Error('No questions could be generated or parsed');
        }
      } catch (parseError) {
        console.error('Error parsing quiz JSON:', parseError, 'Response:', response);
        Alert.alert('Error', 'Failed to parse quiz data. Please try again with a different language or shorter text.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      Alert.alert('Error', 'Failed to generate quiz. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };
  
  // Save quiz data to storage in a more efficient way
  const saveQuizToStorage = async (quiz: Quiz): Promise<void> => {
    try {
      // Get the quiz index (list of quiz metadata without questions)
      const indexKey = 'quiz_index';
      const existingIndexStr = await AsyncStorage.getItem(indexKey);
      const quizIndex: Omit<Quiz, 'questions'>[] = existingIndexStr ? JSON.parse(existingIndexStr) : [];
      
      // Create quiz metadata (without questions)
      const quizMeta = {
        id: quiz.id,
        title: quiz.title,
        createdAt: quiz.createdAt,
        documentUri: quiz.documentUri
      };
      
      // Update the index with this new quiz
      const updatedIndex = [quizMeta, ...quizIndex];
      await AsyncStorage.setItem(indexKey, JSON.stringify(updatedIndex));
      
      // Save the questions separately to avoid the CursorWindow size limit
      await AsyncStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(quiz.questions));
      
    } catch (error) {
      console.error('Error in saveQuizToStorage:', error);
      throw error;
    }
  };

  // Helper function to clean up the response for better JSON parsing
  const cleanJsonResponse = (text: string): string => {
    // Remove any text before the first [
    let cleaned = text;
    
    // Remove any markdown code block indicators
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    
    // Remove any non-JSON text before the array
    const firstBracket = cleaned.indexOf('[');
    if (firstBracket !== -1) {
      cleaned = cleaned.substring(firstBracket);
    }
    
    // Remove any text after the last ]
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleaned = cleaned.substring(0, lastBracket + 1);
    }
    
    // Fix common JSON formatting issues
    cleaned = cleaned.replace(/(\r\n|\n|\r)/gm, ' ') // Remove line breaks
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .replace(/,\s*]/g, ']') // Remove trailing commas
                    .replace(/,\s*}/g, '}'); // Remove trailing commas
    
    return cleaned;
  };

  // Select a quiz to resume or restart
  const selectQuiz = (quiz: Quiz) => {
    Alert.alert(
      'Quiz Options',
      `What would you like to do with "${quiz.title}"?`,
      [
        { 
          text: 'Resume Quiz', 
          onPress: () => loadSavedQuiz(quiz.id)
        },
        {
          text: 'Start Over',
          onPress: () => {
            // Reset the state and load the quiz
            const resetState = async () => {
              try {
                // Remove from dismissed states if it exists
                if (dismissedQuizzes[quiz.id]) {
                  const newStates = { ...dismissedQuizzes };
                  delete newStates[quiz.id];
                  setDismissedQuizzes(newStates);
                  
                  // Update AsyncStorage
                  await AsyncStorage.setItem(QUIZ_STATES_KEY, JSON.stringify(newStates));
                }
                
                // Load the quiz from beginning
                loadSavedQuiz(quiz.id);
              } catch (error) {
                console.error('Error resetting quiz state:', error);
              }
            };
            
            resetState();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Calculate container position based on keyboard
  const chatContainerStyle = {
    bottom: keyboardVisible ? keyboardHeight - 50 : 30,
  };

  if (!visible) return null;
  
  // Show quiz selection screen
  if (showQuizSelection) {
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
          <View style={styles.header}>
            <Text style={styles.title}>Quizzes</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <TouchableOpacity 
              style={styles.newQuizButton}
              onPress={() => setShowQuizSelection(false)} // Go back to the quiz generator
            >
              <View style={styles.newQuizIconContainer}>
                <GenerateIcon color="#ffffff" />
              </View>
              <Text style={styles.newQuizButtonText}>Create New Quiz</Text>
            </TouchableOpacity>
            
            {savedQuizzes.length > 0 ? (
              <>
                <Text style={styles.savedQuizzesTitle}>Saved Quizzes</Text>
                {savedQuizzes.map((quiz) => {
                  const quizState = dismissedQuizzes[quiz.id];
                  const isDismissed = quizState?.dismissed;
                  
                  return (
                    <TouchableOpacity 
                      key={quiz.id}
                      style={[
                        styles.savedQuizItem,
                        isDismissed && styles.dismissedQuizItem
                      ]}
                      onPress={() => selectQuiz(quiz)}
                    >
                      <View style={styles.quizIconSmall}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" />
                          {isDismissed ? (
                            <Path d="M9 9l6 6M15 9l-6 6" />
                          ) : (
                            <Path d="M8 12l3 3l6-6" />
                          )}
                        </Svg>
                      </View>
                      <View style={styles.savedQuizInfo}>
                        <Text style={styles.savedQuizTitle}>{quiz.title}</Text>
                        <Text style={styles.savedQuizMeta}>
                          {isDismissed ? 'Paused - Tap to resume' : 'Ready to start'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <View style={styles.noSavedQuizzes}>
                <Text style={styles.noSavedQuizzesText}>No saved quizzes found</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // Render quiz question view if a quiz has been generated
  if (quizGenerated && currentQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1;
    
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
          <View style={styles.header}>
            <Text style={styles.title}>Quiz</Text>
            <View style={styles.quizProgress}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {currentQuestionIndex + 1}/{currentQuiz.questions.length}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            </View>
            
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity 
                  key={`option-${index}`}
                  style={[
                    styles.optionButton,
                    selectedAnswer === index && styles.optionSelected,
                    answerSubmitted && index === currentQuestion.correctAnswer && styles.optionCorrect,
                    answerSubmitted && selectedAnswer === index && 
                    selectedAnswer !== currentQuestion.correctAnswer && styles.optionIncorrect
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={answerSubmitted}
                >
                  <View style={styles.optionLabelContainer}>
                    <Text style={styles.optionLabel}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {answerSubmitted && (
              <View style={styles.explanationContainer}>
                <Text style={styles.explanationTitle}>Explanation:</Text>
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
              </View>
            )}
            
            <View style={styles.actionButtonsContainer}>
              {!answerSubmitted ? (
                <>
                  <TouchableOpacity 
                    style={[styles.submitButton, selectedAnswer === null && styles.submitButtonDisabled]}
                    onPress={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                  >
                    <Text style={styles.submitButtonText}>Submit Answer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dismissButton}
                    onPress={dismissQuiz}
                  >
                    <Text style={styles.dismissButtonText}>Dismiss Quiz</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[styles.nextButton, isLastQuestion && styles.finishButton]}
                    onPress={handleNextQuestion}
                  >
                    <Text style={styles.nextButtonText}>
                      {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dismissButton}
                    onPress={dismissQuiz}
                  >
                    <Text style={styles.dismissButtonText}>Dismiss Quiz</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // Render quiz generator view (original view)
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
        <View style={styles.header}>
          <Text style={styles.title}>Generate Quiz</Text>
          {savedQuizzes.length > 0 && (
            <TouchableOpacity 
              style={styles.showSavedButton}
              onPress={() => setShowQuizSelection(true)}
            >
              <Text style={styles.showSavedButtonText}>Saved Quizzes</Text>
            </TouchableOpacity>
          )}
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
          >
            <View style={styles.selectedTextContainer}>
              <Text style={styles.sectionLabel}>SELECTED TEXT:</Text>
              <Text style={styles.selectedTextContent} numberOfLines={3} ellipsizeMode="tail">
                {selectedText || 'No text selected. Quiz will be generated from the entire document.'}
              </Text>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NUMBER OF QUESTIONS</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={50}
                  step={1}
                  value={numberOfQuestions}
                  onValueChange={setNumberOfQuestions}
                  minimumTrackTintColor="#EC4899"
                  maximumTrackTintColor="#e5e7eb"
                  thumbTintColor="#EC4899"
                />
                <Text style={styles.sliderValue}>{numberOfQuestions}</Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DIFFICULTY LEVEL</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={3}
                  step={1}
                  value={difficultyLevel}
                  onValueChange={setDifficultyLevel}
                  minimumTrackTintColor="#EC4899"
                  maximumTrackTintColor="#e5e7eb"
                  thumbTintColor="#EC4899"
                />
                <View style={styles.difficultyLabels}>
                  <Text style={[styles.difficultyLabel, difficultyLevel === 1 && styles.activeDifficultyLabel]}>Easy</Text>
                  <Text style={[styles.difficultyLabel, difficultyLevel === 2 && styles.activeDifficultyLabel]}>Medium</Text>
                  <Text style={[styles.difficultyLabel, difficultyLevel === 3 && styles.activeDifficultyLabel]}>Hard</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>QUESTION TYPES</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Multiple Choice</Text>
                <Switch
                  value={includeMultipleChoice}
                  onValueChange={setIncludeMultipleChoice}
                  trackColor={{ false: '#e5e7eb', true: '#F9A8D4' }}
                  thumbColor={includeMultipleChoice ? '#EC4899' : '#f4f3f4'}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>True/False</Text>
                <Switch
                  value={includeTrueFalse}
                  onValueChange={setIncludeTrueFalse}
                  trackColor={{ false: '#e5e7eb', true: '#F9A8D4' }}
                  thumbColor={includeTrueFalse ? '#EC4899' : '#f4f3f4'}
                />
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ADDITIONAL INSTRUCTIONS (OPTIONAL)</Text>
              <TextInput
                style={styles.additionalPromptInput}
                placeholder="Focus on specific topics, themes, or concepts..."
                placeholderTextColor="#9ca3af"
                value={additionalPrompt}
                onChangeText={setAdditionalPrompt}
                multiline
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.generateButton, generating && styles.generateButtonDisabled]}
              onPress={generateQuiz}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <GenerateIcon color="#ffffff" />
                  <Text style={styles.generateButtonText}>Generate Quiz</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoidContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  title: {
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
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  selectedTextContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
  },
  difficultyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeDifficultyLabel: {
    color: '#EC4899',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
  },
  additionalPromptInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#EC4899',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  generateButtonDisabled: {
    backgroundColor: '#f9a8d4',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quizProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC4899',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  questionContainer: {
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#EC4899',
    backgroundColor: '#fdf2f8',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionLabelContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  explanationContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#EC4899',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#f9a8d4',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: '#10B981',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dismissButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
  savedQuizzesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
    marginTop: 20,
  },
  savedQuizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dismissedQuizItem: {
    borderColor: '#fbcfe8',
    backgroundColor: '#fdf2f8',
  },
  quizIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedQuizInfo: {
    flex: 1,
  },
  savedQuizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  savedQuizMeta: {
    fontSize: 14,
    color: '#9ca3af',
  },
  noSavedQuizzes: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSavedQuizzesText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  newQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC4899',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  newQuizIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newQuizButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  showSavedButton: {
    flex: 1,
    alignItems: 'center',
  },
  showSavedButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
  },
});

export default QuizPanel; 