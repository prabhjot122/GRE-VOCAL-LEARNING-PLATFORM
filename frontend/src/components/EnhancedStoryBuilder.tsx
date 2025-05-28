import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Wand2, Save, Share2, Download, Trash2, Edit, Eye, Search, Plus, X, ChevronLeft, ChevronRight, Calendar, Tag } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/LibraryContext";
import { storyApi, Story, wordApi, Word } from "@/services/api";
import { geminiApi, StoryGenerationRequest } from "@/services/geminiApi";

const EnhancedStoryBuilder = () => {
  const { selectedLibrary, preloadEssentialData } = useLibrary();

  // Story creation state
  const [selectedWords, setSelectedWords] = useState<Word[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [customCharacter, setCustomCharacter] = useState("");
  const [customScenario, setCustomScenario] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [storyTone, setStoryTone] = useState("engaging");
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('medium');

  // Enhanced word selection state
  const [wordSearchQuery, setWordSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Word[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualWord, setManualWord] = useState("");
  const [activeWordTab, setActiveWordTab] = useState("learned");

  // Story management state
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Story viewing state
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);

  // Tab control state
  const [activeMainTab, setActiveMainTab] = useState("create");
  const [activeStoryTab, setActiveStoryTab] = useState("words");

  const genres = [
    { name: "Fantasy", icon: "🧙‍♂️", description: "Magic and mythical creatures" },
    { name: "Sci-Fi", icon: "🚀", description: "Futuristic technology and space" },
    { name: "Mystery", icon: "🔍", description: "Puzzles and detective work" },
    { name: "Adventure", icon: "🗺️", description: "Exploration and excitement" },
    { name: "Romance", icon: "💕", description: "Love and relationships" },
    { name: "Thriller", icon: "⚡", description: "Suspense and danger" }
  ];

  // Preload essential data and load stories on component mount
  useEffect(() => {
    preloadEssentialData();
    loadStories();
  }, [preloadEssentialData]);

  const loadStories = async () => {
    try {
      const response = await storyApi.getStories();
      if (response.success) {
        setStories(response.data.stories);
      } else {
        toast.error('Failed to load stories: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to load stories:', error);
      toast.error('Failed to load stories: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getAvailableWords = () => {
    if (!selectedLibrary || !selectedLibrary.words) return { learned: [], unlearned: [] };

    const learned = selectedLibrary.words.filter(word => word.is_learned);
    const unlearned = selectedLibrary.words.filter(word => !word.is_learned);

    return { learned, unlearned };
  };

  const handleWordToggle = (word: Word) => {
    setSelectedWords(prev =>
      prev.find(w => w.id === word.id)
        ? prev.filter(w => w.id !== word.id)
        : [...prev, word]
    );
  };

  // Search for words
  const searchWords = async (query: string) => {
    if (!query.trim() || !selectedLibrary) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await wordApi.searchWords(query, selectedLibrary.id);
      if (response.success && response.data) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error('Failed to search words:', error);
      toast.error('Failed to search words');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (wordSearchQuery) {
        searchWords(wordSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [wordSearchQuery, selectedLibrary]);

  // Add manual word
  const handleAddManualWord = () => {
    if (!manualWord.trim()) return;

    const manualWordObj: Word = {
      id: Date.now(), // Temporary ID for manual words
      word: manualWord.trim().toLowerCase(),
      meaning: "Manually added word",
      is_learned: false,
      pronunciation: "",
      synonym: "",
      antonym: "",
      example: "",
      difficulty: "medium",
      added_at: new Date().toISOString(),
      library_word_id: 0,
      created_at: new Date().toISOString()
    };

    if (!selectedWords.find(w => w.word === manualWordObj.word)) {
      setSelectedWords(prev => [...prev, manualWordObj]);
      setManualWord("");
      toast.success(`"${manualWordObj.word}" added to selection`);
    } else {
      toast.error("Word already selected");
    }
  };

  // Remove selected word
  const removeSelectedWord = (wordId: number) => {
    setSelectedWords(prev => prev.filter(w => w.id !== wordId));
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
  };

  const handleGenerateStory = async () => {
    if (selectedWords.length === 0) {
      toast.error("Please select at least one word to include in your story");
      return;
    }

    if (!selectedGenre) {
      toast.error("Please select a genre for your story");
      return;
    }

    setLoading(true);
    try {
      const wordList = selectedWords.map(w => w.word);

      // Check if Gemini API is available
      if (geminiApi.isAvailable()) {
        toast.info("Generating story with Google Gemini AI...");

        const request: StoryGenerationRequest = {
          words: wordList,
          genre: selectedGenre,
          character: customCharacter || undefined,
          scenario: customScenario || undefined,
          tone: storyTone,
          length: storyLength
        };

        const response = await geminiApi.generateStory(request);

        if (response.success && response.story) {
          setStoryContent(response.story);
          setStoryTitle(response.title || storyTitle || `${selectedGenre} Adventure`);
          toast.success("Story generated successfully with Google Gemini AI!");
        } else {
          throw new Error(response.error || 'Failed to generate story with Gemini API');
        }
      } else {
        // Fallback to sample story generator
        toast.info("Using fallback story generator (Gemini API not configured)");
        const sampleStory = generateSampleStory(wordList, selectedGenre, customCharacter, customScenario);
        setStoryContent(sampleStory);
        setStoryTitle(storyTitle || `${selectedGenre} Adventure`);
        toast.success("Story generated successfully! (Configure Gemini API for AI-powered stories)");
      }
    } catch (error) {
      console.error('Failed to generate story:', error);
      toast.error('Failed to generate story: ' + (error instanceof Error ? error.message : 'Unknown error'));

      // Fallback to sample story on error
      try {
        const wordList = selectedWords.map(w => w.word);
        const sampleStory = generateSampleStory(wordList, selectedGenre, customCharacter, customScenario);
        setStoryContent(sampleStory);
        setStoryTitle(storyTitle || `${selectedGenre} Adventure`);
        toast.info("Using fallback story generator");
      } catch (fallbackError) {
        console.error('Fallback story generation failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sample story generator (placeholder for Google Gemini API)
  const generateSampleStory = (words: string[], genre: string, character?: string, scenario?: string) => {
    const characterName = character || "Alex";
    const setting = scenario || getGenreSetting(genre);

    const storyTemplates = {
      Fantasy: `In a realm where magic flows through every ${words[0] || 'stone'}, ${characterName} discovered their ${words[1] || 'power'} was more ${words[2] || 'extraordinary'} than anyone imagined. ${setting ? `${setting}.` : ''} As they journeyed through the ${words[3] || 'mystical'} lands, they encountered challenges that would test their ${words[4] || 'courage'} and ${words[5] || 'wisdom'}.`,

      "Sci-Fi": `In the year 2157, ${characterName} was a ${words[0] || 'brilliant'} scientist working on a ${words[1] || 'revolutionary'} project. ${setting ? `${setting}.` : ''} When their ${words[2] || 'advanced'} technology began showing ${words[3] || 'unexpected'} results, they realized the ${words[4] || 'implications'} could change humanity forever.`,

      Mystery: `Detective ${characterName} had seen many ${words[0] || 'puzzling'} cases, but this one was particularly ${words[1] || 'intriguing'}. ${setting ? `${setting}.` : ''} The ${words[2] || 'evidence'} seemed to point in ${words[3] || 'contradictory'} directions, and every ${words[4] || 'clue'} only deepened the mystery.`,

      Adventure: `${characterName} had always been ${words[0] || 'adventurous'}, but nothing had prepared them for this ${words[1] || 'extraordinary'} journey. ${setting ? `${setting}.` : ''} With only their ${words[2] || 'determination'} and a ${words[3] || 'mysterious'} map, they set out to discover the ${words[4] || 'legendary'} treasure.`,

      Romance: `When ${characterName} first met them, it was like discovering something ${words[0] || 'beautiful'} in an ${words[1] || 'ordinary'} world. ${setting ? `${setting}.` : ''} Their ${words[2] || 'gentle'} nature and ${words[3] || 'compassionate'} heart made every moment feel ${words[4] || 'magical'}.`,

      Thriller: `${characterName} knew they were being watched. Every ${words[0] || 'shadow'} seemed ${words[1] || 'threatening'}, every sound ${words[2] || 'ominous'}. ${setting ? `${setting}.` : ''} Time was running out, and the ${words[3] || 'dangerous'} truth was more ${words[4] || 'terrifying'} than they had imagined.`
    };

    return storyTemplates[genre as keyof typeof storyTemplates] || storyTemplates.Adventure;
  };

  const getGenreSetting = (genre: string) => {
    const settings = {
      Fantasy: "The ancient prophecy spoke of this moment",
      "Sci-Fi": "The space station's alarms began to sound",
      Mystery: "The old mansion held many secrets",
      Adventure: "The jungle was full of unknown dangers",
      Romance: "It was a chance encounter at the local café",
      Thriller: "The message arrived at midnight"
    };
    return settings[genre as keyof typeof settings] || "";
  };

  const handleSaveStory = async () => {
    if (!storyTitle.trim() || !storyContent.trim()) {
      toast.error("Please provide both title and content for your story");
      return;
    }

    setLoading(true);
    try {
      const storyData = {
        title: storyTitle,
        content: storyContent,
        genre: selectedGenre,
        keywords: selectedWords.map(w => w.word),
        is_public: isPublic
      };

      let response: any;
      if (isEditing && selectedStory) {
        response = await storyApi.updateStory(selectedStory.id, storyData);
      } else {
        response = await storyApi.createStory(storyData);
      }

      if (response.success) {
        const successMessage = isEditing ? "Story updated successfully!" : "Story saved successfully!";
        toast.success(successMessage);

        // Reload stories to show updated data
        await loadStories();

        // Reset form and switch back to manage tab to show the updated story
        resetForm();
        setActiveMainTab("manage");
      } else {
        throw new Error(response.error || 'Failed to save story');
      }
    } catch (error) {
      console.error('Failed to save story:', error);
      toast.error('Failed to save story: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditStory = (story: Story) => {
    setSelectedStory(story);
    setStoryTitle(story.title);
    setStoryContent(story.content);
    setSelectedGenre(story.genre || "");
    // Convert keywords back to Word objects (simplified for editing)
    const keywordWords: Word[] = (story.keywords || []).map((keyword, index) => ({
      id: Date.now() + index,
      word: keyword,
      meaning: "Story keyword",
      is_learned: false,
      pronunciation: "",
      synonym: "",
      antonym: "",
      example: "",
      difficulty: "medium",
      added_at: new Date().toISOString(),
      library_word_id: 0,
      created_at: new Date().toISOString()
    }));
    setSelectedWords(keywordWords);
    setIsPublic(story.is_public);
    setIsEditing(true);

    // Switch to Create Story tab and go to the Write Story step
    setActiveMainTab("create");
    setActiveStoryTab("generate");

    // Show success message
    toast.success("Story loaded for editing!");
  };

  const handleViewStory = (story: Story) => {
    setViewingStory(story);
    setIsStoryViewerOpen(true);
  };

  const closeStoryViewer = () => {
    setIsStoryViewerOpen(false);
    setViewingStory(null);
  };

  const navigateToNextStory = () => {
    if (!viewingStory) return;
    const currentIndex = stories.findIndex(s => s.id === viewingStory.id);
    const nextIndex = (currentIndex + 1) % stories.length;
    setViewingStory(stories[nextIndex]);
  };

  const navigateToPreviousStory = () => {
    if (!viewingStory) return;
    const currentIndex = stories.findIndex(s => s.id === viewingStory.id);
    const previousIndex = currentIndex === 0 ? stories.length - 1 : currentIndex - 1;
    setViewingStory(stories[previousIndex]);
  };

  const handleDeleteStory = async (storyId: number) => {
    if (!confirm("Are you sure you want to delete this story?")) return;

    try {
      const response = await storyApi.deleteStory(storyId);
      if (response.success) {
        toast.success("Story deleted successfully!");
        loadStories();
        if (selectedStory?.id === storyId) {
          resetForm();
        }
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
      toast.error('Failed to delete story');
    }
  };

  const resetForm = () => {
    setStoryTitle("");
    setStoryContent("");
    setSelectedWords([]);
    setSelectedGenre("");
    setCustomCharacter("");
    setCustomScenario("");
    setIsPublic(false);
    setIsEditing(false);
    setSelectedStory(null);

    // Reset tab states
    setActiveMainTab("create");
    setActiveStoryTab("words");
  };

  const highlightWords = (text: string) => {
    let highlightedText = text;
    selectedWords.forEach(wordObj => {
      const regex = new RegExp(`\\b${wordObj.word}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">${wordObj.word}</mark>`);
    });
    return highlightedText;
  };

  const highlightStoryWords = (text: string, keywords: string[]) => {
    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<mark class="bg-blue-200 px-1 rounded font-semibold">${keyword}</mark>`);
    });
    return highlightedText;
  };

  const exportStory = (story: Story) => {
    const content = `# ${story.title}\n\n**Genre:** ${story.genre}\n**Keywords:** ${story.keywords?.join(', ')}\n**Created:** ${new Date(story.created_at).toLocaleDateString()}\n\n${story.content}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Story exported successfully!");
  };

  const availableWords = getAvailableWords();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="heading-display text-5xl md:text-6xl">Story Builder</h1>
          <p className="text-body-large max-w-2xl mx-auto">Create engaging stories using your vocabulary words and bring your learning to life</p>
        </div>

        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="create">Create Story</TabsTrigger>
            <TabsTrigger value="manage">My Stories</TabsTrigger>
          </TabsList>

          {/* Create Story Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5" />
                  <span>{isEditing ? 'Edit Story' : 'Create Your Story'}</span>
                </CardTitle>
                <CardDescription>
                  {isEditing ? 'Update your story' : 'Follow the steps to generate a personalized story'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeStoryTab} onValueChange={setActiveStoryTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="words">1. Select Words</TabsTrigger>
                    <TabsTrigger value="settings">2. Story Settings</TabsTrigger>
                    <TabsTrigger value="generate">3. Write Story</TabsTrigger>
                  </TabsList>

                  <TabsContent value="words" className="space-y-6">
                    {!selectedLibrary ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Please select a library first to access your vocabulary words</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Search Bar */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="word-search">Search Words</Label>
                            <div className="relative mt-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                              <Input
                                id="word-search"
                                type="text"
                                placeholder="Search for words to add to your story..."
                                value={wordSearchQuery}
                                onChange={(e) => setWordSearchQuery(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          {/* Manual Word Addition */}
                          <div>
                            <Label htmlFor="manual-word">Add Custom Word</Label>
                            <div className="flex space-x-2 mt-1">
                              <Input
                                id="manual-word"
                                type="text"
                                placeholder="Type a word to add manually..."
                                value={manualWord}
                                onChange={(e) => setManualWord(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddManualWord()}
                              />
                              <Button onClick={handleAddManualWord} disabled={!manualWord.trim()}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Search Results */}
                        {wordSearchQuery && (
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold">
                              Search Results {isSearching ? "(Searching...)" : `(${searchResults.length})`}
                            </h3>
                            {isSearching ? (
                              <div className="flex justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {searchResults.map((word) => (
                                  <div
                                    key={word.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                      selectedWords.find(w => w.id === word.id)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handleWordToggle(word)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium capitalize">{word.word}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-2">{word.meaning}</p>
                                      </div>
                                      <Badge variant={word.is_learned ? "default" : "secondary"} className="text-xs">
                                        {word.is_learned ? "Learned" : "Unlearned"}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-4">No words found matching "{wordSearchQuery}"</p>
                            )}
                          </div>
                        )}

                        {/* Quick Access Tabs */}
                        <div className="space-y-3">
                          <Tabs value={activeWordTab} onValueChange={setActiveWordTab}>
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="learned">Learned ({availableWords.learned.length})</TabsTrigger>
                              <TabsTrigger value="unlearned">Unlearned ({availableWords.unlearned.length})</TabsTrigger>
                              <TabsTrigger value="selected">Selected ({selectedWords.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="learned" className="space-y-3">
                              {availableWords.learned.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {availableWords.learned.slice(0, 20).map((word) => (
                                    <Badge
                                      key={word.id}
                                      variant={selectedWords.find(w => w.id === word.id) ? "default" : "outline"}
                                      className="cursor-pointer hover:bg-blue-100 px-3 py-1 capitalize"
                                      onClick={() => handleWordToggle(word)}
                                    >
                                      {word.word}
                                    </Badge>
                                  ))}
                                  {availableWords.learned.length > 20 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{availableWords.learned.length - 20} more (use search)
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-4">No learned words available</p>
                              )}
                            </TabsContent>

                            <TabsContent value="unlearned" className="space-y-3">
                              {availableWords.unlearned.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {availableWords.unlearned.slice(0, 20).map((word) => (
                                    <Badge
                                      key={word.id}
                                      variant={selectedWords.find(w => w.id === word.id) ? "default" : "secondary"}
                                      className="cursor-pointer hover:bg-gray-100 px-3 py-1 capitalize"
                                      onClick={() => handleWordToggle(word)}
                                    >
                                      {word.word}
                                    </Badge>
                                  ))}
                                  {availableWords.unlearned.length > 20 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{availableWords.unlearned.length - 20} more (use search)
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-4">No unlearned words available</p>
                              )}
                            </TabsContent>

                            <TabsContent value="selected" className="space-y-3">
                              {selectedWords.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap gap-2">
                                    {selectedWords.map((word) => (
                                      <div key={word.id} className="flex items-center space-x-1">
                                        <Badge variant="default" className="capitalize">
                                          {word.word}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeSelectedWord(word.id)}
                                          className="h-5 w-5 p-0 hover:bg-red-100"
                                        >
                                          <X className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedWords([])}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Clear All
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-4">No words selected yet</p>
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <div className="space-y-4">


                      <div>
                        <h3 className="text-lg font-semibold mb-3">Choose Genre</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {genres.map((genre) => (
                            <Card
                              key={genre.name}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedGenre === genre.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => handleGenreSelect(genre.name)}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="text-2xl mb-2">{genre.icon}</div>
                                <h4 className="font-medium">{genre.name}</h4>
                                <p className="text-xs text-gray-600 mt-1">{genre.description}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="character">Custom Character (Optional)</Label>
                          <Input
                            id="character"
                            placeholder="e.g., A brave astronaut"
                            value={customCharacter}
                            onChange={(e) => setCustomCharacter(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="scenario">Custom Scenario (Optional)</Label>
                          <Input
                            id="scenario"
                            placeholder="e.g., Lost in a mysterious forest"
                            value={customScenario}
                            onChange={(e) => setCustomScenario(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Advanced AI Options */}
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <Wand2 className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-blue-900">AI Story Generation Options</h4>
                          <Badge variant={geminiApi.isAvailable() ? "default" : "secondary"} className="text-xs">
                            {geminiApi.isAvailable() ? "Gemini AI Ready" : "Fallback Mode"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="tone">Story Tone</Label>
                            <Select value={storyTone} onValueChange={setStoryTone}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select tone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="engaging">Engaging</SelectItem>
                                <SelectItem value="humorous">Humorous</SelectItem>
                                <SelectItem value="dramatic">Dramatic</SelectItem>
                                <SelectItem value="mysterious">Mysterious</SelectItem>
                                <SelectItem value="inspirational">Inspirational</SelectItem>
                                <SelectItem value="educational">Educational</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="length">Story Length</Label>
                            <Select value={storyLength} onValueChange={(value: 'short' | 'medium' | 'long') => setStoryLength(value)}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select length" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short">Short (150-250 words)</SelectItem>
                                <SelectItem value="medium">Medium (300-500 words)</SelectItem>
                                <SelectItem value="long">Long (500-800 words)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {!geminiApi.isAvailable() && (
                          <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-md">
                            <p className="font-medium mb-1">💡 Enable AI-Powered Stories</p>
                            <p>Add your Google Gemini API key to <code className="bg-blue-200 px-1 rounded">VITE_GEMINI_API_KEY</code> in your .env file to unlock advanced AI story generation.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="public-story"
                          checked={isPublic}
                          onCheckedChange={setIsPublic}
                        />
                        <Label htmlFor="public-story">Make story public (others can view it)</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="generate" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Write Your Story</h3>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleGenerateStory}
                            disabled={loading || selectedWords.length === 0}
                            variant="outline"
                          >
                            <Wand2 className="h-4 w-4 mr-2" />
                            {loading ? 'Generating...' : 'Generate Story'}
                          </Button>
                          <Button onClick={handleSaveStory} disabled={loading || !storyTitle.trim() || !storyContent.trim()}>
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : isEditing ? 'Update Story' : 'Save Story'}
                          </Button>
                        </div>
                      </div>

                      {/* Story Title Field */}
                      <div>
                        <Label htmlFor="story-title">Story Title *</Label>
                        <Input
                          id="story-title"
                          type="text"
                          placeholder="Enter your story title..."
                          value={storyTitle}
                          onChange={(e) => setStoryTitle(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>

                      <Textarea
                        placeholder="Your story content will appear here, or you can write your own..."
                        value={storyContent}
                        onChange={(e) => setStoryContent(e.target.value)}
                        className="min-h-[300px]"
                      />

                      {storyContent && selectedWords.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="heading-secondary text-xl">Story Preview</h4>
                          <p className="text-caption">Vocabulary words are highlighted below</p>
                          <div
                            className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 story-content prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: highlightWords(storyContent) }}
                          />
                        </div>
                      )}

                      {isEditing && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Edit className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">
                                Editing: {selectedStory?.title}
                              </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={resetForm}>
                              Cancel Edit
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Stories Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>My Stories ({stories.length})</span>
                  </div>
                  <Button onClick={loadStories} variant="outline" size="sm">
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stories.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No stories created yet</p>
                    <p className="text-sm text-gray-500">Create your first story using the "Create Story" tab</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stories.map((story) => (
                      <Card key={story.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="heading-primary text-xl line-clamp-2 mb-3">{story.title}</CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {story.genre}
                                </Badge>
                                {story.is_public && (
                                  <Badge variant="secondary" className="text-xs font-medium">
                                    <Share2 className="h-3 w-3 mr-1" />
                                    Public
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-body line-clamp-3 mb-4">
                            {story.content.substring(0, 150)}...
                          </p>

                          {story.keywords && story.keywords.length > 0 && (
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 mb-1">Keywords:</p>
                              <div className="flex flex-wrap gap-1">
                                {story.keywords.slice(0, 3).map((keyword, index) => (
                                  <Badge key={index} variant="outline" className="text-xs capitalize">
                                    {keyword}
                                  </Badge>
                                ))}
                                {story.keywords.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{story.keywords.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <span>Created: {new Date(story.created_at).toLocaleDateString()}</span>
                            <span>{story.content.split(' ').length} words</span>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleViewStory(story)}
                              className="flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Read
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditStory(story)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportStory(story)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteStory(story.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Story Viewer Dialog */}
        <Dialog open={isStoryViewerOpen} onOpenChange={setIsStoryViewerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <DialogTitle className="story-title text-left">
                    {viewingStory?.title}
                  </DialogTitle>
                  <DialogDescription className="text-left mt-3">
                    <div className="flex items-center space-x-4 story-meta">
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">{viewingStory?.genre}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{viewingStory ? new Date(viewingStory.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{viewingStory?.content.split(' ').length} words</span>
                      </div>
                      {viewingStory?.is_public && (
                        <Badge variant="secondary" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </DialogDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {stories.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={navigateToPreviousStory}
                        disabled={!viewingStory}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-500">
                        {viewingStory ? stories.findIndex(s => s.id === viewingStory.id) + 1 : 0} of {stories.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={navigateToNextStory}
                        disabled={!viewingStory}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (viewingStory) {
                        handleEditStory(viewingStory);
                        closeStoryViewer();
                      }
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeStoryViewer}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              {viewingStory && (
                <div className="space-y-6">
                  {/* Keywords Section */}
                  {viewingStory.keywords && viewingStory.keywords.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="heading-secondary text-lg text-blue-900 mb-3">Vocabulary Words Used</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingStory.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 font-medium px-3 py-1">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Story Content */}
                  <div className="prose prose-xl max-w-none">
                    <div
                      className="story-content prose-enhanced"
                      dangerouslySetInnerHTML={{
                        __html: highlightStoryWords(viewingStory.content, viewingStory.keywords || [])
                      }}
                    />
                  </div>

                  {/* Story Actions */}
                  <div className="flex justify-center space-x-4 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => viewingStory && exportStory(viewingStory)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Story
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (viewingStory) {
                          handleEditStory(viewingStory);
                          closeStoryViewer();
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Story
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EnhancedStoryBuilder;
