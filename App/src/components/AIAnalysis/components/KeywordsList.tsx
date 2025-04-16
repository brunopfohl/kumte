import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Keyword } from '../types';

interface KeywordsListProps {
  keywords: Keyword[];
  loading: boolean;
  onKeywordPress: (keyword: Keyword) => void;
}

export const KeywordsList: React.FC<KeywordsListProps> = ({
  keywords,
  loading,
  onKeywordPress,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#8b5cf6" />
        <Text style={styles.loadingText}>Extracting keywords...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KEY CONCEPTS</Text>
      {keywords.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {keywords.map((keyword, index) => (
            <TouchableOpacity 
              key={`keyword-${index}`} 
              style={styles.badge}
              onPress={() => onKeywordPress(keyword)}
            >
              <Text style={styles.keywordText}>{keyword.word}</Text>
              <Text style={styles.relevance}>{keyword.relevance}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noKeywordsText}>No keywords found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 8,
    paddingRight: 16,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keywordText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  relevance: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '700',
    marginLeft: 6,
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  noKeywordsText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
}); 