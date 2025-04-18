import { useState } from 'react';
import { Alert } from 'react-native';
import { DocumentService } from '../../../../../services/DocumentService';
import { Document } from '../../../../../services/FileService';
import { Quiz, Question, QuizGenerationOptions } from '../types';

export const useQuizGeneration = ({
  documentUri,
  documentType,
  selectedText,
  selectedLanguage,
  setQuizGenerated,
  setCurrentQuiz,
  resetQuiz
}: QuizGenerationOptions) => {
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true);
  const [includeTrueFalse, setIncludeTrueFalse] = useState(true);
  const [difficultyLevel, setDifficultyLevel] = useState(2); // 1-easy, 2-medium, 3-hard

  const cleanJsonResponse = (text: string): string => {
    // Remove any text before the first [
    let cleaned = text;

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

  const generateQuiz = async (): Promise<void> => {
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

      const textToAnalyze = selectedText?.trim()
        ? `Here is the text to analyze: "${selectedText}"`
        : 'No text is selected. Generate questions from the entire document instead.';

      const response = await DocumentService.generateQuizQuestions(
        doc,
        textToAnalyze,
        numberOfQuestions,
        selectedLanguage.name
      );

      try {
        const cleanResponse = cleanJsonResponse(response);

        let parsedQuestions: Question[] = [];
        try {
          parsedQuestions = JSON.parse(cleanResponse) as Question[];
        } catch (parseError) {
          console.log('First parsing attempt failed, trying to extract JSON array:', parseError);

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
          const quizId = `quiz-${Date.now()}`;
          const quizTitle = selectedText ? 'Quiz on Selected Text' : 'Quiz on Document';
          const quiz: Quiz = {
            id: quizId,
            title: quizTitle,
            questions: parsedQuestions,
            createdAt: new Date(),
            documentUri
          };

          setCurrentQuiz(quiz);
          setQuizGenerated(true);
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

  return {
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
  };
}; 