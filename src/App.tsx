import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DesignProvider } from "@/contexts/DesignContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { SkeletonProvider } from "@/components/SkeletonProvider";
import SiteMetadata from '@/components/SiteMetadata';

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ZodTestPage from "./pages/ZodTestPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <SiteMetadata />
      <DesignProvider>
        <SkeletonProvider>
          <ContentProvider>
            <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/test-zod-contexts" element={<ZodTestPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
            </TooltipProvider>
          </ContentProvider>
        </SkeletonProvider>
      </DesignProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
