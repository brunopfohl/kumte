import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Document } from './services/FileService';

export type RootStackParamList = {
  Library: undefined;
  Camera: undefined;
  Viewer: {
    uri: string;
    type: 'pdf' | 'image';
  };
  Quiz: {
    quizId: string;
  };
};

export type LibraryScreenProps = NativeStackScreenProps<RootStackParamList, 'Library'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
export type ViewerScreenProps = NativeStackScreenProps<RootStackParamList, 'Viewer'>;
export type QuizScreenProps = NativeStackScreenProps<RootStackParamList, 'Quiz'>; 