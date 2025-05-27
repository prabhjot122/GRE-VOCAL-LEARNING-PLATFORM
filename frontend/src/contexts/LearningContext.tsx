import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLibrary } from './LibraryContext';
import { Word } from '@/services/api';
import { toast } from 'sonner';

export interface StudySession {
  id: string;
  libraryId: number;
  mode: 'flashcards' | 'quiz' | 'review';
  words: Word[];
  currentIndex: number;
  correctAnswers: number;
  totalAnswered: number;
  startTime: Date;
  endTime?: Date;
  isCompleted: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'true-false' | 'matching';
  word: Word;
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface LearningStats {
  totalWordsStudied: number;
  totalTimeSpent: number; // in minutes
  averageAccuracy: number;
  streakDays: number;
  lastStudyDate?: Date;
  weeklyProgress: number[];
}

interface LearningContextType {
  // Current session
  currentSession: StudySession | null;
  isSessionActive: boolean;

  // Session management
  startFlashcardSession: (libraryId: number, mode: 'revision' | 'new' | 'mixed') => Promise<boolean>;
  startQuizSession: (libraryId: number, questionCount: number) => Promise<boolean>;
  endSession: () => void;

  // Flashcard operations
  markWordKnown: (wordId: number) => Promise<boolean>;
  markWordUnknown: (wordId: number) => Promise<boolean>;
  nextCard: () => void;
  previousCard: () => void;

  // Quiz operations
  currentQuiz: QuizQuestion[] | null;
  currentQuestionIndex: number;
  submitAnswer: (answer: string) => void;
  nextQuestion: () => void;

  // Learning analytics
  learningStats: LearningStats;
  updateStats: () => Promise<void>;

  // Spaced repetition
  getWordsForReview: (libraryId: number) => Promise<Word[]>;
  scheduleWordReview: (wordId: number, difficulty: 'easy' | 'medium' | 'hard') => Promise<void>;

  // Audio features
  playPronunciation: (word: string) => void;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

interface LearningProviderProps {
  children: ReactNode;
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const { libraries, selectedLibrary, markWordLearned, markWordUnlearned } = useLibrary();

  // State
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [learningStats, setLearningStats] = useState<LearningStats>({
    totalWordsStudied: 0,
    totalTimeSpent: 0,
    averageAccuracy: 0,
    streakDays: 0,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0]
  });
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Computed properties
  const isSessionActive = currentSession !== null && !currentSession.isCompleted;

  // Load learning stats on mount
  useEffect(() => {
    loadLearningStats();
  }, []);

  const loadLearningStats = () => {
    const savedStats = localStorage.getItem('learningStats');
    if (savedStats) {
      setLearningStats(JSON.parse(savedStats));
    }
  };

  const saveLearningStats = (stats: LearningStats) => {
    localStorage.setItem('learningStats', JSON.stringify(stats));
    setLearningStats(stats);
  };

  const startFlashcardSession = async (libraryId: number, mode: 'revision' | 'new' | 'mixed'): Promise<boolean> => {
    try {
      // Import the API to fetch library words
      const { libraryApi } = await import('@/services/api');

      // Fetch library with words
      const response = await libraryApi.getLibrary(libraryId, { per_page: 500 }); // Get up to 500 words for learning
      if (!response.success || !response.data.library.words) {
        toast.error('Library not found or has no words');
        return false;
      }

      const libraryWords = response.data.library.words;
      let wordsToStudy: Word[] = [];

      switch (mode) {
        case 'revision':
          wordsToStudy = libraryWords.filter(word => word.is_learned);
          break;
        case 'new':
          wordsToStudy = libraryWords.filter(word => !word.is_learned);
          break;
        case 'mixed':
          wordsToStudy = [...libraryWords];
          break;
      }

      if (wordsToStudy.length === 0) {
        toast.error(`No ${mode} words available in this library`);
        return false;
      }

      // Shuffle words for variety
      wordsToStudy = wordsToStudy.sort(() => Math.random() - 0.5);

      const session: StudySession = {
        id: `session_${Date.now()}`,
        libraryId,
        mode: 'flashcards',
        words: wordsToStudy,
        currentIndex: 0,
        correctAnswers: 0,
        totalAnswered: 0,
        startTime: new Date(),
        isCompleted: false
      };

      setCurrentSession(session);
      toast.success(`Started ${mode} session with ${wordsToStudy.length} words`);
      return true;
    } catch (error) {
      console.error('Failed to start flashcard session:', error);
      toast.error('Failed to start flashcard session');
      return false;
    }
  };

  const startQuizSession = async (libraryId: number, questionCount: number): Promise<boolean> => {
    try {
      // Import the API to fetch library words
      const { libraryApi } = await import('@/services/api');

      // Fetch library with words
      const response = await libraryApi.getLibrary(libraryId, { per_page: questionCount });
      if (!response.success || !response.data.library.words) {
        toast.error('Library not found or has no words');
        return false;
      }

      const availableWords = response.data.library.words.slice(0, questionCount);
      if (availableWords.length < questionCount) {
        toast.warning(`Only ${availableWords.length} words available for quiz`);
      }

      const quiz = generateQuizQuestions(availableWords);
      setCurrentQuiz(quiz);
      setCurrentQuestionIndex(0);

      const session: StudySession = {
        id: `quiz_${Date.now()}`,
        libraryId,
        mode: 'quiz',
        words: availableWords,
        currentIndex: 0,
        correctAnswers: 0,
        totalAnswered: 0,
        startTime: new Date(),
        isCompleted: false
      };

      setCurrentSession(session);
      toast.success(`Started quiz with ${quiz.length} questions`);
      return true;
    } catch (error) {
      console.error('Failed to start quiz session:', error);
      toast.error('Failed to start quiz session');
      return false;
    }
  };

  const generateQuizQuestions = (words: Word[]): QuizQuestion[] => {
    return words.map((word, index) => {
      const questionTypes: QuizQuestion['type'][] = ['multiple-choice', 'fill-blank', 'true-false'];
      const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      switch (randomType) {
        case 'multiple-choice':
          return generateMultipleChoiceQuestion(word, words);
        case 'fill-blank':
          return generateFillBlankQuestion(word);
        case 'true-false':
          return generateTrueFalseQuestion(word, words);
        default:
          return generateMultipleChoiceQuestion(word, words);
      }
    });
  };

  const generateMultipleChoiceQuestion = (word: Word, allWords: Word[]): QuizQuestion => {
    const otherWords = allWords.filter(w => w.id !== word.id);
    const wrongOptions = otherWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.meaning);

    const options = [word.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);

    return {
      id: `q_${word.id}_mc`,
      type: 'multiple-choice',
      word,
      question: `What is the meaning of "${word.word}"?`,
      options,
      correctAnswer: word.meaning
    };
  };

  const generateFillBlankQuestion = (word: Word): QuizQuestion => {
    const example = word.example || `The word "${word.word}" means _____.`;
    const question = example.replace(new RegExp(word.word, 'gi'), '_____');

    return {
      id: `q_${word.id}_fb`,
      type: 'fill-blank',
      word,
      question,
      correctAnswer: word.word
    };
  };

  const generateTrueFalseQuestion = (word: Word, allWords: Word[]): QuizQuestion => {
    const isTrue = Math.random() > 0.5;
    let meaning = word.meaning;

    if (!isTrue) {
      const otherWords = allWords.filter(w => w.id !== word.id);
      if (otherWords.length > 0) {
        meaning = otherWords[Math.floor(Math.random() * otherWords.length)].meaning;
      }
    }

    return {
      id: `q_${word.id}_tf`,
      type: 'true-false',
      word,
      question: `True or False: "${word.word}" means "${meaning}"`,
      options: ['True', 'False'],
      correctAnswer: isTrue ? 'True' : 'False'
    };
  };

  const markWordKnown = async (wordId: number): Promise<boolean> => {
    if (!currentSession) return false;

    const success = await markWordLearned(wordId);
    if (success && currentSession) {
      setCurrentSession({
        ...currentSession,
        correctAnswers: currentSession.correctAnswers + 1,
        totalAnswered: currentSession.totalAnswered + 1
      });
    }
    return success;
  };

  const markWordUnknown = async (wordId: number): Promise<boolean> => {
    if (!currentSession) return false;

    const success = await markWordUnlearned(wordId);
    if (success && currentSession) {
      setCurrentSession({
        ...currentSession,
        totalAnswered: currentSession.totalAnswered + 1
      });
    }
    return success;
  };

  const nextCard = () => {
    if (!currentSession) return;

    if (currentSession.currentIndex < currentSession.words.length - 1) {
      setCurrentSession({
        ...currentSession,
        currentIndex: currentSession.currentIndex + 1
      });
    } else {
      endSession();
    }
  };

  const previousCard = () => {
    if (!currentSession) return;

    if (currentSession.currentIndex > 0) {
      setCurrentSession({
        ...currentSession,
        currentIndex: currentSession.currentIndex - 1
      });
    }
  };

  const submitAnswer = (answer: string) => {
    if (!currentQuiz || !currentSession) return;

    const currentQuestion = currentQuiz[currentQuestionIndex];
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();

    // Update question with user answer
    const updatedQuiz = [...currentQuiz];
    updatedQuiz[currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect
    };
    setCurrentQuiz(updatedQuiz);

    // Update session stats
    setCurrentSession({
      ...currentSession,
      correctAnswers: currentSession.correctAnswers + (isCorrect ? 1 : 0),
      totalAnswered: currentSession.totalAnswered + 1
    });

    toast.success(isCorrect ? 'Correct!' : 'Incorrect');
  };

  const nextQuestion = () => {
    if (!currentQuiz) return;

    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      endSession();
    }
  };

  const endSession = () => {
    if (!currentSession) return;

    const completedSession = {
      ...currentSession,
      endTime: new Date(),
      isCompleted: true
    };

    setCurrentSession(completedSession);

    // Update learning stats
    const sessionDuration = (completedSession.endTime!.getTime() - completedSession.startTime.getTime()) / (1000 * 60);
    const accuracy = completedSession.totalAnswered > 0 ? (completedSession.correctAnswers / completedSession.totalAnswered) * 100 : 0;

    const updatedStats: LearningStats = {
      ...learningStats,
      totalWordsStudied: learningStats.totalWordsStudied + completedSession.totalAnswered,
      totalTimeSpent: learningStats.totalTimeSpent + sessionDuration,
      averageAccuracy: ((learningStats.averageAccuracy + accuracy) / 2),
      lastStudyDate: new Date()
    };

    saveLearningStats(updatedStats);

    toast.success(`Session completed! Accuracy: ${accuracy.toFixed(1)}%`);

    // Clear session after a delay
    setTimeout(() => {
      setCurrentSession(null);
      setCurrentQuiz(null);
      setCurrentQuestionIndex(0);
    }, 3000);
  };

  const updateStats = async (): Promise<void> => {
    // This would typically fetch from an API
    loadLearningStats();
  };

  const getWordsForReview = async (libraryId: number): Promise<Word[]> => {
    const library = libraries.find(lib => lib.id === libraryId);
    if (!library || !library.words) return [];

    // Simple spaced repetition: return learned words for review
    return library.words.filter(word => word.is_learned);
  };

  const scheduleWordReview = async (wordId: number, difficulty: 'easy' | 'medium' | 'hard'): Promise<void> => {
    // This would typically update the backend with review scheduling
    toast.success(`Word scheduled for review (${difficulty} difficulty)`);
  };

  const playPronunciation = (word: string) => {
    if (!isAudioEnabled) return;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } else {
      toast.info('Text-to-speech not supported in this browser');
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    toast.success(`Audio ${!isAudioEnabled ? 'enabled' : 'disabled'}`);
  };

  const value: LearningContextType = {
    currentSession,
    isSessionActive,
    startFlashcardSession,
    startQuizSession,
    endSession,
    markWordKnown,
    markWordUnknown,
    nextCard,
    previousCard,
    currentQuiz,
    currentQuestionIndex,
    submitAnswer,
    nextQuestion,
    learningStats,
    updateStats,
    getWordsForReview,
    scheduleWordReview,
    playPronunciation,
    isAudioEnabled,
    toggleAudio
  };

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
};
