import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Keyword } from '../types';

interface KeywordDetailProps {
  keyword: Keyword | null;
  onClose: () => void;
}

export const KeywordDetail: React.FC<KeywordDetailProps> = ({
  keyword,
  onClose,
}) => {
  if (!keyword) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{keyword.word}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <Markdown style={markdownStyles}>
          {keyword.summary}
        </Markdown>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '400',
  },
  scrollView: {
    maxHeight: 200,
    padding: 16,
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