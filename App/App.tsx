/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { ViewerScreen } from './src/screens/ViewerScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Library"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen
          name="Library"
          component={LibraryScreen}
          options={{ title: 'IntelliRead' }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: 'Capture Image' }}
        />
        <Stack.Screen
          name="Viewer"
          component={ViewerScreen}
          options={{ title: 'View Document' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: 'Chat about Document' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
