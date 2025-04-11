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
  };

  // Simplify dismissQuiz function - just reset the quiz
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
      // Quiz completed, just show alert
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

      const response = await DocumentService.generateQuizQuestions(
        doc,
        textToAnalyze,
        selectedLanguage.code
      );
      
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
          
          // Set current quiz and show it immediately
          setCurrentQuiz(quiz);
          setQuizGenerated(true);
          setCurrentQuestionIndex(0);
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

  // Calculate container position based on keyboard
  const chatContainerStyle = {
    bottom: keyboardVisible ? keyboardHeight - 50 : 30,
  };

  if (!visible) return null;
  
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
});

export default QuizPanel; 