import { Animated } from 'react-native';

export interface QuizPanelProps {
  visible: boolean;
  selectedText: string;
  documentUri: string;
  documentType: 'pdf' | 'image';
  animValue: Animated.Value;
  keyboardHeight: number;
  keyboardVisible: boolean;
  onClose: () => void;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  learningObjective?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Date;
  documentUri: string;
}

export interface QuizContentProps {
  currentQuiz: Quiz;
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  answerSubmitted: boolean;
  score: number;
  onClose: () => void;
  onAnswerSelect: (index: number) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  onDismissQuiz: () => void;
}

export interface GenerationFormProps {
  selectedText: string;
  numberOfQuestions: number;
  setNumberOfQuestions: (value: number) => void;
  additionalPrompt: string;
  setAdditionalPrompt: (value: string) => void;
  generating: boolean;
  includeMultipleChoice: boolean;
  setIncludeMultipleChoice: (value: boolean) => void;
  includeTrueFalse: boolean;
  setIncludeTrueFalse: (value: boolean) => void;
  difficultyLevel: number;
  setDifficultyLevel: (value: number) => void;
  onGenerateQuiz: () => Promise<void>;
  onClose: () => void;
  keyboardHeight: number;
  keyboardVisible: boolean;
}

export interface QuizGenerationOptions {
  documentUri: string;
  documentType: 'pdf' | 'image';
  selectedText: string;
  selectedLanguage: any;
  setQuizGenerated: (value: boolean) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  resetQuiz: () => void;
} 