import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BookOpen, User, LogOut, Settings, GraduationCap, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => {
    return `relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
      isActive(path)
        ? 'text-primary bg-primary/10 shadow-sm'
        : 'text-gray-600 hover:text-primary hover:bg-primary/5'
    }`;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium group-hover:shadow-large transition-all duration-300">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gradient">VocabMaster</span>
                <span className="text-xs text-gray-500 -mt-1">Learn • Grow • Excel</span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-2 bg-gray-50/50 rounded-xl p-2">
            <Link to="/" className={navLinkClass('/')}>
              Dashboard
            </Link>
            <Link to="/library" className={navLinkClass('/library')}>
              Library
            </Link>
            <Link to="/stories" className={navLinkClass('/stories')}>
              Stories
            </Link>
            <Link to="/learn" className={navLinkClass('/learn')}>
              Learn
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 h-10 w-10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative p-0 h-10 w-10 rounded-full hover:shadow-medium transition-all duration-200">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-soft">
                    <span className="text-white text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 card-enhanced" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-none">{user?.username}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-3 hover:bg-primary/5 transition-colors">
                  <User className="mr-3 h-4 w-4 text-primary" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 hover:bg-primary/5 transition-colors">
                  <Settings className="mr-3 h-4 w-4 text-primary" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="p-3 hover:bg-destructive/5 text-destructive transition-colors">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/"
              className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive('/')
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/library"
              className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive('/library')
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Library
            </Link>
            <Link
              to="/stories"
              className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive('/stories')
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Stories
            </Link>
            <Link
              to="/learn"
              className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive('/learn')
                  ? 'text-primary bg-primary/10 shadow-sm'
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Learn
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
