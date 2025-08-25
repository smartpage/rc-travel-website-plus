import { useDesign } from "@/contexts/DesignContext";
import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  name: string;
  cardIds: string[];
}

interface TabNavProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  showNavigation?: boolean;
}

const TabNav = ({ tabs, activeTab, onTabChange, showNavigation = true }: TabNavProps) => {
  const { design } = useDesign();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start', 
    containScroll: 'trimSnaps', 
    loop: false,
    slidesToScroll: 1,
    skipSnaps: false
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    // Scroll to active tab on load and when activeTab changes
    const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (activeTabIndex !== -1) {
      emblaApi.scrollTo(activeTabIndex, true);
    }

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect, tabs, activeTab]);

  if (!showNavigation || tabs.length <= 1) {
    return null;
  }

  return (
    <div className="mb-12 w-full max-w-full min-w-0 overflow-hidden box-border @container">
      {/* Mobile Layout */}
      <div className="@md:hidden">
        <nav 
          data-component-type="tabNavigation"
          className="relative w-full max-w-full min-w-0 box-border"
        >
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 transition-colors disabled:opacity-30"
            style={{
              color: design.components?.tabNavigation?.arrows?.color,
              backgroundColor: design.components?.tabNavigation?.arrows?.backgroundColor,
              padding: design.components?.tabNavigation?.arrows?.padding
            }}
            aria-label="Previous tab"
          >
            <ChevronLeft 
              style={{
                width: design.components?.tabNavigation?.arrows?.size,
                height: design.components?.tabNavigation?.arrows?.size
              }}
            />
          </button>

          <div className="overflow-hidden w-full max-w-full min-w-0 px-4 box-border" ref={emblaRef}>
            <div className="flex w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const pillStyle = design.components?.tabNavigation?.pill;
                const containerStyle = design.components?.tabNavigation?.container;
                return (
                  <div key={tab.id} className="flex-shrink-0 w-auto min-w-0 mx-1">
                    <div 
                      className="rounded-lg p-1" 
                      style={{ 
                        backgroundColor: containerStyle?.backgroundColor,
                        borderRadius: containerStyle?.borderRadius,
                        padding: containerStyle?.padding
                      }}
                    >
                      <button
                        onClick={() => onTabChange(tab.id)}
                        className="w-full max-w-full transition-all duration-200"
                        style={{
                          fontFamily: design.tokens?.typography?.body?.fontFamily || 'Inter, sans-serif',
                          backgroundColor: isActive ? pillStyle?.backgroundColor : 'transparent',
                          color: pillStyle?.color,
                          padding: pillStyle?.padding,
                          borderRadius: pillStyle?.borderRadius,
                          fontSize: pillStyle?.fontSize,
                          fontWeight: pillStyle?.fontWeight
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
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 transition-colors disabled:opacity-30"
            style={{
              color: design.components?.tabNavigation?.arrows?.color,
              backgroundColor: design.components?.tabNavigation?.arrows?.backgroundColor,
              padding: design.components?.tabNavigation?.arrows?.padding
            }}
            aria-label="Next tab"
          >
            <ChevronRight 
              style={{
                width: design.components?.tabNavigation?.arrows?.size,
                height: design.components?.tabNavigation?.arrows?.size
              }}
            />
          </button>
        </nav>
      </div>

      {/* Desktop Layout */}
      <div className="hidden @md:flex @md:justify-center w-full max-w-full min-w-0 overflow-hidden">
        <nav 
          data-component-type="tabNavigation"
          className="inline-flex rounded-lg p-1" 
          style={{ 
            backgroundColor: design.components?.tabNavigation?.container?.backgroundColor || design.components?.button?.variants?.tab?.container?.backgroundColor || undefined,
            borderRadius: design.components?.tabNavigation?.container?.borderRadius || undefined,
            padding: design.components?.tabNavigation?.container?.padding || undefined
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const pillStyle = design.components?.tabNavigation?.pill;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="transition-all duration-200"
                style={{
                  fontFamily: design.tokens?.typography?.body?.fontFamily || 'Inter, sans-serif',
                  backgroundColor: isActive ? pillStyle?.backgroundColor : 'transparent',
                  color: pillStyle?.color,
                  padding: pillStyle?.padding,
                  borderRadius: pillStyle?.borderRadius,
                  fontSize: pillStyle?.fontSize,
                  fontWeight: pillStyle?.fontWeight
                }}
              >
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNav;
