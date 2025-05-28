import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'vocabulary' | 'stories' | 'consistency' | 'social';
  requirement: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
}

export interface GamificationStats {
  totalWordsLearned: number;
  totalStudyTime: number; // in minutes
  storiesCreated: number;
  quizzesTaken: number;
  currentStreak: number;
  longestStreak: number;
  perfectQuizzes: number;
  vocabularyMastery: number; // percentage
}

interface GamificationContextType {
  // User progress
  userLevel: UserLevel;
  achievements: Achievement[];
  stats: GamificationStats;
  
  // Actions
  addXP: (amount: number, reason: string) => void;
  updateStats: (newStats: Partial<GamificationStats>) => void;
  checkAchievements: () => void;
  
  // Getters
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getProgressPercentage: () => number;
  
  // Loading state
  isLoading: boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

interface GamificationProviderProps {
  children: ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const [userLevel, setUserLevel] = useState<UserLevel>({
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    title: 'Vocabulary Novice'
  });

  const [stats, setStats] = useState<GamificationStats>({
    totalWordsLearned: 0,
    totalStudyTime: 0,
    storiesCreated: 0,
    quizzesTaken: 0,
    currentStreak: 0,
    longestStreak: 0,
    perfectQuizzes: 0,
    vocabularyMastery: 0
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize achievements
  useEffect(() => {
    initializeAchievements();
    loadUserProgress();
  }, []);

  const initializeAchievements = () => {
    const defaultAchievements: Achievement[] = [
      // Learning achievements
      {
        id: 'first_word',
        title: 'First Steps',
        description: 'Learn your first vocabulary word',
        icon: '🌱',
        category: 'learning',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common',
        xpReward: 10
      },
      {
        id: 'word_collector_10',
        title: 'Word Collector',
        description: 'Learn 10 vocabulary words',
        icon: '📚',
        category: 'learning',
        requirement: 10,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common',
        xpReward: 50
      },
      {
        id: 'vocabulary_master_100',
        title: 'Vocabulary Master',
        description: 'Learn 100 vocabulary words',
        icon: '🎓',
        category: 'learning',
        requirement: 100,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare',
        xpReward: 200
      },
      {
        id: 'word_sage_500',
        title: 'Word Sage',
        description: 'Learn 500 vocabulary words',
        icon: '🧙‍♂️',
        category: 'learning',
        requirement: 500,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'epic',
        xpReward: 500
      },
      
      // Story achievements
      {
        id: 'storyteller',
        title: 'Storyteller',
        description: 'Create your first story',
        icon: '✍️',
        category: 'stories',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common',
        xpReward: 25
      },
      {
        id: 'author',
        title: 'Aspiring Author',
        description: 'Create 5 stories',
        icon: '📖',
        category: 'stories',
        requirement: 5,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare',
        xpReward: 100
      },
      
      // Consistency achievements
      {
        id: 'daily_learner',
        title: 'Daily Learner',
        description: 'Study for 3 days in a row',
        icon: '🔥',
        category: 'consistency',
        requirement: 3,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common',
        xpReward: 30
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Study for 7 days in a row',
        icon: '⚡',
        category: 'consistency',
        requirement: 7,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare',
        xpReward: 100
      },
      {
        id: 'month_master',
        title: 'Month Master',
        description: 'Study for 30 days in a row',
        icon: '👑',
        category: 'consistency',
        requirement: 30,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'legendary',
        xpReward: 1000
      },
      
      // Quiz achievements
      {
        id: 'quiz_taker',
        title: 'Quiz Taker',
        description: 'Complete your first quiz',
        icon: '🧠',
        category: 'vocabulary',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'common',
        xpReward: 15
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Get 100% on a quiz',
        icon: '💯',
        category: 'vocabulary',
        requirement: 1,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'rare',
        xpReward: 75
      },
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Complete 50 quizzes',
        icon: '🏆',
        category: 'vocabulary',
        requirement: 50,
        currentProgress: 0,
        isUnlocked: false,
        rarity: 'epic',
        xpReward: 300
      }
    ];

    setAchievements(defaultAchievements);
  };

  const loadUserProgress = () => {
    try {
      const savedLevel = localStorage.getItem('userLevel');
      const savedStats = localStorage.getItem('gamificationStats');
      const savedAchievements = localStorage.getItem('achievements');

      if (savedLevel) {
        setUserLevel(JSON.parse(savedLevel));
      }

      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      if (savedAchievements) {
        const parsed = JSON.parse(savedAchievements);
        setAchievements(prev => prev.map(achievement => {
          const saved = parsed.find((a: Achievement) => a.id === achievement.id);
          return saved ? { ...achievement, ...saved } : achievement;
        }));
      }
    } catch (error) {
      console.error('Failed to load user progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserProgress = () => {
    localStorage.setItem('userLevel', JSON.stringify(userLevel));
    localStorage.setItem('gamificationStats', JSON.stringify(stats));
    localStorage.setItem('achievements', JSON.stringify(achievements));
  };

  const calculateXPForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  };

  const getLevelTitle = (level: number): string => {
    if (level < 5) return 'Vocabulary Novice';
    if (level < 10) return 'Word Explorer';
    if (level < 20) return 'Language Learner';
    if (level < 35) return 'Vocabulary Scholar';
    if (level < 50) return 'Word Master';
    if (level < 75) return 'Language Expert';
    if (level < 100) return 'Vocabulary Sage';
    return 'Legendary Wordsmith';
  };

  const addXP = (amount: number, reason: string) => {
    setUserLevel(prev => {
      const newTotalXP = prev.totalXP + amount;
      const newCurrentXP = prev.currentXP + amount;
      
      let newLevel = prev.level;
      let remainingXP = newCurrentXP;
      let xpToNext = prev.xpToNextLevel;

      // Check for level ups
      while (remainingXP >= xpToNext) {
        remainingXP -= xpToNext;
        newLevel++;
        xpToNext = calculateXPForLevel(newLevel);
        
        // Show level up notification
        toast.success(`🎉 Level Up! You are now level ${newLevel}!`, {
          duration: 5000,
        });
      }

      const newUserLevel = {
        level: newLevel,
        currentXP: remainingXP,
        xpToNextLevel: xpToNext - remainingXP,
        totalXP: newTotalXP,
        title: getLevelTitle(newLevel)
      };

      return newUserLevel;
    });

    toast.success(`+${amount} XP - ${reason}`, {
      duration: 3000,
    });
  };

  const updateStats = (newStats: Partial<GamificationStats>) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  const checkAchievements = () => {
    setAchievements(prev => {
      const updated = prev.map(achievement => {
        if (achievement.isUnlocked) return achievement;

        let progress = 0;
        
        switch (achievement.id) {
          case 'first_word':
          case 'word_collector_10':
          case 'vocabulary_master_100':
          case 'word_sage_500':
            progress = stats.totalWordsLearned;
            break;
          case 'storyteller':
          case 'author':
            progress = stats.storiesCreated;
            break;
          case 'daily_learner':
          case 'week_warrior':
          case 'month_master':
            progress = stats.currentStreak;
            break;
          case 'quiz_taker':
          case 'quiz_master':
            progress = stats.quizzesTaken;
            break;
          case 'perfect_score':
            progress = stats.perfectQuizzes;
            break;
          default:
            progress = achievement.currentProgress;
        }

        const updatedAchievement = {
          ...achievement,
          currentProgress: progress
        };

        // Check if achievement should be unlocked
        if (progress >= achievement.requirement && !achievement.isUnlocked) {
          updatedAchievement.isUnlocked = true;
          updatedAchievement.unlockedAt = new Date();
          
          // Award XP
          addXP(achievement.xpReward, `Achievement: ${achievement.title}`);
          
          // Show achievement notification
          toast.success(`🏆 Achievement Unlocked: ${achievement.title}!`, {
            description: achievement.description,
            duration: 5000,
          });
        }

        return updatedAchievement;
      });

      return updated;
    });
  };

  const getUnlockedAchievements = (): Achievement[] => {
    return achievements.filter(a => a.isUnlocked);
  };

  const getLockedAchievements = (): Achievement[] => {
    return achievements.filter(a => !a.isUnlocked);
  };

  const getProgressPercentage = (): number => {
    return (userLevel.currentXP / (userLevel.currentXP + userLevel.xpToNextLevel)) * 100;
  };

  // Save progress whenever state changes
  useEffect(() => {
    if (!isLoading) {
      saveUserProgress();
    }
  }, [userLevel, stats, achievements, isLoading]);

  // Check achievements whenever stats change
  useEffect(() => {
    if (!isLoading) {
      checkAchievements();
    }
  }, [stats, isLoading]);

  const value: GamificationContextType = {
    userLevel,
    achievements,
    stats,
    addXP,
    updateStats,
    checkAchievements,
    getUnlockedAchievements,
    getLockedAchievements,
    getProgressPercentage,
    isLoading
  };

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
};
