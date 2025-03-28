import React from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import { ChatScreenProps } from '../types';

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { documentContext } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat Screen</Text>
      <Text style={styles.subtitle}>{documentContext}</Text>
      
      <View style={styles.chatContainer}>
        <Text style={styles.placeholder}>Chat messages placeholder...</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          onChangeText={() => {}}
        />
        <Button
          title="Send"
          onPress={() => {}}
        />
      </View>

      <Button
        title="Go Back"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
}); 