import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Library: undefined;
  Camera: undefined;
  Viewer: {
    uri: string;
    type: string;
  };
  Chat: {
    documentContext: string;
  };
};

export type LibraryScreenProps = NativeStackScreenProps<RootStackParamList, 'Library'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
export type ViewerScreenProps = NativeStackScreenProps<RootStackParamList, 'Viewer'>;
export type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>; 