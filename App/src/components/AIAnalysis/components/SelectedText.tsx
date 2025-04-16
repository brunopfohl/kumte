import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SelectedTextProps {
  text: string;
}

export const SelectedText: React.FC<SelectedTextProps> = ({ text }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>SELECTED TEXT:</Text>
      <Text style={styles.content} numberOfLines={1} ellipsizeMode="tail">
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    color: '#374151',
  },
}); 