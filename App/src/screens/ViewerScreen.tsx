import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { Image } from 'react-native';
import axios from 'axios';
import { Document, NavigationProps } from '../types/navigation';

export const ViewerScreen = ({ route, navigation }: NavigationProps<'Viewer'>) => {
  const { document } = route.params;
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleGetSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/summarize', {
        documentType: document.type,
        content: document.uri, // In a real app, you'd need to handle file content properly
      });
      setSummary(response.data.summary);
      setShowSummary(true);
    } catch (error) {
      console.error('Error getting summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    navigation.navigate('Chat', { document });
  };

  return (
    <View style={styles.container}>
      {document.type === 'pdf' ? (
        <Pdf
          source={{ uri: document.uri }}
          style={styles.document}
          onLoadComplete={(numberOfPages: number, filePath: string) => {
            console.log(`PDF loaded with ${numberOfPages} pages`);
          }}
        />
      ) : (
        <Image source={{ uri: document.uri }} style={styles.document} />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetSummary}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get Summary</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleChat}>
          <Text style={styles.buttonText}>Chat about Content</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSummary}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSummary(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.summaryText}>{summary}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSummary(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  document: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 