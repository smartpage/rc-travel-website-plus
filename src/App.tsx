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
import EditorPanelsWrapper from "@/components/EditorPanelsWrapper";
import { EditorOverlayProvider } from "@/contexts/EditorOverlayContext";

const queryClient = new QueryClient();

const App = () => {
  const designParam = new URLSearchParams(window.location.search).get('design');
  const isDesignMode = designParam === '1' || designParam === 'true';

  return (
    <>
      {/* Global styles to remove ugly focus outlines */}
      <style>
        {`
          input:focus, button:focus, textarea:focus, select:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          
          /* Remove browser default focus highlight */
          *:focus {
            outline: none !important;
          }
        `}
      </style>
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
                  <EditorOverlayProvider>
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
                      // Normal mode: regular site with consistent container wrapper
                      <div className="@container" style={{ width: '100%', height: '100vh', overflow: 'auto' }}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/test-zod-contexts" element={<ZodTestPage />} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    )}
                  </EditorOverlayProvider>
                </BrowserRouter>
              </TooltipProvider>
            </ContentProvider>
          </SkeletonProvider>
        </DesignProvider>
      </SettingsProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
