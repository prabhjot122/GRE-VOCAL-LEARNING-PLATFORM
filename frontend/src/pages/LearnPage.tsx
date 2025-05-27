
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Target, Clock, Trophy, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import EnhancedFlashcardLearning from "@/components/EnhancedFlashcardLearning";
import QuizSystem from "@/components/QuizSystem";
import { useLibrary } from "@/contexts/LibraryContext";
import { useLearning } from "@/contexts/LearningContext";

const LearnPage = () => {
  const { libraries, selectedLibrary } = useLibrary();
  const { learningStats, isSessionActive, currentSession } = useLearning();
  const [activeTab, setActiveTab] = useState("dashboard");

  // If there's an active session, show the appropriate learning component
  if (isSessionActive && currentSession) {
    const sessionTab = currentSession.mode === 'flashcards' ? 'flashcards' : 'quiz';

    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {sessionTab === 'flashcards' ? (
            <EnhancedFlashcardLearning />
          ) : (
            <QuizSystem />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gradient">Learning Center</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Master your vocabulary with interactive learning tools designed to accelerate your progress</p>
          </div>

          {/* Learning Modes */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 bg-white/50 backdrop-blur-sm">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-white">Dashboard</TabsTrigger>
              <TabsTrigger value="flashcards" className="data-[state=active]:bg-primary data-[state=active]:text-white">Flashcards</TabsTrigger>
              <TabsTrigger value="quiz" className="data-[state=active]:bg-primary data-[state=active]:text-white">Quiz</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-8 animate-slide-up">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Words Studied</p>
                      <p className="text-2xl font-bold text-gray-900">{learningStats.totalWordsStudied}</p>
                    </div>
                  </div>
                </div>

                <div className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Target className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Accuracy</p>
                      <p className="text-2xl font-bold text-gray-900">{learningStats.averageAccuracy.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Time Spent</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(learningStats.totalTimeSpent)}m</p>
                    </div>
                  </div>
                </div>

                <div className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:shadow-medium transition-all">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Streak</p>
                      <p className="text-2xl font-bold text-gray-900">{learningStats.streakDays} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Flashcards */}
                <div className="card-enhanced p-8 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">Flashcard Learning</h3>
                      <p className="text-gray-600">Interactive card-based learning experience</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Available Libraries:</span>
                      <span className="text-sm font-bold text-gray-900">{libraries.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Total Words:</span>
                      <span className="text-sm font-bold text-gray-900">{libraries.reduce((sum, lib) => sum + lib.word_count, 0)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setActiveTab("flashcards")}
                    className="w-full btn-gradient h-12 text-lg font-semibold"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Start Flashcards
                  </Button>
                </div>

                {/* Quiz System */}
                <div className="card-enhanced p-8 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Target className="h-8 w-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-accent transition-colors">Vocabulary Quiz</h3>
                      <p className="text-gray-600">Test your knowledge and track progress</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Question Types:</span>
                      <span className="text-sm font-bold text-gray-900">3 Types</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">Best Accuracy:</span>
                      <span className="text-sm font-bold text-accent">{learningStats.averageAccuracy.toFixed(1)}%</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setActiveTab("quiz")}
                    className="w-full h-12 text-lg font-semibold hover:bg-accent hover:text-white transition-all duration-200"
                    variant="outline"
                  >
                    <Brain className="h-5 w-5 mr-2" />
                    Take Quiz
                  </Button>
                </div>
              </div>

              {/* Library Overview */}
              {selectedLibrary && (
                <div className="card-enhanced p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Current Library: {selectedLibrary.name}</h3>
                      <div className="flex items-center space-x-2">
                        {selectedLibrary.is_master && <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">Master</Badge>}
                        <span className="text-sm text-gray-600">Your active learning collection</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-primary/5 rounded-xl">
                      <p className="text-4xl font-bold text-primary mb-2">{selectedLibrary.word_count}</p>
                      <p className="text-sm font-semibold text-gray-600">Total Words</p>
                    </div>
                    <div className="text-center p-6 bg-accent/5 rounded-xl">
                      <p className="text-4xl font-bold text-accent mb-2">{selectedLibrary.learned_count}</p>
                      <p className="text-sm font-semibold text-gray-600">Learned</p>
                    </div>
                    <div className="text-center p-6 bg-warning/5 rounded-xl">
                      <p className="text-4xl font-bold text-warning mb-2">{selectedLibrary.unlearned_count}</p>
                      <p className="text-sm font-semibold text-gray-600">To Learn</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Flashcards Tab */}
            <TabsContent value="flashcards">
              <EnhancedFlashcardLearning />
            </TabsContent>

            {/* Quiz Tab */}
            <TabsContent value="quiz">
              <QuizSystem />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
