import { Animated } from 'react-native';

export interface Keyword {
  word: string;
  summary: string;
  relevance: number;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Language {
  code: string;
  name: string;
}

export interface AIAnalysisPanelProps {
  visible: boolean;
  selectedText: string;
  documentUri: string;
  documentType: 'pdf' | 'image';
  animValue: Animated.Value;
  keyboardHeight: number;
  keyboardVisible: boolean;
  onClose: () => void;
} 