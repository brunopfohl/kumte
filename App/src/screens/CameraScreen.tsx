import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraScreenProps } from '../types';

export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Screen</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Mock Take Picture"
          onPress={() => {}}
        />
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
        />
      </View>
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
  },
}); 