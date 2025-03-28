import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  uri: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'model';
}

export type RootStackParamList = {
  Library: undefined;
  Camera: undefined;
  Viewer: { document: Document };
  Chat: { document: Document };
};

export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: NativeStackNavigationProp<RootStackParamList, T>;
  route: {
    params: RootStackParamList[T];
  };
}; 