import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RotateCcw, Volume2, ChevronLeft, ChevronRight, Check, X, Play, BarChart3, BookOpen, Settings, Clock, Target, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/contexts/LibraryContext";
import { useLearning } from "@/contexts/LearningContext";

const EnhancedFlashcardLearning = () => {
  const { libraries, selectedLibrary, selectLibrary } = useLibrary();
  const {
    currentSession,
    isSessionActive,
    startFlashcardSession,
    startQuizSession,
    endSession,
    markWordKnown,
    markWordUnknown,
    nextCard,
    previousCard,
    playPronunciation,
    isAudioEnabled,
    toggleAudio,
    learningStats
  } = useLearning();

  // Local state
  const [isFlipped, setIsFlipped] = useState(false);
  const [showingSide, setShowingSide] = useState("meaning");
  const [selectedMode, setSelectedMode] = useState<'revision' | 'new' | 'mixed'>('revision');
  const [showStats, setShowStats] = useState(false);
  const [showSessionSetup, setShowSessionSetup] = useState(false);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentSession?.currentIndex]);

  // Computed values
  const currentCard = currentSession?.words[currentSession.currentIndex];
  const progress = currentSession ? ((currentSession.currentIndex + 1) / currentSession.words.length) * 100 : 0;
  const accuracy = currentSession && currentSession.totalAnswered > 0
    ? (currentSession.correctAnswers / currentSession.totalAnswered) * 100
    : 0;

  // Handler functions
  const handleStartSession = async (mode: 'revision' | 'new' | 'mixed') => {
    if (!selectedLibrary) {
      toast.error('Please select a library first');
      return;
    }

    const success = await startFlashcardSession(selectedLibrary.id, mode);
    if (success) {
      setShowSessionSetup(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentSession) {
      nextCard();
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentSession) {
      previousCard();
      setIsFlipped(false);
    }
  };

  const handleKnown = async () => {
    if (currentCard) {
      const success = await markWordKnown(currentCard.id);
      if (success) {
        handleNext();
      }
    }
  };

  const handleUnknown = async () => {
    if (currentCard) {
      const success = await markWordUnknown(currentCard.id);
      if (success) {
        handleNext();
      }
    }
  };

  const handlePronounce = () => {
    if (currentCard) {
      playPronunciation(currentCard.word);
    }
  };

  // Google search functionality
  const searchWordOnGoogle = (word: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(word + ' meaning definition')}`;
    window.open(searchUrl, '_blank');
    toast.success(`Searching "${word}" on Google`);
  };

  const handleEndSession = () => {
    endSession();
  };

  // If no session is active, show session setup
  if (!isSessionActive) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Flashcard Learning</h1>
            <p className="text-gray-600">Choose a library and learning mode to start your study session</p>
          </div>

          {/* Library Selection */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Select Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={selectedLibrary?.id.toString() || ''}
                onValueChange={(value) => {
                  const library = libraries.find(lib => lib.id.toString() === value);
                  if (library) selectLibrary(library);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a library" />
                </SelectTrigger>
                <SelectContent>
                  {libraries.map((library) => (
                    <SelectItem key={library.id} value={library.id.toString()}>
                      {library.name} ({library.word_count} words)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedLibrary && (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Words:</span>
                      <span>{selectedLibrary.word_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Learned:</span>
                      <span>{selectedLibrary.learned_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unlearned:</span>
                      <span>{selectedLibrary.unlearned_count}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Choose Learning Mode:</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handleStartSession('revision')}
                        variant="outline"
                        className="justify-start"
                        disabled={selectedLibrary.learned_count === 0}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Revision Mode ({selectedLibrary.learned_count} words)
                      </Button>
                      <Button
                        onClick={() => handleStartSession('new')}
                        variant="outline"
                        className="justify-start"
                        disabled={selectedLibrary.unlearned_count === 0}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        New Words ({selectedLibrary.unlearned_count} words)
                      </Button>
                      <Button
                        onClick={() => handleStartSession('mixed')}
                        variant="outline"
                        className="justify-start"
                        disabled={selectedLibrary.word_count === 0}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Mixed Mode ({selectedLibrary.word_count} words)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Stats */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Your Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Words Studied:</span>
                  <span>{learningStats.totalWordsStudied}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Spent:</span>
                  <span>{Math.round(learningStats.totalTimeSpent)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Accuracy:</span>
                  <span>{learningStats.averageAccuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Study Streak:</span>
                  <span>{learningStats.streakDays} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Active session view
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Session Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedLibrary?.name} - Flashcards
            </h1>
            <p className="text-gray-600">
              {currentSession?.mode === 'revision' ? 'Reviewing learned words' :
               currentSession?.mode === 'new' ? 'Learning new words' : 'Mixed practice'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={toggleAudio}>
              <Volume2 className={`h-4 w-4 ${isAudioEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>
              {currentSession?.currentIndex + 1} of {currentSession?.words.length}
              {currentSession && currentSession.totalAnswered > 0 && (
                <span className="ml-2">• {accuracy.toFixed(0)}% accuracy</span>
              )}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        {currentCard && (
          <div className="flex justify-center">
            <div className="flashcard-container w-full max-w-2xl h-96 cursor-pointer" onClick={handleFlip}>
              <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                <Card className="flashcard-front w-full h-full">
                  <CardContent className="h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
                    <div className="space-y-6">
                      <Badge variant="outline" className="mb-4">
                        {currentCard.is_learned ? "Learned Word" : "New Word"}
                      </Badge>
                      <h1
                        className="text-4xl font-bold text-gray-900 capitalize cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          searchWordOnGoogle(currentCard.word);
                        }}
                        title="Click to search on Google"
                      >
                        {currentCard.word}
                      </h1>
                      <div className="flex space-x-3">
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePronounce();
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Volume2 className="h-6 w-6 mr-2" />
                          Pronounce
                        </Button>
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            searchWordOnGoogle(currentCard.word);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <ExternalLink className="h-6 w-6 mr-2" />
                          Google
                        </Button>
                      </div>
                      <p className="text-gray-600 text-sm">Click to reveal meaning</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flashcard-back w-full h-full">
                  <CardContent className="h-full flex flex-col justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-100">
                    <div className="space-y-6">
                      <div className="text-center">
                        <h2
                          className="text-2xl font-bold text-gray-900 capitalize cursor-pointer hover:text-blue-600 hover:underline transition-colors inline-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            searchWordOnGoogle(currentCard.word);
                          }}
                          title="Click to search on Google"
                        >
                          {currentCard.word}
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            searchWordOnGoogle(currentCard.word);
                          }}
                          className="ml-2 text-green-600 hover:text-green-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-2">Meaning:</h3>
                          <p className="text-lg text-gray-800">{currentCard.meaning}</p>
                        </div>

                        {currentCard.synonym && (
                          <div>
                            <h3 className="font-semibold text-gray-700 mb-1">Synonyms:</h3>
                            <p className="text-gray-700">{currentCard.synonym}</p>
                          </div>
                        )}

                        {currentCard.antonym && (
                          <div>
                            <h3 className="font-semibold text-gray-700 mb-1">Antonyms:</h3>
                            <p className="text-gray-700">{currentCard.antonym}</p>
                          </div>
                        )}

                        {currentCard.example && (
                          <div>
                            <h3 className="font-semibold text-gray-700 mb-1">Example:</h3>
                            <p className="text-gray-700 italic">"{currentCard.example}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .flashcard-container {
            perspective: 1000px;
          }

          .flashcard {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.6s;
            transform-style: preserve-3d;
          }

          .flashcard.flipped {
            transform: rotateY(180deg);
          }

          .flashcard-front,
          .flashcard-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          .flashcard-back {
            transform: rotateY(180deg);
          }

          .flashcard-container:hover .flashcard {
            transform: scale(1.02);
          }

          .flashcard-container:hover .flashcard.flipped {
            transform: rotateY(180deg) scale(1.02);
          }
        `}</style>

        {/* Action Buttons */}
        {isFlipped && (
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleUnknown}
              variant="outline"
              size="lg"
              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <X className="h-5 w-5 mr-2" />
              Need Practice
            </Button>
            <Button
              onClick={handleKnown}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="h-5 w-5 mr-2" />
              I Know This
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSession?.currentIndex === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsFlipped(false);
              }}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Card</span>
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentSession && currentSession.currentIndex === currentSession.words.length - 1}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFlashcardLearning;
