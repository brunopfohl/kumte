import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { ChatScreenProps } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { documentContext } = route.params;
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your AI assistant. How can I help you with this document?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');

    // Mock AI response
    setTimeout(() => {
      const mockResponses = [
        "I've analyzed the document. It appears to contain information about...",
        "Based on the content, I can tell you that...",
        "The main points of this document are...",
        "I can summarize this for you if you'd like. Just let me know what specific aspects you're interested in."
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const time = item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <View style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          item.sender === 'user' ? styles.userMessageBubble : styles.aiMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            item.sender === 'user' ? styles.userMessageText : styles.aiMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.messageTime}>{time}</Text>
      </View>
    );
  };

  const renderSuggestion = (text: string, index: number) => (
    <TouchableOpacity 
      key={index}
      style={styles.suggestionChip}
      onPress={() => setInputText(text)}
    >
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );

  const suggestions = [
    "Summarize the document",
    "Extract key points",
    "Explain in simpler terms",
    "Find any dates mentioned"
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Chat Assistant</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
            {documentContext}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {suggestions.map(renderSuggestion)}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#aaa"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#333',
    fontSize: 24,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2a3a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#617d98',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  settingsButtonText: {
    fontSize: 20,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 20,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageBubble: {
    backgroundColor: '#3a86ff',
  },
  aiMessageBubble: {
    backgroundColor: 'white',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 4,
  },
  suggestionsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  suggestionChip: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  suggestionText: {
    color: '#555',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3a86ff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
  },
}); 