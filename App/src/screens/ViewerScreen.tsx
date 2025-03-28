import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ViewerScreenProps } from '../types';
import { FileService } from '../services/FileService';
import { DocumentService } from '../services/DocumentService';

const { width, height } = Dimensions.get('window');

export const ViewerScreen: React.FC<ViewerScreenProps> = ({ navigation, route }) => {
  const { uri, type } = route.params;
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [document, setDocument] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Options for different tools
  const [summaryType, setSummaryType] = useState<'brief' | 'detailed' | 'bullet'>('detailed');
  const [extractType, setExtractType] = useState<'keyPoints' | 'dates' | 'custom'>('keyPoints');
  const [translateLanguage, setTranslateLanguage] = useState<'spanish' | 'french' | 'german'>('french');

  useEffect(() => {
    loadDocument();
  }, []);

  const loadDocument = async () => {
    setLoading(true);
    try {
      // In a real app, we would use the uri to find the document
      // For now, we'll create a mock document
      const mockDoc = {
        id: '1',
        title: type === 'pdf' ? 'PDF Document' : 'Image Document',
        type: type as 'pdf' | 'image',
        uri: uri,
        date: new Date().toLocaleDateString('en-GB', {
          day: 'numeric', 
          month: 'long', 
          year: 'numeric'
        })
      };
      
      setDocument(mockDoc);
      
      // Get document content
      const content = await DocumentService.getDocumentContent(mockDoc);
      setDocumentContent(content);
    } catch (error) {
      console.error('Error loading document:', error);
      Alert.alert('Error', 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleToolPress = (tool: string) => {
    // Reset result when changing tools
    setResult(null);
    setCurrentTool(tool === currentTool ? null : tool);
  };

  const handleProcessDocument = async () => {
    if (!document || !currentTool) return;
    
    setProcessing(true);
    setResult(null);
    
    try {
      let processedResult = '';
      
      switch (currentTool) {
        case 'summary':
          processedResult = await DocumentService.summarizeDocument(document, { type: summaryType });
          break;
        case 'extract':
          processedResult = await DocumentService.extractInformation(document, extractType);
          break;
        case 'translate':
          processedResult = await DocumentService.translateDocument(document, translateLanguage);
          break;
      }
      
      setResult(processedResult);
    } catch (error) {
      console.error(`Error processing document with ${currentTool}:`, error);
      Alert.alert('Error', `Failed to ${currentTool} document`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type === 'pdf' ? 'PDF Document' : 'Image Document'}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.documentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#3a86ff" size="large" />
            <Text style={styles.loadingText}>Loading document...</Text>
          </View>
        ) : result ? (
          <View style={styles.documentPreview}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {currentTool === 'summary' ? 'Summary' : 
                 currentTool === 'extract' ? 'Extracted Information' : 'Translation'}
              </Text>
              <TouchableOpacity 
                style={styles.closeResultButton}
                onPress={() => setResult(null)}
              >
                <Text style={styles.closeResultButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.resultContent}>
              <Text style={styles.resultText}>{result}</Text>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.documentPreview}>
            <ScrollView>
              <Text style={styles.previewText}>{documentContent}</Text>
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.toolsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.toolsScrollContent}
        >
          <TouchableOpacity 
            style={[styles.toolButton, currentTool === 'summary' && styles.toolButtonActive]} 
            onPress={() => handleToolPress('summary')}
          >
            <Text style={[styles.toolText, currentTool === 'summary' && styles.toolTextActive]}>
              Summarize
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolButton, currentTool === 'extract' && styles.toolButtonActive]} 
            onPress={() => handleToolPress('extract')}
          >
            <Text style={[styles.toolText, currentTool === 'extract' && styles.toolTextActive]}>
              Extract Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolButton, currentTool === 'translate' && styles.toolButtonActive]} 
            onPress={() => handleToolPress('translate')}
          >
            <Text style={[styles.toolText, currentTool === 'translate' && styles.toolTextActive]}>
              Translate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolButton, currentTool === 'chat' && styles.toolButtonActive]} 
            onPress={() => navigation.navigate('Chat', {
              documentContext: `Chatting about: ${uri} (${type})`,
            })}
          >
            <Text style={[styles.toolText, currentTool === 'chat' && styles.toolTextActive]}>
              Chat
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {currentTool && currentTool !== 'chat' && (
        <View style={styles.actionPanel}>
          {currentTool === 'summary' && (
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Summarize Document</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={[styles.optionChip, summaryType === 'brief' && styles.optionChipActive]}
                  onPress={() => setSummaryType('brief')}
                >
                  <Text style={[styles.optionText, summaryType === 'brief' && styles.optionTextActive]}>Brief</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionChip, summaryType === 'detailed' && styles.optionChipActive]}
                  onPress={() => setSummaryType('detailed')}
                >
                  <Text style={[styles.optionText, summaryType === 'detailed' && styles.optionTextActive]}>Detailed</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionChip, summaryType === 'bullet' && styles.optionChipActive]}
                  onPress={() => setSummaryType('bullet')}
                >
                  <Text style={[styles.optionText, summaryType === 'bullet' && styles.optionTextActive]}>Bullet Points</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.generateButton, processing && styles.buttonDisabled]}
                onPress={handleProcessDocument}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.generateButtonText}>Generate Summary</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {currentTool === 'extract' && (
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Extract Information</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={[styles.optionChip, extractType === 'keyPoints' && styles.optionChipActive]}
                  onPress={() => setExtractType('keyPoints')}
                >
                  <Text style={[styles.optionText, extractType === 'keyPoints' && styles.optionTextActive]}>Key Points</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionChip, extractType === 'dates' && styles.optionChipActive]}
                  onPress={() => setExtractType('dates')}
                >
                  <Text style={[styles.optionText, extractType === 'dates' && styles.optionTextActive]}>Dates</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionChip, extractType === 'custom' && styles.optionChipActive]}
                  onPress={() => setExtractType('custom')}
                >
                  <Text style={[styles.optionText, extractType === 'custom' && styles.optionTextActive]}>Custom</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.generateButton, processing && styles.buttonDisabled]}
                onPress={handleProcessDocument}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.generateButtonText}>Extract Information</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {currentTool === 'translate' && (
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Translate Document</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={[styles.optionChip, translateLanguage === 'spanish' && styles.optionChipActive]}
                  onPress={() => setTranslateLanguage('spanish')}
                >
                  <Text style={[styles.optionText, translateLanguage === 'spanish' && styles.optionTextActive]}>Spanish</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionChip, translateLanguage === 'french' && styles.optionChipActive]}
                  onPress={() => setTranslateLanguage('french')}
                >
                  <Text style={[styles.optionText, translateLanguage === 'french' && styles.optionTextActive]}>French</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.optionChip, translateLanguage === 'german' && styles.optionChipActive]}
                  onPress={() => setTranslateLanguage('german')}
                >
                  <Text style={[styles.optionText, translateLanguage === 'german' && styles.optionTextActive]}>German</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.generateButton, processing && styles.buttonDisabled]}
                onPress={handleProcessDocument}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.generateButtonText}>Translate Document</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#333',
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2a3a',
  },
  moreButton: {
    padding: 8,
  },
  moreButtonText: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
  },
  documentContainer: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#617d98',
    marginTop: 10,
    fontSize: 16,
  },
  documentPreview: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2a3a',
  },
  closeResultButton: {
    padding: 5,
  },
  closeResultButtonText: {
    fontSize: 24,
    color: '#777',
  },
  resultContent: {
    flex: 1,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  toolsContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 15,
  },
  toolsScrollContent: {
    paddingHorizontal: 15,
  },
  toolButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f0f2f5',
  },
  toolButtonActive: {
    backgroundColor: '#3a86ff',
  },
  toolText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  toolTextActive: {
    color: 'white',
  },
  actionPanel: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 15,
  },
  actionContent: {
    padding: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2a3a',
    marginBottom: 15,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    marginRight: 10,
    marginBottom: 10,
  },
  optionChipActive: {
    backgroundColor: '#3a86ff',
  },
  optionText: {
    fontSize: 14,
    color: '#555',
  },
  optionTextActive: {
    color: 'white',
  },
  generateButton: {
    backgroundColor: '#3a86ff',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 