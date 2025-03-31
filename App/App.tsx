/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ViewerScreen } from './src/screens/ViewerScreen';
import { ChatScreen } from './src/screens/ChatScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer children={
      <Stack.Navigator screenOptions={{ headerShown: false }} children={
        <>
          <Stack.Screen 
            name="Library" 
            component={LibraryScreen}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen}
          />
          <Stack.Screen 
            name="Viewer" 
            component={ViewerScreen}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
          />
        </>
      } />
    } />
  );
}
