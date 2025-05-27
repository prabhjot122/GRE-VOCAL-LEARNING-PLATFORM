import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    // Navigation will be handled by the redirect above
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-20">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-large transition-all duration-300">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gradient">VocabMaster</span>
                <span className="text-xs text-gray-500 -mt-1">Learn • Grow • Excel</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {isLogin ? (
            <LoginForm
              onSwitchToRegister={() => setIsLogin(false)}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setIsLogin(true)}
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-6">
              © 2024 VocabMaster. Built for GRE vocabulary learning excellence.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2 p-3 bg-primary/5 rounded-xl">
                <span className="text-lg">✨</span>
                <span className="text-xs font-semibold text-gray-700">Interactive Flashcards</span>
              </div>
              <div className="flex items-center justify-center space-x-2 p-3 bg-accent/5 rounded-xl">
                <span className="text-lg">📚</span>
                <span className="text-xs font-semibold text-gray-700">Library Management</span>
              </div>
              <div className="flex items-center justify-center space-x-2 p-3 bg-warning/5 rounded-xl">
                <span className="text-lg">📖</span>
                <span className="text-xs font-semibold text-gray-700">Story Builder</span>
              </div>
              <div className="flex items-center justify-center space-x-2 p-3 bg-primary/5 rounded-xl">
                <span className="text-lg">🎯</span>
                <span className="text-xs font-semibold text-gray-700">Quiz System</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
