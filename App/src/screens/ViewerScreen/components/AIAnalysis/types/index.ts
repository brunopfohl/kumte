import { Animated } from 'react-native';

export interface Keyword {
  concept: string;
  definition: string;
  significance: string;
  importanceScore: number;
  relatedConcepts: string[];
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

export interface ConceptMap {
  centralConcept: string;
  nodes: ConceptNode[];
  links: ConceptLink[];
  summary: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  level: number;
}

export interface ConceptLink {
  source: string;
  target: string;
  label: string;
  type: 'hierarchical' | 'cross-link';
}

export interface Flashcard {
  front: string;
  back: string;
  difficultyLevel: number;
  tags: string[];
  conceptCategory: string;
} 