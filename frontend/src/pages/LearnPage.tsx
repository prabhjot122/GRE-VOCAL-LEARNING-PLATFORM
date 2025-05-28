
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Brain, Clock, Trophy, Zap, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import EnhancedFlashcardLearning from "@/components/EnhancedFlashcardLearning";
import { useLibrary } from "@/contexts/LibraryContext";
import { useLearning } from "@/contexts/LearningContext";

const LearnPage = () => {
  const { libraries, selectedLibrary, preloadEssentialData } = useLibrary();
  const { learningStats, isSessionActive, currentSession } = useLearning();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Preload essential data when component mounts
  useEffect(() => {
    preloadEssentialData();
  }, [preloadEssentialData]);

  // If there's an active session, show the flashcard learning component
  if (isSessionActive && currentSession) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnhancedFlashcardLearning />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="space-y-12">
          {/* Enhanced Page Header */}
          <div className="text-center space-y-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl -z-10"></div>
            <div className="py-12 px-8">
              <h1 className="text-5xl  lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent pb-4">
                Learning Center
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
                Master your vocabulary with our scientifically-designed learning system that adapts to your pace and maximizes retention
              </p>
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-2 bg-white/50 backdrop-blur-sm rounded-full px-6 py-2 border border-gray-200/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-700">Ready to learn</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Learning Modes */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">



            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-12 animate-slide-up">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="card-enhanced p-8 group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Words Studied</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{learningStats.totalWordsStudied}</p>
                    </div>
                  </div>
                </div>

                <div className="card-enhanced p-8 group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Accuracy</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{learningStats.averageAccuracy.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="card-enhanced p-8 group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-warning to-warning/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Clock className="h-8 w-8 text-black" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Time Spent</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{Math.round(learningStats.totalTimeSpent)}m</p>
                    </div>
                  </div>
                </div>

                <div className="card-enhanced p-8 group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Streak</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{learningStats.streakDays} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Learning Section */}
              <div className="relative">
                {/* Section Header */}


                {/* Enhanced Flashcard Learning Card */}
                <div className="max-w-7xl mx-auto">
                  <div className="card-enhanced p-12 group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-2 border-indigo-100/50 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full translate-y-12 -translate-x-12 group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative z-10">
                      {/* Header Section */}
                      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8 mb-10">
                        <div className="flex-shrink-0">
                          <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl">
                            <Brain className="h-12 w-12 text-white" />
                          </div>
                        </div>
                        <div className="text-center lg:text-left flex-grow">
                          <h3 className="text-4xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-3">Flashcard Learning</h3>
                          <p className="text-xl text-gray-600 leading-relaxed">Experience the most effective way to learn vocabulary through our interactive, scientifically-designed flashcard system</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-200/50 group-hover:bg-white/90 transition-all duration-300">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">{libraries.length}</p>
                          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Available Libraries</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-200/50 group-hover:bg-white/90 transition-all duration-300">
                          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Zap className="h-6 w-6 text-accent" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">{libraries.reduce((sum, lib) => sum + lib.word_count, 0)}</p>
                          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Words</p>
                        </div>
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-gray-200/50 group-hover:bg-white/90 transition-all duration-300">
                          <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Trophy className="h-6 w-6 text-warning" />
                          </div>
                          <p className="text-2xl font-bold text-gray-900 mb-1">{learningStats.totalWordsStudied}</p>
                          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Words Mastered</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="text-center">
                        <Button
                          onClick={() => setActiveTab("flashcards")}
                          className="btn-gradient h-16 px-12 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group-hover:animate-pulse"
                        >
                          <Zap className="h-6 w-6 mr-3" />
                          Begin Flashcard Session
                        </Button>
                        <p className="text-sm text-gray-500 mt-4">Click to start your personalized learning experience</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Library Overview */}
              {selectedLibrary && (
                <div className="card-enhanced p-10 bg-gradient-to-br from-slate-50 to-gray-100/50 border-slate-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-6 mb-8">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="text-center lg:text-left flex-grow">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Current Library: {selectedLibrary.name}</h3>
                      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-3">
                        {selectedLibrary.is_master && (
                          <Badge variant="secondary" className="bg-gradient-to-r from-accent to-accent/80 text-white border-none shadow-md">
                            ✨ Master Library
                          </Badge>
                        )}
                        <span className="text-gray-600 font-medium">Your active learning collection</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-4xl font-bold text-primary mb-2">{selectedLibrary.word_count}</p>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total Words</p>
                    </div>
                    <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl border border-green-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-4xl font-bold text-accent mb-2">{selectedLibrary.learned_count}</p>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Learned</p>
                    </div>
                    <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/80 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
                        <Clock className="h-6 w-6 text-black" />
                      </div>
                      <p className="text-4xl font-bold text-warning mb-2">{selectedLibrary.unlearned_count}</p>
                      <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">To Learn</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Flashcards Tab */}
            <TabsContent value="flashcards">
              <EnhancedFlashcardLearning />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
