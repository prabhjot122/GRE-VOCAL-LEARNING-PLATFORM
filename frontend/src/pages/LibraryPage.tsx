
import LibraryManager from "@/components/LibraryManager";
import { Header } from "@/components/layout/Header";

const LibraryPage = () => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <Header />
      <LibraryManager />
    </div>
  );
};

export default LibraryPage;
