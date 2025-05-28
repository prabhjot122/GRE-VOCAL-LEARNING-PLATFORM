
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Search, Volume2, Plus, TrendingUp, Target, Library, Loader2, RefreshCw, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/Header";
import { useLibrary } from "@/contexts/LibraryContext";
import { useLearning } from "@/contexts/LearningContext";
import { wordApi, Word } from "@/services/api";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [recommendedWords, setRecommendedWords] = useState<Word[]>([]);
  const [wordOfTheDay, setWordOfTheDay] = useState<Word | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingWordOfDay, setLoadingWordOfDay] = useState(false);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Word[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { libraries, selectedLibrary, selectLibrary, isLoading, preloadEssentialData } = useLibrary();
  const { startFlashcardSession } = useLearning();
  const navigate = useNavigate();

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const masterLibrary = libraries.find(lib => lib.is_master);
    const currentLibrary = selectedLibrary || masterLibrary;

    return {
      totalWords: masterLibrary?.word_count || 0,
      selectedLibrary: {
        name: currentLibrary?.name || 'No Library Selected',
        total: currentLibrary?.word_count || 0,
        learned: currentLibrary?.learned_count || 0,
        unlearned: currentLibrary?.unlearned_count || 0
      }
    };
  }, [libraries, selectedLibrary]);

  // Get stored recommendations for today and current library
  const getStoredRecommendations = () => {
    if (!selectedLibrary) return null;

    const stored = localStorage.getItem('recommendations');
    if (stored) {
      const { words, date, libraryId } = JSON.parse(stored);
      if (date === getTodayString() && libraryId === selectedLibrary.id) {
        return words;
      }
    }
    return null;
  };

  // Store recommendations with today's date and library ID
  const storeRecommendations = (words: Word[]) => {
    if (!selectedLibrary) return;

    localStorage.setItem('recommendations', JSON.stringify({
      words,
      date: getTodayString(),
      libraryId: selectedLibrary.id
    }));
  };

  // Fetch recommendations (with persistence)
  const fetchRecommendations = async (forceNew = false) => {
    if (!selectedLibrary) return;

    // Check if we already have today's recommendations for this library and not forcing new
    if (!forceNew) {
      const storedRecommendations = getStoredRecommendations();
      if (storedRecommendations) {
        setRecommendedWords(storedRecommendations);
        return;
      }
    }

    setLoadingRecommendations(true);
    try {
      const response = await wordApi.getRandomUnlearnedWords(4, selectedLibrary.id);
      if (response.success && response.data) {
        setRecommendedWords(response.data);
        storeRecommendations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast.error('Failed to load word recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Get today's date string for persistence
  const getTodayString = () => {
    return new Date().toDateString();
  };

  // Get stored word of the day for today
  const getStoredWordOfTheDay = () => {
    const stored = localStorage.getItem('wordOfTheDay');
    if (stored) {
      const { word, date } = JSON.parse(stored);
      if (date === getTodayString()) {
        return word;
      }
    }
    return null;
  };

  // Store word of the day with today's date
  const storeWordOfTheDay = (word: Word) => {
    localStorage.setItem('wordOfTheDay', JSON.stringify({
      word,
      date: getTodayString()
    }));
  };

  // Fetch word of the day (with persistence)
  const fetchWordOfTheDay = async (forceNew = false) => {
    if (!selectedLibrary) return;

    // Check if we already have today's word and not forcing new
    if (!forceNew) {
      const storedWord = getStoredWordOfTheDay();
      if (storedWord) {
        setWordOfTheDay(storedWord);
        return;
      }
    }

    setLoadingWordOfDay(true);
    try {
      const response = await wordApi.getWordOfTheDay(selectedLibrary.id);
      if (response.success && response.data && response.data.length > 0) {
        const newWord = response.data[0];
        setWordOfTheDay(newWord);
        storeWordOfTheDay(newWord);
      }
    } catch (error) {
      console.error('Failed to fetch word of the day:', error);
      toast.error('Failed to load word of the day');
    } finally {
      setLoadingWordOfDay(false);
    }
  };

  // Search words functionality
  const searchWords = async (query: string) => {
    if (!query.trim() || !selectedLibrary) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const response = await wordApi.searchWords(query, selectedLibrary.id);
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search words:', error);
      toast.error('Failed to search words');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Start flashcard session from a specific word
  const startFlashcardFromWord = async (word: Word) => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return;
    }

    try {
      // Start a mixed flashcard session starting with the specific word
      const success = await startFlashcardSession(selectedLibrary.id, 'mixed', word.id);
      if (success) {
        navigate('/learn');
        toast.success(`Started flashcard session with "${word.word}"`);
      }
    } catch (error) {
      console.error('Failed to start flashcard session:', error);
      toast.error('Failed to start flashcard session');
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchWords(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedLibrary]);

  // Preload essential data when component mounts to ensure immediate availability
  useEffect(() => {
    preloadEssentialData();
  }, [preloadEssentialData]);

  // Load data when library changes
  useEffect(() => {
    if (selectedLibrary) {
      fetchRecommendations();
      fetchWordOfTheDay();
    }
  }, [selectedLibrary, fetchRecommendations, fetchWordOfTheDay]);

  // Google search functionality
  const searchWordOnGoogle = (word: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(word + ' meaning definition')}`;
    window.open(searchUrl, '_blank');
    toast.success(`Searching "${word}" on Google`);
  };

  // Text-to-speech functionality
  const handleWordClick = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
      toast.success(`Playing pronunciation for "${word}"`);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };

  const markAsLearned = async (wordId: number, word: string) => {
    if (!selectedLibrary) return;

    try {
      await wordApi.markWordLearned(wordId, selectedLibrary.id);
      toast.success(`"${word}" marked as learned!`);
      // Refresh recommendations and word of the day with new words
      fetchRecommendations(true);
      fetchWordOfTheDay(true);
    } catch (error) {
      toast.error("Failed to mark word as learned");
    }
  };

  const learnedPercentage = (metrics.selectedLibrary.learned / metrics.selectedLibrary.total) * 100;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="text-center space-y-6">
            <h1 className="heading-display text-6xl md:text-7xl text-gradient">Welcome to VocabMaster</h1>
            <p className="text-body-large max-w-3xl mx-auto leading-relaxed">
              Master new vocabulary with our intelligent learning system designed to accelerate your progress and transform your language skills.
            </p>
          </div>
        </div>

        {/* Library Selector */}
        <div className="mb-8">
          <div className="card-enhanced p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-4">
              <label htmlFor="library-select" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Library className="h-4 w-4 text-primary" />
                <span>Current Library:</span>
              </label>
              <Select
                value={selectedLibrary?.id.toString() || ''}
                onValueChange={(value) => {
                  const library = libraries.find(lib => lib.id.toString() === value);
                  if (library) selectLibrary(library);
                }}
              >
                <SelectTrigger className="w-80 h-12 border-2 border-gray-200 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select a library" />
                </SelectTrigger>
                <SelectContent className="card-enhanced">
                  {libraries.map((library) => (
                    <SelectItem key={library.id} value={library.id.toString()} className="hover:bg-primary/5">
                      <div className="flex items-center space-x-2">
                        <span>{library.name}</span>
                        {library.is_master && <Badge variant="secondary" className="text-xs">Master</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          <div className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Library className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-label">Total Words</h3>
                  <p className="text-caption">Master Library</p>
                </div>
              </div>
            </div>
            <div className="heading-display text-4xl text-gray-900 mb-2">{metrics.totalWords.toLocaleString()}</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-caption">Available for learning</span>
            </div>
          </div>

          <div className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-label">Learning Progress</h3>
                  <p className="text-caption">Current library</p>
                </div>
              </div>
            </div>
            <div className="heading-display text-4xl text-gray-900 mb-3">{metrics.selectedLibrary.learned}</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-caption">Progress</span>
                <span className="text-label text-accent">{Math.round(learnedPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-accent to-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${learnedPercentage}%` }}
                ></div>
              </div>
              <p className="text-caption">of {metrics.selectedLibrary.total} words mastered</p>
            </div>
          </div>

          <div className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-label">Remaining</h3>
                  <p className="text-caption">To be learned</p>
                </div>
              </div>
            </div>
            <div className="heading-display text-4xl text-gray-900 mb-2">{metrics.selectedLibrary.unlearned}</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
              <span className="text-caption">Words awaiting mastery</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="card-enhanced p-6 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="heading-primary text-2xl mb-3">Quick Word Search</h2>
              <p className="text-body">Find any word in your vocabulary collection</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for words, meanings, or synonyms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg border-2 border-gray-200 focus:border-primary/50 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 bg-white/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Search Results */}
            {showSearchResults && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="heading-secondary text-xl">
                    Search Results {isSearching ? "(Searching...)" : `(${searchResults.length})`}
                  </h3>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchResults(false);
                      }}
                      className="hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>

                {isSearching ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((word) => (
                      <div
                        key={word.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-medium transition-all duration-200 hover:border-primary/30 cursor-pointer group"
                        onClick={() => startFlashcardFromWord(word)}
                        title="Click to start flashcard session with this word"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="heading-secondary text-xl group-hover:text-primary transition-colors">
                            {word.word}
                          </h4>
                          <Badge
                            variant={word.is_learned ? "default" : "secondary"}
                            className={word.is_learned ? "bg-accent text-white" : "bg-gray-100 text-gray-700"}
                          >
                            {word.is_learned ? "Learned" : "Unlearned"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWordClick(word.word);
                              }}
                              className="p-1 h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              title="Pronounce word"
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                searchWordOnGoogle(word.word);
                              }}
                              className="p-1 h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                              title="Search on Google"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            Click to study
                          </div>
                        </div>

                        {!word.is_learned && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsLearned(word.id, word.word);
                            }}
                            className="mt-3 w-full hover:bg-accent/10 hover:text-accent hover:border-accent transition-all duration-200"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Mark as Learned
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Words Found</h3>
                    <p className="text-gray-600">
                      No words match your search "{searchQuery}". Try a different search term.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Word of the Day */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-primary shadow-large">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="heading-display text-4xl text-white mb-3">Word of the Day</h2>
                  <p className="text-white/90 text-body-large">Expand your vocabulary daily with curated words</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>

              {loadingWordOfDay ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                    <span className="text-white">Loading word of the day...</span>
                  </div>
                </div>
              ) : wordOfTheDay ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <h3
                          className="heading-display text-5xl text-white cursor-pointer hover:text-blue-200 hover:underline transition-colors"
                          onClick={() => searchWordOnGoogle(wordOfTheDay.word)}
                          title="Click to search on Google"
                        >
                          {wordOfTheDay.word}
                        </h3>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleWordClick(wordOfTheDay.word)}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                        >
                          <Volume2 className="h-4 w-4 mr-2" />
                          {wordOfTheDay.pronunciation || 'Pronounce'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => searchWordOnGoogle(wordOfTheDay.word)}
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Google
                        </Button>
                      </div>
                      <p className="text-body-large text-white/90 leading-relaxed max-w-2xl">{wordOfTheDay.meaning}</p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button
                        onClick={() => markAsLearned(wordOfTheDay.id, wordOfTheDay.word)}
                        className="bg-white text-primary hover:bg-white/90 shadow-medium hover:shadow-large transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Mark as Learned
                      </Button>
                      <Button
                        onClick={() => fetchWordOfTheDay(true)}
                        variant="outline"
                        className="border-white/100 text-white bg-white/20 hover:bg-white/20 hover:border-white/70 backdrop-blur-sm transition-all duration-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        New Word
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-center text-white">
                    <p className="mb-4">No unlearned words available in the selected library.</p>
                    <Button
                      onClick={() => fetchWordOfTheDay(true)}
                      variant="outline"
                      className="border-white/50 text-white hover:bg-white/20 hover:border-white/70 backdrop-blur-sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Words */}
        <div className="mb-8">
          <div className="card-enhanced p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="text-center flex-1">
                <h2 className="heading-primary text-3xl mb-3">Recommended for You</h2>
                <p className="text-body">Carefully selected words to accelerate your learning journey</p>
              </div>
              <Button
                onClick={() => fetchRecommendations(true)}
                variant="outline"
                size="sm"
                disabled={loadingRecommendations}
                className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
              >
                {loadingRecommendations ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            {loadingRecommendations ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 flex-1 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendedWords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedWords.map((word) => (
                  <div
                    key={word.id}
                    className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-large transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 cursor-pointer"
                  >
                    <div className="absolute top-4 right-4">
                      <Badge
                        variant="outline"
                        className="text-xs border-warning/50 text-warning bg-warning/5"
                      >
                        unlearned
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <h4
                        className="heading-secondary text-2xl group-hover:text-primary transition-colors mb-2 cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          searchWordOnGoogle(word.word);
                        }}
                        title="Click to search on Google"
                      >
                        {word.word}
                      </h4>
                      <p className="text-body leading-relaxed line-clamp-3">{word.meaning}</p>
                    </div>

                    <div className="flex items-center space-x-2 mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWordClick(word.word);
                        }}
                        className="p-2 h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Pronounce word"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          searchWordOnGoogle(word.word);
                        }}
                        className="p-2 h-9 w-9 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        title="Search on Google"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsLearned(word.id, word.word);
                        }}
                        className="flex-1 text-xs font-medium hover:bg-accent hover:text-white hover:border-accent transition-all duration-200"
                      >
                        Mark as Learned
                      </Button>
                    </div>

                    {/* Decorative element */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="heading-secondary text-2xl mb-3">No Recommendations Available</h3>
                <p className="text-body mb-6">No unlearned words found in the selected library</p>
                <Button onClick={() => fetchRecommendations(true)} className="btn-gradient">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}

            {recommendedWords.length > 0 && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => fetchRecommendations(true)}
                  variant="outline"
                  className="hover:bg-primary hover:text-white transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Get New Recommendations
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
