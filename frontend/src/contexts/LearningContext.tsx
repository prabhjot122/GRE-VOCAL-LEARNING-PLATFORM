import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLibrary } from './LibraryContext';
import { Word } from '@/services/api';
import { toast } from 'sonner';

export interface StudySession {
  id: string;
  libraryId: number;
  mode: 'flashcards' | 'review';
  words: Word[];
  currentIndex: number;
  correctAnswers: number;
  totalAnswered: number;
  startTime: Date;
  endTime?: Date;
  isCompleted: boolean;
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
  endSession: () => void;

  // Flashcard operations
  markWordKnown: (wordId: number) => Promise<boolean>;
  markWordUnknown: (wordId: number) => Promise<boolean>;
  nextCard: () => void;
  previousCard: () => void;

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

  const startFlashcardSession = async (libraryId: number, mode: 'revision' | 'new' | 'mixed', startWithWordId?: number): Promise<boolean> => {
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

      // Shuffle words for variety using Fisher-Yates algorithm
      for (let i = wordsToStudy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wordsToStudy[i], wordsToStudy[j]] = [wordsToStudy[j], wordsToStudy[i]];
      }

      // If a specific word is requested, move it to the front
      let startIndex = 0;
      if (startWithWordId) {
        const wordIndex = wordsToStudy.findIndex(word => word.id === startWithWordId);
        if (wordIndex > 0) {
          // Move the word to the front
          const targetWord = wordsToStudy[wordIndex];
          wordsToStudy.splice(wordIndex, 1);
          wordsToStudy.unshift(targetWord);
        }
      }

      const session: StudySession = {
        id: `session_${Date.now()}`,
        libraryId,
        mode: 'flashcards',
        words: wordsToStudy,
        currentIndex: startIndex,
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
    endSession,
    markWordKnown,
    markWordUnknown,
    nextCard,
    previousCard,
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
