import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document, NavigationProps } from '../types/navigation';

export const LibraryScreen = ({ navigation }: NavigationProps<'Library'>) => {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const storedDocs = await AsyncStorage.getItem('documents');
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });

      const file = result[0];
      const newUri = `${RNFS.DocumentDirectoryPath}/${file.name}`;

      // Copy file to app's directory
      await RNFS.copyFile(file.uri, newUri);

      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type === 'application/pdf' ? 'pdf' : 'image',
        uri: newUri,
      };

      const updatedDocs = [...documents, newDoc];
      await AsyncStorage.setItem('documents', JSON.stringify(updatedDocs));
      setDocuments(updatedDocs);
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Error', 'Failed to import file');
      }
    }
  };

  const handleCaptureImage = () => {
    navigation.navigate('Camera');
  };

  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => navigation.navigate('Viewer', { document: item })}>
      <Text style={styles.documentName}>{item.name}</Text>
      <Text style={styles.documentType}>{item.type.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleImportFile}>
          <Text style={styles.buttonText}>Import File</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCaptureImage}>
          <Text style={styles.buttonText}>Capture Image</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
  list: {
    flex: 1,
  },
  documentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 