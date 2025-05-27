
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Wand2, Save, Shuffle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const StoryGenerator = () => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [storyText, setStoryText] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [customCharacter, setCustomCharacter] = useState("");
  const [customScenario, setCustomScenario] = useState("");

  // Mock data
  const availableWords = {
    learned: ["Serendipity", "Ephemeral", "Ubiquitous", "Resilient", "Eloquent"],
    unlearned: ["Ameliorate", "Perspicacious", "Magnanimous", "Indefatigable", "Sagacious"]
  };

  const genres = [
    { name: "Fantasy", icon: "🧙‍♂️", description: "Magic and mythical creatures" },
    { name: "Sci-Fi", icon: "🚀", description: "Futuristic technology and space" },
    { name: "Mystery", icon: "🔍", description: "Puzzles and detective work" },
    { name: "Adventure", icon: "🗺️", description: "Exploration and excitement" },
    { name: "Romance", icon: "💕", description: "Love and relationships" },
    { name: "Thriller", icon: "⚡", description: "Suspense and danger" }
  ];

  const sampleStory = `In the bustling metropolis of tomorrow, Maya discovered the serendipity of finding an ancient artifact in the most ephemeral of moments. The ubiquitous technology that surrounded her daily life suddenly seemed insignificant compared to this mysterious object that would ameliorate her understanding of the past.

Her perspicacious nature led her to investigate further, and with magnanimous help from her mentor, she embarked on an indefatigable quest. The sagacious old professor had always told her that true discovery comes to those who remain resilient in the face of uncertainty.

As the neon lights of the city reflected off the artifact's surface, Maya realized that some treasures are found not through searching, but through remaining eloquent in one's curiosity and open to the unexpected gifts the universe provides.`;

  const mockImages = [
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=300&h=200&fit=crop"
  ];

  const handleWordToggle = (word: string) => {
    setSelectedWords(prev => 
      prev.includes(word) 
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
  };

  const handleGenerateStory = () => {
    if (selectedWords.length === 0) {
      toast.error("Please select at least one word to include in your story");
      return;
    }
    
    setStoryText(sampleStory);
    setGeneratedImages(mockImages);
    toast.success("Story generated successfully!");
  };

  const handleSaveStory = () => {
    toast.success("Story saved to your collection!");
  };

  const highlightWords = (text: string) => {
    let highlightedText = text;
    selectedWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">${word}</mark>`);
    });
    return highlightedText;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Story Generator</h1>
          <p className="text-gray-600">Create engaging stories using your vocabulary words</p>
        </div>

        {/* Story Creation Wizard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="h-5 w-5" />
              <span>Create Your Story</span>
            </CardTitle>
            <CardDescription>Follow the steps to generate a personalized story</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="words" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="words">1. Select Words</TabsTrigger>
                <TabsTrigger value="settings">2. Story Settings</TabsTrigger>
                <TabsTrigger value="generate">3. Generate Story</TabsTrigger>
              </TabsList>

              <TabsContent value="words" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Learned Words</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableWords.learned.map((word) => (
                        <Badge
                          key={word}
                          variant={selectedWords.includes(word) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-blue-100 px-3 py-1"
                          onClick={() => handleWordToggle(word)}
                        >
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Unlearned Words</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableWords.unlearned.map((word) => (
                        <Badge
                          key={word}
                          variant={selectedWords.includes(word) ? "default" : "secondary"}
                          className="cursor-pointer hover:bg-gray-100 px-3 py-1"
                          onClick={() => handleWordToggle(word)}
                        >
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="custom-words">Add Custom Words</Label>
                    <Input
                      id="custom-words"
                      placeholder="Enter additional words separated by commas"
                      className="mt-1"
                    />
                  </div>

                  {selectedWords.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">Selected Words ({selectedWords.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedWords.map((word) => (
                          <Badge key={word} variant="default" className="text-xs">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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

                  <Button variant="outline" className="w-full">
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generate Random Settings
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="generate" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Generate Your Story</h3>
                    <Button onClick={handleGenerateStory} className="flex items-center space-x-2">
                      <Wand2 className="h-4 w-4" />
                      <span>Generate Story</span>
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Your generated story will appear here, or you can write your own..."
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    className="min-h-[300px]"
                  />

                  {storyText && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Story Preview (with highlighted vocabulary)</h4>
                        <Button variant="outline" onClick={handleSaveStory}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Story
                        </Button>
                      </div>
                      
                      <div 
                        className="p-4 bg-gray-50 rounded-lg prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: highlightWords(storyText) }}
                      />

                      {generatedImages.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center space-x-2">
                            <ImageIcon className="h-4 w-4" />
                            <span>Related Images</span>
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {generatedImages.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`Story illustration ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoryGenerator;
