import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Word operations
  addWord: (wordData: {
    word: string;
    meaning: string;
    pronunciation?: string;
    synonym?: string;
    antonym?: string;
    example?: string;
    difficulty?: string;
  }) => Promise<boolean>;
  updateWord: (wordId: number, wordData: {
    word: string;
    meaning: string;
    pronunciation?: string;
    synonym?: string;
    antonym?: string;
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

  // Fetch libraries when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchLibraries();
    }
  }, [isAuthenticated]);

  // Auto-select Master Library when libraries are loaded
  useEffect(() => {
    if (libraries.length > 0 && !selectedLibrary) {
      const masterLibrary = libraries.find(lib => lib.is_master);
      if (masterLibrary) {
        setSelectedLibrary(masterLibrary);
      }
    }
  }, [libraries, selectedLibrary]);

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
  };

  const loadLibraryWords = async (libraryId: number, options?: {
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
  };

  const addWord = async (wordData: {
    word: string;
    meaning: string;
    pronunciation?: string;
    synonym?: string;
    antonym?: string;
    example?: string;
    difficulty?: string;
  }): Promise<boolean> => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return false;
    }

    try {
      setIsLoading(true);

      const response = await wordApi.addWord({
        ...wordData,
        library_id: selectedLibrary.id,
      });

      if (response.success) {
        toast.success('Word added successfully');
        await fetchLibraries(); // Refresh libraries to update counts
        return true;
      } else {
        throw new Error(response.error || 'Failed to add word');
      }
    } catch (error) {
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
    synonym?: string;
    antonym?: string;
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
        await fetchLibraries(); // Refresh libraries
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
        await fetchLibraries(); // Refresh libraries
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
        await fetchLibraries(); // Refresh libraries to update counts
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
        await fetchLibraries(); // Refresh libraries to update counts
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

        await fetchLibraries(); // Refresh libraries
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
    addWord,
    updateWord,
    removeWord,
    markWordLearned,
    markWordUnlearned,
    uploadCSV,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};
