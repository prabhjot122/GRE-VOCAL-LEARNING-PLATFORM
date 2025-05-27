const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// Library API
export const libraryApi = {
  // Get all libraries for the current user
  getLibraries: async () => {
    const response = await fetch(`${API_BASE_URL}/libraries`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get a specific library with its words (with pagination support)
  getLibrary: async (libraryId: number, options?: {
    page?: number;
    per_page?: number;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.per_page) params.append('per_page', options.per_page.toString());
    if (options?.search) params.append('search', options.search);

    const url = `${API_BASE_URL}/libraries/${libraryId}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new library
  createLibrary: async (libraryData: { name: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/libraries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(libraryData),
    });
    return handleResponse(response);
  },

  // Update a library
  updateLibrary: async (libraryId: number, libraryData: { name: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/libraries/${libraryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(libraryData),
    });
    return handleResponse(response);
  },

  // Delete a library
  deleteLibrary: async (libraryId: number) => {
    const response = await fetch(`${API_BASE_URL}/libraries/${libraryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Upload CSV to library
  uploadCSV: async (libraryId: number, file: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/libraries/${libraryId}/upload-csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return handleResponse(response);
  },
};

// Word API
export const wordApi = {
  // Add a word to a library
  addWord: async (wordData: {
    library_id: number;
    word: string;
    meaning: string;
    pronunciation?: string;
    synonym?: string;
    antonym?: string;
    example?: string;
    difficulty?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/words`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(wordData),
    });
    return handleResponse(response);
  },

  // Update a word
  updateWord: async (wordId: number, wordData: {
    library_id: number;
    word: string;
    meaning: string;
    pronunciation?: string;
    synonym?: string;
    antonym?: string;
    example?: string;
    difficulty?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/words/${wordId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(wordData),
    });
    return handleResponse(response);
  },

  // Remove a word from a library
  removeWord: async (wordId: number, libraryId: number) => {
    const response = await fetch(`${API_BASE_URL}/words/${wordId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ library_id: libraryId, word_id: wordId }),
    });
    return handleResponse(response);
  },

  // Mark word as learned
  markWordLearned: async (wordId: number, libraryId: number) => {
    const response = await fetch(`${API_BASE_URL}/words/${wordId}/learn`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ library_id: libraryId }),
    });
    return handleResponse(response);
  },

  // Mark word as unlearned
  markWordUnlearned: async (wordId: number, libraryId: number) => {
    const response = await fetch(`${API_BASE_URL}/words/${wordId}/unlearn`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ library_id: libraryId }),
    });
    return handleResponse(response);
  },

  // Get random unlearned words for recommendations
  getRandomUnlearnedWords: async (limit: number = 4, libraryId?: number) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      status: 'unlearned'
    });
    if (libraryId) {
      params.append('library_id', libraryId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/words/random?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get word of the day (random unlearned word)
  getWordOfTheDay: async (libraryId?: number) => {
    const params = new URLSearchParams({
      limit: '1',
      status: 'unlearned'
    });
    if (libraryId) {
      params.append('library_id', libraryId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/words/random?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Search words across all libraries
  searchWords: async (query: string, libraryId?: number) => {
    const params = new URLSearchParams({
      q: query
    });
    if (libraryId) {
      params.append('library_id', libraryId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/words/search?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Story API
export const storyApi = {
  // Get all stories for the current user
  getStories: async () => {
    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get a specific story
  getStory: async (storyId: number) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new story
  createStory: async (storyData: {
    title: string;
    content: string;
    genre?: string;
    keywords?: string[];
    is_public?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(storyData),
    });
    return handleResponse(response);
  },

  // Update a story
  updateStory: async (storyId: number, storyData: {
    title: string;
    content: string;
    genre?: string;
    keywords?: string[];
    is_public?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(storyData),
    });
    return handleResponse(response);
  },

  // Delete a story
  deleteStory: async (storyId: number) => {
    const response = await fetch(`${API_BASE_URL}/stories/${storyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Generate a story
  generateStory: async (generateData: {
    words: string[];
    genre: string;
    character?: string;
    scenario?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/stories/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(generateData),
    });
    return handleResponse(response);
  },

  // Get public stories
  getPublicStories: async () => {
    const response = await fetch(`${API_BASE_URL}/stories/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },
};

// Unified API object
export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(response);
  },

  // Specific API modules
  libraries: libraryApi,
  words: wordApi,
  stories: storyApi,
};

// Types for TypeScript
export interface Library {
  id: number;
  name: string;
  description?: string;
  is_master: boolean;
  word_count: number;
  learned_count: number;
  unlearned_count: number;
  created_at: string;
  updated_at: string;
  words?: Word[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface Word {
  id: number;
  word: string;
  meaning: string;
  pronunciation?: string;
  synonym?: string;
  antonym?: string;
  example?: string;
  difficulty: string;
  is_learned: boolean;
  learned_at?: string;
  added_at: string;
  library_word_id: number;
  created_at: string;
}

export interface Story {
  id: number;
  title: string;
  content: string;
  genre?: string;
  keywords?: string[];
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}
