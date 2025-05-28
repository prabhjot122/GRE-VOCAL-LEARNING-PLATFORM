
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Upload, Plus, Edit, Trash2, BookOpen, Volume2, MoreHorizontal, Loader2, Search, X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/LibraryContext";
import { Library, Word } from "@/services/api";

const LibraryManager = () => {
  const {
    libraries,
    selectedLibrary,
    selectLibrary,
    isLoading,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    loadLibraryWords,
    addWord,
    updateWord,
    removeWord,
    markWordLearned,
    markWordUnlearned,
    uploadCSV
  } = useLibrary();

  // Local state for dialogs and forms
  const [showNewLibraryDialog, setShowNewLibraryDialog] = useState(false);
  const [showEditLibraryDialog, setShowEditLibraryDialog] = useState(false);
  const [showAddWordDialog, setShowAddWordDialog] = useState(false);
  const [showEditWordDialog, setShowEditWordDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [libraryToEdit, setLibraryToEdit] = useState<Library | null>(null);
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 100; // Fixed page size for better performance
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [newLibraryForm, setNewLibraryForm] = useState({ name: '', description: '' });
  const [editLibraryForm, setEditLibraryForm] = useState({ name: '', description: '' });
  const [wordForm, setWordForm] = useState({
    word: '',
    meaning: ''
  });

  // Use refs to store current values and avoid dependency issues
  const selectedLibraryRef = useRef(selectedLibrary);
  const searchQueryRef = useRef(searchQuery);
  const currentPageRef = useRef(currentPage);

  // Update refs when values change
  useEffect(() => { selectedLibraryRef.current = selectedLibrary; }, [selectedLibrary]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  // Combined effect for library changes and search
  useEffect(() => {
    if (!selectedLibraryRef.current) return;

    // If search query is empty, load without search (initial load or cleared search)
    if (!searchQuery || searchQuery.trim() === '') {
      setCurrentPage(1);
      loadLibraryWords(selectedLibraryRef.current.id, {
        page: 1,
        per_page: wordsPerPage
      });
      return;
    }

    // If there's a search query, debounce it
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadLibraryWords(selectedLibraryRef.current!.id, {
        page: 1,
        per_page: wordsPerPage,
        search: searchQuery
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedLibrary?.id, searchQuery, loadLibraryWords]); // Depend on library ID and search query

  // Handle page changes manually to avoid useEffect loops
  const handlePageChange = useCallback((newPage: number) => {
    if (!selectedLibraryRef.current) return;

    setCurrentPage(newPage);
    loadLibraryWords(selectedLibraryRef.current.id, {
      page: newPage,
      per_page: wordsPerPage,
      search: searchQueryRef.current || undefined
    });
  }, [loadLibraryWords]); // Removed wordsPerPage since it's now a constant

  // Get current words and pagination info
  const currentWords = selectedLibrary?.words || [];
  const pagination = selectedLibrary?.pagination;

  // Handler functions
  const handleCreateLibrary = async () => {
    if (!newLibraryForm.name.trim()) {
      toast.error('Library name is required');
      return;
    }

    const success = await createLibrary(newLibraryForm.name, newLibraryForm.description);
    if (success) {
      setNewLibraryForm({ name: '', description: '' });
      setShowNewLibraryDialog(false);
    }
  };

  const handleEditLibrary = async () => {
    if (!libraryToEdit || !editLibraryForm.name.trim()) {
      toast.error('Library name is required');
      return;
    }

    const success = await updateLibrary(libraryToEdit.id, editLibraryForm.name, editLibraryForm.description);
    if (success) {
      setEditLibraryForm({ name: '', description: '' });
      setLibraryToEdit(null);
      setShowEditLibraryDialog(false);
    }
  };

  const handleDeleteLibrary = async (library: Library) => {
    if (library.is_master) {
      toast.error('Cannot delete Master Library');
      return;
    }

    const success = await deleteLibrary(library.id);
    if (success) {
      // Library context will handle selecting a new library
    }
  };

  const handleAddWord = async () => {
    if (!wordForm.word.trim() || !wordForm.meaning.trim()) {
      toast.error('Word and meaning are required');
      return;
    }

    const success = await addWord(wordForm);
    if (success) {
      setWordForm({
        word: '',
        meaning: ''
      });
      setShowAddWordDialog(false);
    }
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const success = await uploadCSV(file);
    if (success) {
      setShowUploadDialog(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Google search functionality
  const searchWordOnGoogle = (word: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(word + ' meaning definition')}`;
    window.open(searchUrl, '_blank');
    toast.success(`Searching "${word}" on Google`);
  };

  const handleWordAction = async (action: string, word: Word) => {
    switch (action) {
      case 'learn':
        await markWordLearned(word.id);
        break;
      case 'unlearn':
        await markWordUnlearned(word.id);
        break;
      case 'edit':
        setWordToEdit(word);
        setWordForm({
          word: word.word,
          meaning: word.meaning
        });
        setShowEditWordDialog(true);
        break;
      case 'delete':
        await removeWord(word.id);
        break;
      case 'pronounce':
        // Text-to-speech functionality
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(word.word);
          speechSynthesis.speak(utterance);
        } else {
          toast.info('Text-to-speech not supported in this browser');
        }
        break;
      case 'google':
        searchWordOnGoogle(word.word);
        break;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-80 space-y-6">
          <div className="card-enhanced p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Libraries</h2>
                <p className="text-sm text-gray-600">Organize your vocabulary collection</p>
              </div>
              <Dialog open={showNewLibraryDialog} onOpenChange={setShowNewLibraryDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="btn-gradient shadow-medium hover:shadow-large">
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </DialogTrigger>
                  <DialogContent className="card-enhanced">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-gray-900">Create New Library</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Create a new vocabulary library to organize your words effectively.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 mt-6">
                      <div>
                        <Label htmlFor="library-name" className="text-sm font-semibold text-gray-700">Library Name</Label>
                        <Input
                          id="library-name"
                          value={newLibraryForm.name}
                          onChange={(e) => setNewLibraryForm({ ...newLibraryForm, name: e.target.value })}
                          placeholder="Enter library name"
                          className="mt-2 h-12 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="library-description" className="text-sm font-semibold text-gray-700">Description (Optional)</Label>
                        <Textarea
                          id="library-description"
                          value={newLibraryForm.description}
                          onChange={(e) => setNewLibraryForm({ ...newLibraryForm, description: e.target.value })}
                          placeholder="Enter library description"
                          className="mt-2 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                        />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={() => setShowNewLibraryDialog(false)} className="hover:bg-gray-50">
                          Cancel
                        </Button>
                        <Button onClick={handleCreateLibrary} disabled={isLoading} className="btn-gradient">
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Create Library
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

            <div className="space-y-3">
              {libraries.map((library) => (
                <div
                  key={library.id}
                  className={`group p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-medium ${
                    selectedLibrary?.id === library.id
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-gray-200 hover:border-primary/30 bg-white"
                  }`}
                  onClick={() => selectLibrary(library)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        selectedLibrary?.id === library.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-gray-900">{library.name}</span>
                        {library.is_master && <Badge variant="secondary" className="ml-2 text-xs bg-accent/10 text-accent border-accent/20">Master</Badge>}
                      </div>
                    </div>
                    {!library.is_master && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="card-enhanced">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setLibraryToEdit(library);
                              setEditLibraryForm({ name: library.name, description: library.description || '' });
                              setShowEditLibraryDialog(true);
                            }}
                            className="hover:bg-primary/5"
                          >
                            <Edit className="h-4 w-4 mr-2 text-primary" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLibrary(library);
                            }}
                            className="text-destructive hover:bg-destructive/5"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    <span className="font-medium">{library.word_count}</span> words • <span className="font-medium text-accent">{library.learned_count}</span> learned
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${library.word_count > 0 ? (library.learned_count / library.word_count) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="card-enhanced p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedLibrary?.name || 'No Library Selected'}</h1>
                <p className="text-gray-600 mt-1">Manage your vocabulary collection with powerful tools</p>
              </div>
              <div className="flex space-x-3">
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!selectedLibrary} className="hover:bg-primary/5 hover:border-primary/30 hover:text-primary">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload CSV
                    </Button>
                  </DialogTrigger>
                    <DialogContent className="card-enhanced max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">Upload CSV File</DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Upload any CSV file with vocabulary words. Our system will automatically detect which columns contain words and meanings.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 mt-6">
                        <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5 hover:bg-primary/10 transition-colors">
                          <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                          <p className="text-gray-700 mb-4 font-medium">Select your CSV file</p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleCSVUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="hover:bg-primary hover:text-white transition-all duration-200"
                          >
                            Browse Files
                          </Button>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline" onClick={() => setShowUploadDialog(false)} className="hover:bg-gray-50">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={showAddWordDialog} onOpenChange={setShowAddWordDialog}>
                    <DialogTrigger asChild>
                      <Button disabled={!selectedLibrary} className="btn-gradient">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Word
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="card-enhanced max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">Add New Word</DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Add a new word to {selectedLibrary?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 mt-6">
                        <div>
                          <Label htmlFor="word" className="text-sm font-semibold text-gray-700">Word Name *</Label>
                          <Input
                            id="word"
                            value={wordForm.word}
                            onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                            placeholder="Enter the word"
                            className="mt-2 h-12 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="meaning" className="text-sm font-semibold text-gray-700">Word Meaning *</Label>
                          <Textarea
                            id="meaning"
                            value={wordForm.meaning}
                            onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })}
                            placeholder="Enter the meaning or definition"
                            className="mt-2 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <Button variant="outline" onClick={() => setShowAddWordDialog(false)} className="hover:bg-gray-50">
                            Cancel
                          </Button>
                          <Button onClick={handleAddWord} disabled={isLoading} className="btn-gradient">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Add Word
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

            <div className="mt-8">
              {!selectedLibrary ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Library Selected</h3>
                  <p className="text-gray-600 max-w-md mx-auto">Choose a library from the sidebar to view and manage your vocabulary words</p>
                </div>
              ) : (
                <div>
                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search words and meanings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {searchQuery && pagination && (
                      <p className="text-sm text-gray-600 mt-2">
                        Found {pagination.total} word{pagination.total !== 1 ? 's' : ''} matching "{searchQuery}" • Showing {currentWords.length} on this page
                      </p>
                    )}
                    {pagination && !searchQuery && (
                      <p className="text-sm text-gray-600 mt-2">
                        Showing {currentWords.length} of {pagination.total} words
                      </p>
                    )}
                  </div>

                  <Tabs defaultValue="table" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
                      <TabsTrigger value="table" className="data-[state=active]:bg-primary data-[state=active]:text-white">Table View</TabsTrigger>
                      <TabsTrigger value="cards" className="data-[state=active]:bg-primary data-[state=active]:text-white">Card View</TabsTrigger>
                    </TabsList>

                    <TabsContent value="table" className="space-y-6">
                      {currentWords.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-soft">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left p-4 font-semibold text-gray-900">Word</th>
                                  <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                                  <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {currentWords.map((word: Word) => (
                                  <tr key={word.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                      <div className="flex items-center space-x-3">
                                        <span
                                          className="font-semibold capitalize text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                          onClick={() => handleWordAction("google", word)}
                                          title="Search on Google"
                                        >
                                          {word.word}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="p-1 h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                          onClick={() => handleWordAction("pronounce", word)}
                                          title="Pronounce word"
                                        >
                                          <Volume2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="p-1 h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                                          onClick={() => handleWordAction("google", word)}
                                          title="Search on Google"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <Badge
                                        variant={word.is_learned ? "default" : "secondary"}
                                        className={word.is_learned ? "bg-accent text-white" : "bg-gray-100 text-gray-700"}
                                      >
                                        {word.is_learned ? "Learned" : "Unlearned"}
                                      </Badge>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleWordAction(word.is_learned ? "unlearn" : "learn", word)}
                                          title={word.is_learned ? "Mark as unlearned" : "Mark as learned"}
                                          className={`h-8 w-8 ${word.is_learned ? 'text-warning hover:bg-warning/10' : 'text-accent hover:bg-accent/10'}`}
                                        >
                                          {word.is_learned ? "↺" : "✓"}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleWordAction("edit", word)}
                                          title="Edit word"
                                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleWordAction("delete", word)}
                                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                          title="Delete word"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            {searchQuery ? <Search className="h-12 w-12 text-gray-400" /> : <BookOpen className="h-12 w-12 text-gray-400" />}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No Words Found' : 'No Words Yet'}
                          </h3>
                          <p className="text-gray-600 mb-6">
                            {searchQuery
                              ? `No words match your search "${searchQuery}". Try a different search term.`
                              : 'Start building your vocabulary by adding your first word'
                            }
                          </p>
                          {searchQuery ? (
                            <Button onClick={() => setSearchQuery("")} variant="outline" className="hover:bg-primary hover:text-white">
                              <X className="h-4 w-4 mr-2" />
                              Clear Search
                            </Button>
                          ) : (
                            <Button onClick={() => setShowAddWordDialog(true)} className="btn-gradient">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Your First Word
                            </Button>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="cards" className="space-y-6">
                      {currentWords.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {currentWords.map((word: Word) => (
                            <div key={word.id} className="card-enhanced p-6 group hover:shadow-large transition-all duration-300 hover:-translate-y-1">
                              <div className="flex items-center justify-between mb-4">
                                <h3
                                  className="text-lg font-bold capitalize text-gray-900 group-hover:text-primary transition-colors cursor-pointer hover:text-blue-600 hover:underline"
                                  title="Click to search on Google"
                                  onClick={() => handleWordAction("google", word)}
                                >
                                  {word.word}
                                </h3>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                    onClick={() => handleWordAction("pronounce", word)}
                                    title="Pronounce word"
                                  >
                                    <Volume2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 h-8 w-8 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                    onClick={() => handleWordAction("google", word)}
                                    title="Search on Google"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <Badge
                                  variant={word.is_learned ? "default" : "secondary"}
                                  className={`w-fit ${word.is_learned ? "bg-accent text-white" : "bg-gray-100 text-gray-700"}`}
                                >
                                  {word.is_learned ? "Learned" : "Unlearned"}
                                </Badge>

                                <div className="space-y-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleWordAction(word.is_learned ? "unlearn" : "learn", word)}
                                    className={`w-full ${word.is_learned ? 'hover:bg-warning/10 hover:text-warning hover:border-warning' : 'hover:bg-accent/10 hover:text-accent hover:border-accent'} transition-all duration-200`}
                                  >
                                    {word.is_learned ? "Mark Unlearned" : "Mark Learned"}
                                  </Button>

                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleWordAction("edit", word)}
                                      className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200"
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleWordAction("delete", word)}
                                      className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-200"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            {searchQuery ? <Search className="h-12 w-12 text-gray-400" /> : <BookOpen className="h-12 w-12 text-gray-400" />}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No Words Found' : 'No Words Yet'}
                          </h3>
                          <p className="text-gray-600 mb-6">
                            {searchQuery
                              ? `No words match your search "${searchQuery}". Try a different search term.`
                              : 'Start building your vocabulary by adding your first word'
                            }
                          </p>
                          {searchQuery ? (
                            <Button onClick={() => setSearchQuery("")} variant="outline" className="hover:bg-primary hover:text-white">
                              <X className="h-4 w-4 mr-2" />
                              Clear Search
                            </Button>
                          ) : (
                            <Button onClick={() => setShowAddWordDialog(true)} className="btn-gradient">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Your First Word
                            </Button>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Pagination Controls */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-8 p-4 bg-gray-50 rounded-xl">
                      <div className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages} • {pagination.total} total words
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.has_prev || isLoading}
                          className="hover:bg-primary hover:text-white"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === pagination.page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isLoading}
                                className={`w-10 h-10 ${pageNum === pagination.page ? 'bg-primary text-white' : 'hover:bg-primary hover:text-white'}`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.has_next || isLoading}
                          className="hover:bg-primary hover:text-white"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Library Dialog */}
        <Dialog open={showEditLibraryDialog} onOpenChange={setShowEditLibraryDialog}>
          <DialogContent className="card-enhanced">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Edit Library</DialogTitle>
              <DialogDescription className="text-gray-600">
                Update the library name and description to better organize your vocabulary.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div>
                <Label htmlFor="edit-library-name" className="text-sm font-semibold text-gray-700">Library Name</Label>
                <Input
                  id="edit-library-name"
                  value={editLibraryForm.name}
                  onChange={(e) => setEditLibraryForm({ ...editLibraryForm, name: e.target.value })}
                  placeholder="Enter library name"
                  className="mt-2 h-12 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="edit-library-description" className="text-sm font-semibold text-gray-700">Description (Optional)</Label>
                <Textarea
                  id="edit-library-description"
                  value={editLibraryForm.description}
                  onChange={(e) => setEditLibraryForm({ ...editLibraryForm, description: e.target.value })}
                  placeholder="Enter library description"
                  className="mt-2 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditLibraryDialog(false)} className="hover:bg-gray-50">
                  Cancel
                </Button>
                <Button onClick={handleEditLibrary} disabled={isLoading} className="btn-gradient">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Library
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Word Dialog */}
        <Dialog open={showEditWordDialog} onOpenChange={setShowEditWordDialog}>
          <DialogContent className="card-enhanced max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">Edit Word</DialogTitle>
              <DialogDescription className="text-gray-600">
                Update the word details to improve your vocabulary learning experience.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div>
                <Label htmlFor="edit-word" className="text-sm font-semibold text-gray-700">Word Name *</Label>
                <Input
                  id="edit-word"
                  value={wordForm.word}
                  onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                  placeholder="Enter the word"
                  className="mt-2 h-12 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="edit-meaning" className="text-sm font-semibold text-gray-700">Word Meaning *</Label>
                <Textarea
                  id="edit-meaning"
                  value={wordForm.meaning}
                  onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })}
                  placeholder="Enter the meaning or definition"
                  className="mt-2 border-2 border-gray-200 focus:border-primary/50 rounded-xl"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditWordDialog(false)} className="hover:bg-gray-50">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (wordToEdit) {
                      const success = await updateWord(wordToEdit.id, wordForm);
                      if (success) {
                        setShowEditWordDialog(false);
                        setWordToEdit(null);
                        setWordForm({
                          word: '',
                          meaning: ''
                        });
                      }
                    }
                  }}
                  disabled={isLoading}
                  className="btn-gradient"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Word
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LibraryManager;
