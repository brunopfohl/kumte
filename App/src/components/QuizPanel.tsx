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

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0]
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const generateQuiz = async () => {
    if (!documentUri) {
      Alert.alert('Error', 'Document URI is missing');
      return;
    }

    setGenerating(true);

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

      const instruction = `
        Create a quiz with ${numberOfQuestions} questions based on the provided content.
        ${additionalPrompt ? `Additional instructions: ${additionalPrompt}` : ''}
        
        The questions should be ${difficultyMap[difficultyLevel as keyof typeof difficultyMap]} difficulty.
        Include these question types: ${questionTypes.join(', ')}.
        
        Format the output as a valid JSON array that can be parsed. Each question object should have:
        - "id": unique identifier string
        - "question": the full question text
        - "options": array of possible answers (4 options for multiple choice, 2 for true/false)
        - "correctAnswer": index of the correct answer (0-based)
        - "explanation": brief explanation of why the answer is correct
        
        Make sure all questions are clear, accurate, and based on the provided content.
        Only return the JSON array, no other text.
        
        ${textToAnalyze}
      `;

      console.log('Generating quiz...');
      const response = await DocumentService.analyzeDocumentWithGemini(doc, instruction);
      
      try {
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = response.substring(jsonStart, jsonEnd);
          const parsedQuestions = JSON.parse(jsonStr) as Question[];
          
          if (parsedQuestions.length > 0) {
            // Create a new quiz
            const quiz: Quiz = {
              id: `quiz-${Date.now()}`,
              title: selectedText ? 'Quiz on Selected Text' : 'Quiz on Document',
              questions: parsedQuestions,
              createdAt: new Date(),
              documentUri
            };
            
            // Save to AsyncStorage
            const existingQuizzesStr = await AsyncStorage.getItem('quizzes');
            const existingQuizzes: Quiz[] = existingQuizzesStr ? JSON.parse(existingQuizzesStr) : [];
            const updatedQuizzes = [quiz, ...existingQuizzes];
            await AsyncStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
            
            // Navigate to quiz screen (you'll need to implement this)
            // For now, just alert
            Alert.alert(
              'Quiz Generated!', 
              `Created a quiz with ${parsedQuestions.length} questions. You can find it in your quizzes.`,
              [
                { text: 'OK', onPress: () => onClose() }
              ]
            );
          } else {
            Alert.alert('Error', 'No questions could be generated. Try with different settings.');
          }
        } else {
          console.error('Could not find JSON in response:', response);
          Alert.alert('Error', 'Failed to parse quiz questions. Please try again.');
        }
      } catch (parseError) {
        console.error('Error parsing quiz JSON:', parseError);
        Alert.alert('Error', 'Failed to parse quiz data. Please try again.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      Alert.alert('Error', 'Failed to generate quiz. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };

  // Calculate container position based on keyboard
  const chatContainerStyle = {
    bottom: keyboardVisible ? keyboardHeight - 50 : 30,
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
                  maximumValue={10}
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
});

export default QuizPanel; 