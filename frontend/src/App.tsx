
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { LearningProvider } from "@/contexts/LearningContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import Index from "./pages/Index";
import LibraryPage from "./pages/LibraryPage";
import LearnPage from "./pages/LearnPage";
import StoryPage from "./pages/StoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <LearningProvider>
            <GamificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/library" element={
                      <ProtectedRoute>
                        <LibraryPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/learn" element={
                      <ProtectedRoute>
                        <LearnPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/stories" element={
                      <ProtectedRoute>
                        <StoryPage />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </GamificationProvider>
          </LearningProvider>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
