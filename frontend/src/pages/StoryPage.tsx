
import EnhancedStoryBuilder from "@/components/EnhancedStoryBuilder";
import { Header } from "@/components/layout/Header";

const StoryPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <EnhancedStoryBuilder />
    </div>
  );
};

export default StoryPage;
