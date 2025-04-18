import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { QuizContentProps } from '../types';

export const QuizContent: React.FC<QuizContentProps> = ({
  currentQuiz,
  currentQuestionIndex,
  selectedAnswer,
  answerSubmitted,
  score,
  onClose,
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  onDismissQuiz
}) => {
  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === currentQuiz.questions.length - 1;

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz</Text>
        <View style={styles.quizProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1}/{currentQuiz.questions.length}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={`option-${index}`}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.optionSelected,
                answerSubmitted && index === currentQuestion.correctAnswer && styles.optionCorrect,
                answerSubmitted && selectedAnswer === index &&
                selectedAnswer !== currentQuestion.correctAnswer && styles.optionIncorrect
              ]}
              onPress={() => onAnswerSelect(index)}
              disabled={answerSubmitted}
            >
              <View style={styles.optionLabelContainer}>
                <Text style={styles.optionLabel}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {answerSubmitted && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explanation:</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}

        <View style={styles.actionButtonsContainer}>
          {!answerSubmitted ? (
            <>
              <TouchableOpacity
                style={[styles.submitButton, selectedAnswer === null && styles.submitButtonDisabled]}
                onPress={onSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                <Text style={styles.submitButtonText}>Submit Answer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismissQuiz}
              >
                <Text style={styles.dismissButtonText}>Dismiss Quiz</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.nextButton, isLastQuestion && styles.finishButton]}
                onPress={onNextQuestion}
              >
                <Text style={styles.nextButtonText}>
                  {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismissQuiz}
              >
                <Text style={styles.dismissButtonText}>Dismiss Quiz</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
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
  quizProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC4899',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  questionContainer: {
    backgroundColor: '#fdf2f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#EC4899',
    backgroundColor: '#fdf2f8',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionLabelContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  explanationContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#EC4899',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#f9a8d4',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  finishButton: {
    backgroundColor: '#10B981',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dismissButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
}); 