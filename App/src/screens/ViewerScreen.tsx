import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { ViewerScreenProps } from '../types';

const { width, height } = Dimensions.get('window');

export const ViewerScreen: React.FC<ViewerScreenProps> = ({ navigation, route }) => {
  const { uri, type } = route.params;
  const [currentTool, setCurrentTool] = useState<string | null>(null);

  // Mock document content
  const documentContent = type === 'pdf' 
    ? `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.\n\nCras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie.\n\nFusce neque. Etiam posuere lacus quis dolor. Praesent lectus.`
    : 'Image Document';

  const handleToolPress = (tool: string) => {
    setCurrentTool(tool === currentTool ? null : tool);
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
        <View style={styles.documentPreview}>
          <Text style={styles.previewText}>{documentContent}</Text>
        </View>
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

      {currentTool && (
        <View style={styles.actionPanel}>
          {currentTool === 'summary' && (
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Summarize Document</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.optionChip}>
                  <Text style={styles.optionText}>Brief</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, styles.optionChipActive]}>
                  <Text style={[styles.optionText, styles.optionTextActive]}>Detailed</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionChip}>
                  <Text style={styles.optionText}>Bullet Points</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.generateButton}>
                <Text style={styles.generateButtonText}>Generate Summary</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentTool === 'extract' && (
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Extract Information</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.optionChip}>
                  <Text style={styles.optionText}>Key Points</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionChip}>
                  <Text style={styles.optionText}>Dates</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, styles.optionChipActive]}>
                  <Text style={[styles.optionText, styles.optionTextActive]}>Custom</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.generateButton}>
                <Text style={styles.generateButtonText}>Extract Information</Text>
              </TouchableOpacity>
            </View>
          )}

          {currentTool === 'translate' && (
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Translate Document</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity style={styles.optionChip}>
                  <Text style={styles.optionText}>Spanish</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.optionChip, styles.optionChipActive]}>
                  <Text style={[styles.optionText, styles.optionTextActive]}>French</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionChip}>
                  <Text style={styles.optionText}>German</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.generateButton}>
                <Text style={styles.generateButtonText}>Translate Document</Text>
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
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
}); 