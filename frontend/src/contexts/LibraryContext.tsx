import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { libraryApi, wordApi, Library, Word, ApiResponse } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface LibraryContextType {
  libraries: Library[];
  selectedLibrary: Library | null;
  isLoading: boolean;
  error: string | null;

  // Library operations
  fetchLibraries: () => Promise<void>;
  createLibrary: (name: string, description?: string) => Promise<boolean>;
  updateLibrary: (libraryId: number, name: string, description?: string) => Promise<boolean>;
  deleteLibrary: (libraryId: number) => Promise<boolean>;
  selectLibrary: (library: Library) => void;

  // Library words with pagination
  loadLibraryWords: (libraryId: number, options?: {
    page?: number;
    per_page?: number;
    search?: string;
  }) => Promise<void>;

  // Data preloading for immediate availability
  preloadEssentialData: () => Promise<void>;

  // Word operations
  addWord: (wordData: {
    word: string;
    meaning: string;
    pronunciation?: string;
    example?: string;
    difficulty?: string;
  }) => Promise<boolean>;
  updateWord: (wordId: number, wordData: {
    word: string;
    meaning: string;
    pronunciation?: string;
    example?: string;
    difficulty?: string;
  }) => Promise<boolean>;
  removeWord: (wordId: number) => Promise<boolean>;
  markWordLearned: (wordId: number) => Promise<boolean>;
  markWordUnlearned: (wordId: number) => Promise<boolean>;

  // CSV upload
  uploadCSV: (file: File) => Promise<boolean>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

interface LibraryProviderProps {
  children: ReactNode;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({ children }) => {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Define loadLibraryWords first before using it in effects
  const loadLibraryWords = useCallback(async (libraryId: number, options?: {
    page?: number;
    per_page?: number;
    search?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await libraryApi.getLibrary(libraryId, options);
      if (response.success) {
        const libraryData = response.data.library;

        // Update the selected library with new words and pagination info
        setSelectedLibrary(libraryData);

        // Also update the library in the libraries array to keep counts in sync
        setLibraries(prev => prev.map(lib =>
          lib.id === libraryId
            ? { ...lib, word_count: libraryData.word_count, learned_count: libraryData.learned_count, unlearned_count: libraryData.unlearned_count }
            : lib
        ));
      } else {
        throw new Error(response.error || 'Failed to load library words');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load library words';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Fetch libraries when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchLibraries();
    }
  }, [isAuthenticated]);

  // Auto-select Master Library when libraries are loaded and automatically load its words
  useEffect(() => {
    if (libraries.length > 0 && !selectedLibrary) {
      const masterLibrary = libraries.find(lib => lib.is_master);
      if (masterLibrary) {
        setSelectedLibrary(masterLibrary);
        // Automatically load words for the master library to ensure immediate availability
        loadLibraryWords(masterLibrary.id, { per_page: 500 });
      }
    }
  }, [libraries, selectedLibrary, loadLibraryWords]);

  const fetchLibraries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await libraryApi.getLibraries();
      if (response.success) {
        setLibraries(response.data.libraries);
      } else {
        throw new Error(response.error || 'Failed to fetch libraries');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch libraries';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createLibrary = async (name: string, description?: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await libraryApi.createLibrary({ name, description });
      if (response.success) {
        toast.success('Library created successfully');
        await fetchLibraries(); // Refresh libraries
        return true;
      } else {
        throw new Error(response.error || 'Failed to create library');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create library';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLibrary = async (libraryId: number, name: string, description?: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await libraryApi.updateLibrary(libraryId, { name, description });
      if (response.success) {
        toast.success('Library updated successfully');
        await fetchLibraries(); // Refresh libraries
        return true;
      } else {
        throw new Error(response.error || 'Failed to update library');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update library';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLibrary = async (libraryId: number): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await libraryApi.deleteLibrary(libraryId);
      if (response.success) {
        toast.success('Library deleted successfully');

        // If deleted library was selected, select master library
        if (selectedLibrary?.id === libraryId) {
          const masterLibrary = libraries.find(lib => lib.is_master);
          setSelectedLibrary(masterLibrary || null);
        }

        await fetchLibraries(); // Refresh libraries
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete library');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete library';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const selectLibrary = (library: Library) => {
    setSelectedLibrary(library);
    // Automatically load words when a library is selected to ensure immediate availability
    loadLibraryWords(library.id, { per_page: 500 });
  };

  const preloadEssentialData = async (): Promise<void> => {
    try {
      // Ensure libraries are loaded first
      if (libraries.length === 0) {
        await fetchLibraries();
      }

      // If we have a selected library but no words loaded, load them
      if (selectedLibrary && (!selectedLibrary.words || selectedLibrary.words.length === 0)) {
        await loadLibraryWords(selectedLibrary.id, { per_page: 500 });
      }
      // If no library is selected but we have libraries, select and load the master library
      else if (!selectedLibrary && libraries.length > 0) {
        const masterLibrary = libraries.find(lib => lib.is_master);
        if (masterLibrary) {
          setSelectedLibrary(masterLibrary);
          await loadLibraryWords(masterLibrary.id, { per_page: 500 });
        }
      }
    } catch (error) {
      console.error('Failed to preload essential data:', error);
      // Don't show error toast here as it might be called multiple times
    }
  };

  const addWord = async (wordData: {
    word: string;
    meaning: string;
    pronunciation?: string;
    example?: string;
    difficulty?: string;
  }): Promise<boolean> => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return false;
    }

    try {
      setIsLoading(true);

      const requestData = {
        ...wordData,
        library_id: selectedLibrary.id,
      };

      console.log('Adding word with data:', requestData);

      const response = await wordApi.addWord(requestData);

      if (response.success) {
        toast.success('Word added successfully');
        // Only refresh the current library instead of all libraries
        if (selectedLibrary) {
          await loadLibraryWords(selectedLibrary.id);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to add word');
      }
    } catch (error) {
      console.error('Add word error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add word';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateWord = async (wordId: number, wordData: {
    word: string;
    meaning: string;
    pronunciation?: string;
    example?: string;
    difficulty?: string;
  }): Promise<boolean> => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return false;
    }

    try {
      setIsLoading(true);

      const response = await wordApi.updateWord(wordId, {
        ...wordData,
        library_id: selectedLibrary.id,
      });

      if (response.success) {
        toast.success('Word updated successfully');
        // Only refresh the current library instead of all libraries
        if (selectedLibrary) {
          await loadLibraryWords(selectedLibrary.id);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to update word');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update word';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeWord = async (wordId: number): Promise<boolean> => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return false;
    }

    try {
      setIsLoading(true);

      const response = await wordApi.removeWord(wordId, selectedLibrary.id);
      if (response.success) {
        toast.success('Word removed successfully');
        // Only refresh the current library instead of all libraries
        if (selectedLibrary) {
          await loadLibraryWords(selectedLibrary.id);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to remove word');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove word';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const markWordLearned = async (wordId: number): Promise<boolean> => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return false;
    }

    try {
      const response = await wordApi.markWordLearned(wordId, selectedLibrary.id);
      if (response.success) {
        toast.success('Word marked as learned');
        // Only refresh the current library instead of all libraries
        if (selectedLibrary) {
          await loadLibraryWords(selectedLibrary.id);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to mark word as learned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark word as learned';
      toast.error(errorMessage);
      return false;
    }
  };

  const markWordUnlearned = async (wordId: number): Promise<boolean> => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return false;
    }

    try {
      const response = await wordApi.markWordUnlearned(wordId, selectedLibrary.id);
      if (response.success) {
        toast.success('Word marked as unlearned');
        // Only refresh the current library instead of all libraries
        if (selectedLibrary) {
          await loadLibraryWords(selectedLibrary.id);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to mark word as unlearned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark word as unlearned';
      toast.error(errorMessage);
      return false;
    }
  };

  const uploadCSV = async (file: File): Promise<boolean> => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return false;
    }

    try {
      setIsLoading(true);

      const response = await libraryApi.uploadCSV(selectedLibrary.id, file);
      if (response.success) {
        const { words_added, words_skipped, errors } = response.data;

        let message = `CSV processed: ${words_added} words added`;
        if (words_skipped > 0) {
          message += `, ${words_skipped} words skipped`;
        }

        toast.success(message);

        if (errors && errors.length > 0) {
          toast.warning(`${errors.length} errors occurred during processing`);
        }

        // Only refresh the current library instead of all libraries
        if (selectedLibrary) {
          await loadLibraryWords(selectedLibrary.id);
        }
        return true;
      } else {
        throw new Error(response.error || 'Failed to upload CSV');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload CSV';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: LibraryContextType = {
    libraries,
    selectedLibrary,
    isLoading,
    error,
    fetchLibraries,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    selectLibrary,
    loadLibraryWords,
    preloadEssentialData,
    addWord,
    updateWord,
    removeWord,
    markWordLearned,
    markWordUnlearned,
    uploadCSV,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};
