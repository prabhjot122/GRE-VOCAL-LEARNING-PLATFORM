import React, { createContext, useContext, useEffect, ReactNode } from 'react';

// Simplified theme context that forces light theme
interface ThemeContextType {
  theme: 'light';
  actualTheme: 'light';
  setTheme: (theme: 'light') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Force light theme on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#ffffff');
    }

    // Clear any stored theme preference to force light
    localStorage.setItem('theme', 'light');
  }, []);

  const setTheme = (newTheme: 'light') => {
    // Only accept light theme
    localStorage.setItem('theme', 'light');
  };

  const toggleTheme = () => {
    // No-op since we only support light theme
  };

  const value: ThemeContextType = {
    theme: 'light',
    actualTheme: 'light',
    setTheme,
    toggleTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
