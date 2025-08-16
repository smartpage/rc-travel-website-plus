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
import ViewportToggleOverlay from "@/components/ViewportToggleOverlay";
import EditorBridge from "@/components/EditorBridge";
import EditorPanelsWrapper from "@/components/EditorPanelsWrapper";

const queryClient = new QueryClient();

const App = () => {
  const isDesignMode = new URLSearchParams(window.location.search).get('design') === '1';

  return (
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
                  {isDesignMode ? (
                    // Design mode: overlays + site content in animated container
                    <>
                      <EditorPanelsWrapper />
                      <ViewportToggleOverlay>
                        {/* Site content will render inside ViewportToggleOverlay's container */}
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/test-zod-contexts" element={<ZodTestPage />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ViewportToggleOverlay>
                    </>
                  ) : (
                    // Normal mode: regular site
                    <>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/test-zod-contexts" element={<ZodTestPage />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </>
                  )}
                </BrowserRouter>
              </TooltipProvider>
            </ContentProvider>
          </SkeletonProvider>
        </DesignProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
