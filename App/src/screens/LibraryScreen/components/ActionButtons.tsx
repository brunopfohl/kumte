import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '../../../components/icons';

interface ActionButtonsProps {
  onImport: () => void;
  onCapture: () => void;
  importing: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onImport, onCapture, importing }) => {
  return (
    <View style={styles.actionContainer}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={onImport}
        disabled={importing}
      >
        <View style={styles.actionIconContainer}>
          <Icon name="download" size={24} color="#3498db" />
        </View>
        <Text style={styles.actionButtonText}>Import Document</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={onCapture}
      >
        <View style={styles.actionIconContainer}>
          <Icon name="camera" size={24} color="#3498db" />
        </View>
        <Text style={styles.actionButtonText}>Scan</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#ebf5ff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
}); 