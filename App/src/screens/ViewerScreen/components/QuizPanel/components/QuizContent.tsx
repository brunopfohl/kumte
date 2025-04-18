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
  if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No quiz questions available</Text>
        <TouchableOpacity style={styles.closeButtonWrapper} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const totalQuestions = currentQuiz.questions.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentQuiz.title}</Text>
        <TouchableOpacity onPress={onDismissQuiz}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
        </View>

        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.learningObjective && (
          <View style={styles.learningObjectiveContainer}>
            <Text style={styles.learningObjectiveLabel}>Learning Objective:</Text>
            <Text style={styles.learningObjectiveText}>{currentQuestion.learningObjective}</Text>
          </View>
        )}

        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === index && !answerSubmitted && styles.selectedOption,
              answerSubmitted && selectedAnswer === index && isCorrect && styles.correctOption,
              answerSubmitted && selectedAnswer === index && !isCorrect && styles.incorrectOption,
              answerSubmitted && index === currentQuestion.correctAnswer && styles.correctOption,
            ]}
            onPress={() => onAnswerSelect(index)}
            disabled={answerSubmitted}
          >
            <Text
              style={[
                styles.optionText,
                selectedAnswer === index && !answerSubmitted && styles.selectedOptionText,
                answerSubmitted && (index === currentQuestion.correctAnswer || (selectedAnswer === index && isCorrect))
                  && styles.correctOptionText,
                answerSubmitted && selectedAnswer === index && !isCorrect && styles.incorrectOptionText,
              ]}
            >
              {String.fromCharCode(65 + index)}. {option}
            </Text>
          </TouchableOpacity>
        ))}

        {answerSubmitted && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          {!answerSubmitted ? (
            <TouchableOpacity
              style={[styles.actionButton, selectedAnswer === null && styles.disabledButton]}
              onPress={onSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              <Text style={[styles.actionButtonText, selectedAnswer === null && styles.disabledButtonText]}>
                Submit Answer
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={onNextQuestion}>
              <Text style={styles.actionButtonText}>
                {currentQuestionIndex < currentQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Current Score: {score}/{currentQuestionIndex + (answerSubmitted ? 1 : 0)}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  closeButtonWrapper: {
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    lineHeight: 24,
  },
  learningObjectiveContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  learningObjectiveLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  learningObjectiveText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  optionButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOption: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  selectedOptionText: {
    color: '#5b21b6',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  correctOptionText: {
    color: '#065f46',
    fontWeight: '600',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  incorrectOptionText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  explanationContainer: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  explanationText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  scoreContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
}); 