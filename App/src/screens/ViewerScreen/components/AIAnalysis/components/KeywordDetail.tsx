import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Keyword } from '../types';

interface KeywordDetailProps {
  keyword: Keyword;
  onClose: () => void;
}

export const KeywordDetail: React.FC<KeywordDetailProps> = ({ keyword, onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{keyword.concept}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Definition</Text>
          <Text style={styles.description}>{keyword.definition}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Significance</Text>
          <Text style={styles.description}>{keyword.significance}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Importance Score</Text>
          <View style={styles.scoreContainer}>
            <View 
              style={[
                styles.scoreBar, 
                { width: `${Math.round(keyword.importanceScore * 100)}%` }
              ]} 
            />
            <Text style={styles.scoreText}>
              {Math.round(keyword.importanceScore * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Related Concepts</Text>
          {keyword.relatedConcepts.map((concept, index) => (
            <View key={index} style={styles.relatedConcept}>
              <Text style={styles.relatedConceptText}>• {concept}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 22,
    color: '#6b7280',
  },
  content: {
    padding: 16,
    maxHeight: 300,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  scoreContainer: {
    height: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  scoreText: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 4,
  },
  relatedConcept: {
    marginBottom: 4,
  },
  relatedConceptText: {
    fontSize: 14,
    color: '#4b5563',
  },
}); 