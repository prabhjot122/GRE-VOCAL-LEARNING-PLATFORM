import React from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useLearning } from '@/contexts/LearningContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { User, Calendar, BookOpen, Trophy, Target, Clock, TrendingUp } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const { learningStats } = useLearning();
  const { libraries } = useLibrary();

  // Calculate user statistics
  const totalWords = libraries.reduce((total, library) => total + (library.words?.length || 0), 0);
  const learnedWords = libraries.reduce((total, library) => 
    total + (library.words?.filter(word => word.is_learned).length || 0), 0
  );
  const learningProgress = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;

  // Format join date
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Unknown';

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center shadow-large">
                <span className="text-white text-3xl font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user?.username}</h1>
              <p className="text-gray-600 mt-1">{user?.email}</p>
            </div>
          </div>

          {/* Profile Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Account Information */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Username</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="font-medium text-sm">{user?.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </span>
                  <span className="font-medium text-sm">{joinDate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Learning Statistics */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Words</span>
                  <Badge variant="secondary">{totalWords}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Words Learned</span>
                  <Badge variant="default">{learnedWords}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary transition-all duration-300"
                        style={{ width: `${learningProgress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{learningProgress}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Library Statistics */}
            <Card className="card-enhanced">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Library Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Libraries</span>
                  <Badge variant="outline">{libraries.length}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <span className="text-sm text-gray-600">Recent Libraries</span>
                  <div className="space-y-1">
                    {libraries.slice(0, 3).map((library) => (
                      <div key={library.id} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[120px]">{library.name}</span>
                        <span className="text-gray-500">{library.words?.length || 0} words</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Statistics Details */}
          {learningStats && (
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Detailed Learning Statistics
                </CardTitle>
                <CardDescription>
                  Your learning journey and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{learningStats.totalWordsStudied || 0}</p>
                      <p className="text-sm text-gray-600">Words Studied</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Trophy className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{learningStats.totalCorrectAnswers || 0}</p>
                      <p className="text-sm text-gray-600">Correct Answers</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{learningStats.totalSessionsCompleted || 0}</p>
                      <p className="text-sm text-gray-600">Sessions Completed</p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {learningStats.averageAccuracy ? `${learningStats.averageAccuracy.toFixed(1)}%` : '0%'}
                      </p>
                      <p className="text-sm text-gray-600">Average Accuracy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button variant="outline" size="lg">
              Export Learning Data
            </Button>
            <Button variant="outline" size="lg">
              Reset Statistics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
