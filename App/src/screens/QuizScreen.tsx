import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../components/icons';
import { QuizScreenProps } from '../types';

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

const QuizScreen: React.FC<QuizScreenProps> = ({ route, navigation }) => {
  const { quizId } = route.params;
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      // First try the new storage format
      try {
        // Get the quiz metadata from the index
        const indexStr = await AsyncStorage.getItem('quiz_index');
        if (indexStr) {
          const quizIndex = JSON.parse(indexStr) as Omit<Quiz, 'questions'>[];
          const quizMeta = quizIndex.find(q => q.id === quizId);
          
          if (quizMeta) {
            // Get the questions from the separate storage
            const questionsStr = await AsyncStorage.getItem(`quiz_${quizId}`);
            if (questionsStr) {
              const questions = JSON.parse(questionsStr) as Question[];
              
              // Reconstruct the full quiz
              const fullQuiz: Quiz = {
                ...quizMeta,
                questions,
                createdAt: new Date(quizMeta.createdAt)
              };
              
              setQuiz(fullQuiz);
              return; // Success, exit early
            }
          }
        }
      } catch (error) {
        console.log('Could not find quiz in new storage format, trying legacy format...');
      }
      
      // Fall back to the old storage format
      const quizzesStr = await AsyncStorage.getItem('quizzes');
      if (quizzesStr) {
        const parsedQuizzes = JSON.parse(quizzesStr) as Quiz[];
        // Convert string dates to Date objects
        const processedQuizzes = parsedQuizzes.map(quiz => ({
          ...quiz,
          createdAt: new Date(quiz.createdAt)
        }));
        
        const foundQuiz = processedQuizzes.find(q => q.id === quizId);
        if (foundQuiz) {
          setQuiz(foundQuiz);
        } else {
          Alert.alert('Error', 'Quiz not found');
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', 'No quizzes found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (!answerSubmitted) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !quiz) return;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    setAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setScore(0);
    setQuizCompleted(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EC4899" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading quiz</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (quizCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="download" size={20} color="#EC4899" />
            <Text style={styles.backButtonText}>Back to Library</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{quiz.title}</Text>
        </View>

        <View style={styles.completedContainer}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreTitle}>Quiz Completed!</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreTotal}>/{quiz.questions.length}</Text>
            </View>
            <Text style={styles.scorePercentage}>
              {Math.round((score / quiz.questions.length) * 100)}%
            </Text>
          </View>
          
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={restartQuiz}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.libraryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.libraryButtonText}>Back to Library</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="download" size={20} color="#EC4899" />
          <Text style={styles.backButtonText}>Back to Library</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{quiz.title}</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </Text>
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
            <TouchableOpacity 
              style={[styles.submitButton, selectedAnswer === null && styles.submitButtonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.nextButton, isLastQuestion && styles.finishButton]}
              onPress={handleNextQuestion}
            >
              <Text style={styles.nextButtonText}>
                {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC4899',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#EC4899',
    marginLeft: 8,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  questionContainer: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  explanationContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  actionButtonsContainer: {
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    paddingVertical: 16,
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
    borderRadius: 12,
    paddingVertical: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  completedContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fdf2f8',
    borderWidth: 4,
    borderColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#EC4899',
  },
  scoreTotal: {
    fontSize: 24,
    fontWeight: '500',
    color: '#6b7280',
  },
  scorePercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  libraryButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  libraryButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizScreen; 