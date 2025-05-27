
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Brain, Search, Volume2, Plus, TrendingUp, Target, Library } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedLibrary, setSelectedLibrary] = useState("Master Library");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - in real app this would come from database
  const metrics = {
    totalWords: 1247,
    selectedLibrary: {
      name: selectedLibrary,
      total: 324,
      learned: 189,
      unlearned: 135
    }
  };

  const wordOfTheDay = {
    word: "Serendipity",
    meaning: "The occurrence and development of events by chance in a happy or beneficial way",
    pronunciation: "/ˌserənˈdipədē/"
  };

  const recommendedWords = [
    { word: "Ephemeral", meaning: "Lasting for a very short time", status: "unlearned" },
    { word: "Ubiquitous", meaning: "Present, appearing, or found everywhere", status: "unlearned" },
    { word: "Ameliorate", meaning: "Make something bad or unsatisfactory better", status: "unlearned" },
    { word: "Perspicacious", meaning: "Having a ready insight into and understanding of things", status: "unlearned" }
  ];

  const handleWordClick = (word: string) => {
    toast.success(`Playing pronunciation for "${word}"`);
  };

  const markAsLearned = (word: string) => {
    toast.success(`"${word}" marked as learned!`);
  };

  const learnedPercentage = (metrics.selectedLibrary.learned / metrics.selectedLibrary.total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">VocabMaster</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-blue-600 font-medium">Dashboard</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Library</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Stories</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Learn</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Quiz</a>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Words</CardTitle>
              <Library className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalWords.toLocaleString()}</div>
              <p className="text-xs text-gray-500">Master Library</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Learning Progress</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.selectedLibrary.learned}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={learnedPercentage} className="flex-1" />
                <span className="text-xs text-gray-500">{Math.round(learnedPercentage)}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">of {metrics.selectedLibrary.total} words</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics.selectedLibrary.unlearned}</div>
              <p className="text-xs text-gray-500">words to learn</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
            />
          </div>
        </div>

        {/* Word of the Day */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">Word of the Day</CardTitle>
                <CardDescription className="text-blue-100">Expand your vocabulary daily</CardDescription>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <Brain className="h-8 w-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-3xl font-bold">{wordOfTheDay.word}</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleWordClick(wordOfTheDay.word)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  {wordOfTheDay.pronunciation}
                </Button>
              </div>
              <p className="text-lg text-blue-100">{wordOfTheDay.meaning}</p>
              <Button
                variant="secondary"
                onClick={() => markAsLearned(wordOfTheDay.word)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Library
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Words */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recommended for You</CardTitle>
            <CardDescription>Words selected from your unlearned collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendedWords.map((word, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 hover:border-blue-300 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {word.word}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {word.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">{word.meaning}</p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleWordClick(word.word)}
                      className="p-1 h-8 w-8"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsLearned(word.word)}
                      className="flex-1 text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                    >
                      Mark as Learned
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
