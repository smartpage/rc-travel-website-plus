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
import DesignInspectorOverlay from "@/components/DesignInspectorOverlay";
import ViewportToggleOverlay from "@/components/ViewportToggleOverlay";
import EditorBridge from "@/components/EditorBridge";

const queryClient = new QueryClient();

const App = () => {
  const isDesignMode = new URLSearchParams(window.location.search).get('design') === '1';
  const isEmbed = new URLSearchParams(window.location.search).get('embed') === '1';

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
                  {isDesignMode && !isEmbed ? (
                    // Design mode: only show overlays, no site content
                    <>
                      <DesignInspectorOverlay />
                      <ViewportToggleOverlay />
                    </>
                  ) : (
                    // Normal mode or embed mode: show site content
                    <>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/test-zod-contexts" element={<ZodTestPage />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      <EditorBridge />
                      {!isEmbed && (
                        <>
                          <DesignInspectorOverlay />
                          <ViewportToggleOverlay />
                        </>
                      )}
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
