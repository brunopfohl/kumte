import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { LibraryScreenProps } from '../types';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library Screen</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Mock Import File"
          onPress={() => {}}
        />
        <Button
          title="Mock Capture Image"
          onPress={() => navigation.navigate('Camera')}
        />
      </View>

      <Text style={styles.placeholder}>Document List Placeholder</Text>

      <Button
        title="Go to Viewer (Mock)"
        onPress={() => navigation.navigate('Viewer', {
          uri: 'mock-uri',
          type: 'pdf'
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  placeholder: {
    marginVertical: 20,
    color: '#666',
  },
}); 