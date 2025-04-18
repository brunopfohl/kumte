import { useState } from 'react';
import { Quiz } from '../types';

export const useQuizState = () => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizGenerated, setQuizGenerated] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const resetQuiz = () => {
    setQuizGenerated(false);
    setCurrentQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setScore(0);
  };

  return {
    currentQuiz,
    quizGenerated,
    currentQuestionIndex,
    selectedAnswer,
    answerSubmitted,
    score,
    resetQuiz,
    setQuizGenerated,
    setCurrentQuiz,
    setCurrentQuestionIndex,
    setSelectedAnswer,
    setAnswerSubmitted,
    setScore,
  };
}; 