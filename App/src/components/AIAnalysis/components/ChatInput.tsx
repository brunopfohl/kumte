import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../../icons';

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChange}
        returnKeyType="send"
        onSubmitEditing={onSend}
        multiline
      />
      <TouchableOpacity 
        style={[
          styles.sendButton,
          value.trim().length === 0 && styles.sendButtonDisabled
        ]}
        disabled={value.trim().length === 0}
        onPress={onSend}
      >
        <Icon name="send" size={20} color={value.trim().length === 0 ? "#9ca3af" : "#ffffff"} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
    color: '#374151',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
}); 