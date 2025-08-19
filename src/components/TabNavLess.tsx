import { useDesign } from "@/contexts/DesignContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Tab {
  id: string;
  name: string;
  cardIds: string[];
}

interface TabNavLessProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showNavigation?: boolean;
}

const TabNavLess: React.FC<TabNavLessProps> = ({ tabs, activeTab, onTabChange, showNavigation = true }) => {
  const { design } = useDesign();

  // Refs for scroll containers
  const mobileViewportRef = useRef<HTMLDivElement | null>(null);
  const desktopViewportRef = useRef<HTMLDivElement | null>(null);

  // Refs for each tab button to allow scroll-into-view
  const tabRefs = useMemo(() => new Map<string, HTMLButtonElement | null>(), []);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Touch/drag scrolling state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = mobileViewportRef.current;
    if (!el) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const scrollByAmount = useCallback((dir: -1 | 1) => {
    const el = mobileViewportRef.current;
    if (!el) return;
    const delta = Math.max(el.clientWidth * 0.8, 120);
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  }, []);

  // Touch/drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = mobileViewportRef.current;
    if (!el) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setScrollStart(el.scrollLeft);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const el = mobileViewportRef.current;
    if (!el) return;

    const currentX = e.touches[0].clientX;
    const deltaX = startX - currentX;
    el.scrollLeft = scrollStart + deltaX;
  }, [isDragging, startX, scrollStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse drag handlers (for desktop testing)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = mobileViewportRef.current;
    if (!el) return;
    
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollStart(el.scrollLeft);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const el = mobileViewportRef.current;
    if (!el) return;

    const currentX = e.clientX;
    const deltaX = startX - currentX;
    el.scrollLeft = scrollStart + deltaX;
  }, [isDragging, startX, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const el = mobileViewportRef.current;
    if (!el) return;

    updateScrollState();

    const onScroll = () => updateScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  // Global mouse event listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const el = mobileViewportRef.current;
      if (!el) return;

      const currentX = e.clientX;
      const deltaX = startX - currentX;
      el.scrollLeft = scrollStart + deltaX;
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, startX, scrollStart]);

  // Keep active tab in view
  useEffect(() => {
    const btn = tabRefs.get(activeTab);
    // Prefer mobile container for positioning; fallback to desktop container
    const container = mobileViewportRef.current ?? desktopViewportRef.current;
    if (btn && container) {
      // If the active button is partially outside, scroll it into view
      const btnRect = btn.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const isOutside = btnRect.left < contRect.left || btnRect.right > contRect.right;
      if (isOutside) {
        btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab, tabRefs]);

  if (!showNavigation || tabs.length <= 1) return null;

  const containerBg = design.buttons?.tab?.container?.backgroundColor || '#374151';

  return (
    <div className="mb-12 w-full overflow-hidden @container">
      {/* Mobile Layout */}
      <div className="@md:hidden">
        <div className="relative w-full overflow-hidden px-10">
          <button
            onClick={() => scrollByAmount(-1)}
            disabled={!canScrollPrev}
            className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 transition-colors disabled:opacity-30 ${design.sliderOptions.colors.arrows} ${design.sliderOptions.colors.arrowsHover}`}
            aria-label="Previous tab"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={mobileViewportRef}
            className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            <div className="inline-flex items-stretch gap-2 w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const buttonStyle = isActive ? design.buttons?.tab?.inverted : design.buttons?.tab?.regular;
                
                // Fallback styles if tokens aren't loaded yet
                const fallbackStyle = {
                  normal: {
                    backgroundColor: isActive ? '#eab308' : 'transparent',
                    textColor: isActive ? '#000000' : '#cbd5e1'
                  },
                  hover: {
                    backgroundColor: isActive ? '#d97706' : '#1f2937',
                    textColor: isActive ? '#000000' : '#ffffff'
                  }
                };
                
                const finalStyle = buttonStyle || fallbackStyle;
                
                return (
                  <div key={tab.id} className="flex-shrink-0">
                    <div className="rounded-lg p-1" style={{ backgroundColor: containerBg }}>
                      <button
                        ref={(el) => tabRefs.set(tab.id, el)}
                        onClick={(e) => {
                          if (isDragging) {
                            e.preventDefault();
                            return;
                          }
                          onTabChange(tab.id);
                        }}
                        className="whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
                        style={{
                          fontFamily: design.fonts.body,
                          backgroundColor: finalStyle?.normal?.backgroundColor || (isActive ? '#eab308' : 'transparent'),
                          color: finalStyle?.normal?.textColor || (isActive ? '#000000' : '#cbd5e1'),
                        }}
                        onMouseEnter={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.backgroundColor = finalStyle?.hover?.backgroundColor || (isActive ? '#d97706' : '#1f2937');
                          target.style.color = finalStyle?.hover?.textColor || (isActive ? '#000000' : '#ffffff');
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.backgroundColor = finalStyle?.normal?.backgroundColor || (isActive ? '#eab308' : 'transparent');
                          target.style.color = finalStyle?.normal?.textColor || (isActive ? '#000000' : '#cbd5e1');
                        }}
                      >
                        {tab.name}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => scrollByAmount(1)}
            disabled={!canScrollNext}
            className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 transition-colors disabled:opacity-30 ${design.sliderOptions.colors.arrows} ${design.sliderOptions.colors.arrowsHover}`}
            aria-label="Next tab"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden @md:flex @md:justify-center w-full overflow-x-auto">
        <div className="inline-flex rounded-lg p-1" style={{ backgroundColor: containerBg }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const buttonStyle = isActive ? design.buttons?.tab?.inverted : design.buttons?.tab?.regular;
            
            // Fallback styles if tokens aren't loaded yet
            const fallbackStyle = {
              normal: {
                backgroundColor: isActive ? '#eab308' : 'transparent',
                textColor: isActive ? '#000000' : '#cbd5e1'
              },
              hover: {
                backgroundColor: isActive ? '#d97706' : '#1f2937',
                textColor: isActive ? '#000000' : '#ffffff'
              }
            };
            
            const finalStyle = buttonStyle || fallbackStyle;
            return (
              <button
                key={tab.id}
                ref={(el) => tabRefs.set(tab.id, el)}
                onClick={(e) => {
                  if (isDragging) {
                    e.preventDefault();
                    return;
                  }
                  onTabChange(tab.id);
                }}
                className="px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 shrink-0"
                style={{
                  fontFamily: design.fonts.body,
                  backgroundColor: finalStyle?.normal?.backgroundColor || (isActive ? '#eab308' : 'transparent'),
                  color: finalStyle?.normal?.textColor || (isActive ? '#000000' : '#cbd5e1'),
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.backgroundColor = finalStyle?.hover?.backgroundColor || (isActive ? '#d97706' : '#1f2937');
                  target.style.color = finalStyle?.hover?.textColor || (isActive ? '#000000' : '#ffffff');
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.backgroundColor = finalStyle?.normal?.backgroundColor || (isActive ? '#eab308' : 'transparent');
                  target.style.color = finalStyle?.normal?.textColor || (isActive ? '#000000' : '#cbd5e1');
                }}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavLess;
