import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import Slider from '@react-native-community/slider';
import { GenerateIcon } from './GenerateIcon';
import { GenerationFormProps } from '../types';

export const GenerationForm: React.FC<GenerationFormProps> = ({
  selectedText,
  numberOfQuestions,
  setNumberOfQuestions,
  additionalPrompt,
  setAdditionalPrompt,
  generating,
  includeMultipleChoice,
  setIncludeMultipleChoice,
  includeTrueFalse,
  setIncludeTrueFalse,
  difficultyLevel,
  setDifficultyLevel,
  onGenerateQuiz,
  onClose,
  keyboardHeight,
  keyboardVisible
}) => {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Quiz</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.selectedTextContainer}>
            <Text style={styles.sectionLabel}>SELECTED TEXT:</Text>
            <Text style={styles.selectedTextContent} numberOfLines={3} ellipsizeMode="tail">
              {selectedText || 'No text selected. Quiz will be generated from the entire document.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NUMBER OF QUESTIONS</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={50}
                step={1}
                value={numberOfQuestions}
                onValueChange={setNumberOfQuestions}
                minimumTrackTintColor="#EC4899"
                maximumTrackTintColor="#e5e7eb"
                thumbTintColor="#EC4899"
              />
              <Text style={styles.sliderValue}>{numberOfQuestions}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DIFFICULTY LEVEL</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={3}
                step={1}
                value={difficultyLevel}
                onValueChange={setDifficultyLevel}
                minimumTrackTintColor="#EC4899"
                maximumTrackTintColor="#e5e7eb"
                thumbTintColor="#EC4899"
              />
              <View style={styles.difficultyLabels}>
                <Text style={[styles.difficultyLabel, difficultyLevel === 1 && styles.activeDifficultyLabel]}>Easy</Text>
                <Text style={[styles.difficultyLabel, difficultyLevel === 2 && styles.activeDifficultyLabel]}>Medium</Text>
                <Text style={[styles.difficultyLabel, difficultyLevel === 3 && styles.activeDifficultyLabel]}>Hard</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>QUESTION TYPES</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Multiple Choice</Text>
              <Switch
                value={includeMultipleChoice}
                onValueChange={setIncludeMultipleChoice}
                trackColor={{ false: '#e5e7eb', true: '#F9A8D4' }}
                thumbColor={includeMultipleChoice ? '#EC4899' : '#f4f3f4'}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>True/False</Text>
              <Switch
                value={includeTrueFalse}
                onValueChange={setIncludeTrueFalse}
                trackColor={{ false: '#e5e7eb', true: '#F9A8D4' }}
                thumbColor={includeTrueFalse ? '#EC4899' : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADDITIONAL INSTRUCTIONS (OPTIONAL)</Text>
            <TextInput
              style={styles.additionalPromptInput}
              placeholder="Focus on specific topics, themes, or concepts..."
              placeholderTextColor="#9ca3af"
              value={additionalPrompt}
              onChangeText={setAdditionalPrompt}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={onGenerateQuiz}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <GenerateIcon color="#ffffff" />
                <Text style={styles.generateButtonText}>Generate Quiz</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButtonContainer: {
    padding: 8,
    marginRight: -8,
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '400',
    marginTop: -4,
  },
  selectedTextContainer: {
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  selectedTextContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
  },
  difficultyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeDifficultyLabel: {
    color: '#EC4899',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
  },
  additionalPromptInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#EC4899',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  generateButtonDisabled: {
    backgroundColor: '#f9a8d4',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 