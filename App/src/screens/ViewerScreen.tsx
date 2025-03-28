import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { ViewerScreenProps } from '../types';

export const ViewerScreen: React.FC<ViewerScreenProps> = ({ navigation, route }) => {
  const { uri, type } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Viewer Screen</Text>
      <Text style={styles.subtitle}>Viewing: {uri}</Text>
      <Text style={styles.subtitle}>Type: {type}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Mock Get Summary"
          onPress={() => {}}
        />
        <Button
          title="Mock Chat about Content"
          onPress={() => navigation.navigate('Chat', {
            documentContext: `Chatting about: ${uri}`
          })}
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  buttonContainer: {
    gap: 10,
    marginTop: 20,
  },
}); 