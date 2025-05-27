
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Volume2, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { toast } from "sonner";

const FlashcardLearning = () => {
  const [currentMode, setCurrentMode] = useState("revision");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showingSide, setShowingSide] = useState("meaning"); // meaning, synonym, antonym

  // Mock data
  const revisionCards = [
    {
      word: "Serendipity",
      meaning: "The occurrence and development of events by chance in a happy or beneficial way",
      synonym: "Fortuity, Chance",
      antonym: "Misfortune, Bad luck"
    },
    {
      word: "Ephemeral",
      meaning: "Lasting for a very short time",
      synonym: "Temporary, Fleeting",
      antonym: "Permanent, Lasting"
    }
  ];

  const surpriseCards = [
    {
      word: "Ubiquitous",
      meaning: "Present, appearing, or found everywhere",
      synonym: "Omnipresent, Universal",
      antonym: "Rare, Uncommon"
    },
    {
      word: "Ameliorate",
      meaning: "Make something bad or unsatisfactory better",
      synonym: "Improve, Enhance",
      antonym: "Worsen, Deteriorate"
    }
  ];

  const currentCards = currentMode === "revision" ? revisionCards : surpriseCards;
  const currentCard = currentCards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / currentCards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCardIndex < currentCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      toast.success("Session completed!");
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleModeChange = (mode: string) => {
    setCurrentMode(mode);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handlePronunciation = () => {
    toast.success(`Playing pronunciation for "${currentCard.word}"`);
  };

  const handleMarkKnown = () => {
    toast.success(`"${currentCard.word}" marked as known!`);
    handleNext();
  };

  const handleMarkUnknown = () => {
    toast.success(`"${currentCard.word}" marked for review!`);
    handleNext();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Mode Selection */}
        <div className="text-center">
          <Tabs value={currentMode} onValueChange={handleModeChange} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="revision">Revision Mode</TabsTrigger>
              <TabsTrigger value="surprise">Surprise Mode</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-gray-600 mt-2">
            {currentMode === "revision" 
              ? "Review words you've already learned" 
              : "Discover new words to expand your vocabulary"
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{currentCardIndex + 1} of {currentCards.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="relative">
          <div className="perspective-1000">
            <Card 
              className={`w-full h-96 cursor-pointer transition-transform duration-700 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              onClick={handleFlip}
            >
              {/* Front Side */}
              <div className={`absolute inset-0 backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                <CardContent className="h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
                  <div className="space-y-6">
                    <Badge variant="outline" className="mb-4">
                      {currentMode === "revision" ? "Learned Word" : "New Word"}
                    </Badge>
                    <h1 className="text-4xl font-bold text-gray-900">{currentCard.word}</h1>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePronunciation();
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Pronounce</span>
                    </Button>
                    <p className="text-gray-600">Click to reveal meaning</p>
                  </div>
                </CardContent>
              </div>

              {/* Back Side */}
              <div className={`absolute inset-0 backface-hidden rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                <CardContent className="h-full flex flex-col justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-100">
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentCard.word}</h2>
                      
                      {/* Toggle between meaning, synonym, antonym */}
                      <Tabs value={showingSide} onValueChange={setShowingSide} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="meaning">Meaning</TabsTrigger>
                          <TabsTrigger value="synonym">Synonym</TabsTrigger>
                          <TabsTrigger value="antonym">Antonym</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="meaning" className="mt-4">
                          <div className="text-lg text-gray-700 leading-relaxed">
                            {currentCard.meaning}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="synonym" className="mt-4">
                          <div className="text-lg text-gray-700">
                            <span className="font-medium">Synonyms: </span>
                            {currentCard.synonym}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="antonym" className="mt-4">
                          <div className="text-lg text-gray-700">
                            <span className="font-medium">Antonyms: </span>
                            {currentCard.antonym}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4 mt-6">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkUnknown();
                        }}
                        className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                        <span>Need Review</span>
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkKnown();
                        }}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        <span>I Know This</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
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
                setCurrentCardIndex(0);
              }}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart</span>
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentCardIndex === currentCards.length - 1}
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

export default FlashcardLearning;
