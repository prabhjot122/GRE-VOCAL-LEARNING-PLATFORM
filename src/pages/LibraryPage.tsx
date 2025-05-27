
import { BookOpen } from "lucide-react";
import LibraryManager from "@/components/LibraryManager";

const LibraryPage = () => {
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
              <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Dashboard</a>
              <a href="/library" className="text-blue-600 font-medium">Library</a>
              <a href="/stories" className="text-gray-600 hover:text-blue-600 transition-colors">Stories</a>
              <a href="/learn" className="text-gray-600 hover:text-blue-600 transition-colors">Learn</a>
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

      <LibraryManager />
    </div>
  );
};

export default LibraryPage;
