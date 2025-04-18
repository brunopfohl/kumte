import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
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
        <ActivityIndicator color="#8b5cf6" size="small" />
        <Text style={styles.loadingText}>Extracting key concepts...</Text>
      </View>
    );
  }

  if (keywords.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Key Concepts</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {keywords.map((keyword, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.keyword,
              { backgroundColor: getColorByScore(keyword.importanceScore) }
            ]}
            onPress={() => onKeywordPress(keyword)}
          >
            <Text style={styles.keywordText}>{keyword.concept}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const getColorByScore = (score: number): string => {
  // Create a color gradient based on importance score
  if (score >= 0.8) return '#8b5cf6'; // Purple for highest relevance
  if (score >= 0.6) return '#6366f1'; // Indigo
  if (score >= 0.4) return '#3b82f6'; // Blue
  if (score >= 0.2) return '#0ea5e9'; // Light blue
  return '#06b6d4'; // Cyan for lowest relevance
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  scrollView: {
    flexDirection: 'row',
  },
  keyword: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  keywordText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6b7280',
    fontSize: 14,
  },
}); 