import React from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { sharedStyles } from '../styles/sharedStyles';

interface MessageAreaProps {
  response: string;
  loading: boolean;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  response,
  loading,
}) => {
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={sharedStyles.loadingContainer}>
          <ActivityIndicator size="small" color="#8b5cf6" />
          <Text style={sharedStyles.loadingText}>Getting analysis from Gemini...</Text>
        </View>
      ) : response ? (
        <ScrollView style={styles.scrollView}>
          <Markdown style={markdownStyles}>
            {response}
          </Markdown>
        </ScrollView>
      ) : (
        <Text style={styles.placeholder}>
          AI response will appear here...
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 16,
  },
  scrollView: {
    flex: 1,
  },
  placeholder: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

const markdownStyles = {
  body: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  heading1: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  heading3: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  link: {
    color: '#8b5cf6',
  },
  blockquote: {
    backgroundColor: '#f3f4f6',
    borderLeftColor: '#8b5cf6',
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginLeft: 0,
    marginRight: 0,
  },
  code_inline: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
  },
}; 