
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Edit, Trash2, BookOpen, Volume2 } from "lucide-react";
import { toast } from "sonner";

const LibraryManager = () => {
  const [selectedLibrary, setSelectedLibrary] = useState("Master Library");
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Mock data
  const libraries = [
    { name: "Master Library", wordCount: 1247, learned: 789, icon: BookOpen },
    { name: "Academic Vocabulary", wordCount: 324, learned: 189, icon: BookOpen },
    { name: "Business Terms", wordCount: 156, learned: 98, icon: BookOpen },
    { name: "Creative Writing", wordCount: 203, learned: 145, icon: BookOpen }
  ];

  const words = [
    { word: "Serendipity", meaning: "A pleasant surprise", synonym: "Fortuity", antonym: "Misfortune", status: "learned" },
    { word: "Ephemeral", meaning: "Lasting for a short time", synonym: "Temporary", antonym: "Permanent", status: "unlearned" },
    { word: "Ubiquitous", meaning: "Present everywhere", synonym: "Omnipresent", antonym: "Rare", status: "learned" },
    { word: "Ameliorate", meaning: "Make better", synonym: "Improve", antonym: "Worsen", status: "unlearned" }
  ];

  const handleCSVUpload = () => {
    toast.success("CSV file uploaded successfully!");
    setShowUploadDialog(false);
  };

  const handleWordAction = (action: string, word: string) => {
    toast.success(`${action} action performed on "${word}"`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                My Libraries
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {libraries.map((library, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedLibrary === library.name
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedLibrary(library.name)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <library.icon className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">{library.name}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {library.wordCount} words • {library.learned} learned
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${(library.learned / library.wordCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedLibrary}</CardTitle>
                  <CardDescription>Manage your vocabulary collection</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload CSV File</DialogTitle>
                        <DialogDescription>
                          Upload a CSV file with columns: word, meaning, synonym, antonym
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">Drag and drop your CSV file here</p>
                          <Button variant="outline">Browse Files</Button>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCSVUpload}>Upload</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Word
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="table" className="w-full">
                <TabsList>
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="cards">Card View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="table" className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Word</th>
                          <th className="text-left p-3 font-medium">Meaning</th>
                          <th className="text-left p-3 font-medium">Synonym</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {words.map((word, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{word.word}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6"
                                  onClick={() => handleWordAction("pronounce", word.word)}
                                >
                                  <Volume2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="p-3 text-gray-600">{word.meaning}</td>
                            <td className="p-3 text-gray-600">{word.synonym}</td>
                            <td className="p-3">
                              <Badge variant={word.status === "learned" ? "default" : "secondary"}>
                                {word.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWordAction("edit", word.word)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWordAction("delete", word.word)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="cards" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {words.map((word, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{word.word}</CardTitle>
                            <Badge variant={word.status === "learned" ? "default" : "secondary"}>
                              {word.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div><strong>Meaning:</strong> {word.meaning}</div>
                            <div><strong>Synonym:</strong> {word.synonym}</div>
                            <div><strong>Antonym:</strong> {word.antonym}</div>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWordAction("pronounce", word.word)}
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWordAction("edit", word.word)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWordAction("delete", word.word)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LibraryManager;
