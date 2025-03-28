import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { LibraryScreenProps } from '../types';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ navigation }) => {
  const mockDocuments = [
    { id: '1', title: 'Research Paper', type: 'pdf', date: '10 May 2023' },
    { id: '2', title: 'Meeting Notes', type: 'image', date: '12 June 2023' },
    { id: '3', title: 'Project Proposal', type: 'pdf', date: '23 July 2023' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f9fc" />
      
      <View style={styles.header}>
        <Text style={styles.title}>IntelliRead</Text>
        <Text style={styles.subtitle}>Your AI Document Companion</Text>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.importButton]}
          onPress={() => {}}
        >
          <Text style={styles.actionButtonText}>Import Document</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.cameraButton]}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.actionButtonText}>Capture Image</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Documents</Text>
        
        <ScrollView style={styles.documentList}>
          {mockDocuments.map(doc => (
            <TouchableOpacity 
              key={doc.id}
              style={styles.documentItem}
              onPress={() => navigation.navigate('Viewer', {
                uri: `mock-uri-${doc.id}`,
                type: doc.type
              })}
            >
              <View style={styles.documentIconContainer}>
                <View style={[
                  styles.documentIcon, 
                  doc.type === 'pdf' ? styles.pdfIcon : styles.imageIcon
                ]}>
                  <Text style={styles.documentIconText}>
                    {doc.type === 'pdf' ? 'PDF' : 'IMG'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>{doc.title}</Text>
                <Text style={styles.documentMeta}>{doc.type.toUpperCase()} • {doc.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a2a3a',
  },
  subtitle: {
    fontSize: 16,
    color: '#617d98',
    marginTop: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  actionButton: {
    flex: 1,
    margin: 5,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  importButton: {
    backgroundColor: '#3a86ff',
  },
  cameraButton: {
    backgroundColor: '#677ce6',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  recentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a2a3a',
    marginBottom: 15,
  },
  documentList: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f7f9fc',
    alignItems: 'center',
  },
  documentIconContainer: {
    marginRight: 15,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfIcon: {
    backgroundColor: '#ff5a5f',
  },
  imageIcon: {
    backgroundColor: '#3a86ff',
  },
  documentIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a2a3a',
    marginBottom: 5,
  },
  documentMeta: {
    fontSize: 12,
    color: '#617d98',
  }
}); 