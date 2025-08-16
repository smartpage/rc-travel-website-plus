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
    align: 'center', 
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
    <div className="mb-12">
      {/* Mobile Layout */}
      <div className=":hidden">
        <div className="relative">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 transition-colors disabled:opacity-30 ${design.sliderOptions.colors.arrows} ${design.sliderOptions.colors.arrowsHover}`}
            aria-label="Previous tab"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="overflow-hidden mx-12" ref={emblaRef}>
            <div className="flex">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const buttonStyle = isActive ? design.buttonStyles.tab.inverted : design.buttonStyles.tab.regular;
                return (
                  <div key={tab.id} className="flex-shrink-0 basis-4/5 mx-2">
                    <div 
                      className="rounded-lg p-1" 
                      style={{ backgroundColor: design.buttonStyles.tab.container.backgroundColor }}
                    >
                      <button
                        onClick={() => onTabChange(tab.id)}
                        className="w-full px-4 py-2 text-sm font-medium rounded-md transition-all duration-200"
                        style={{
                          fontFamily: design.fonts.body,
                          backgroundColor: buttonStyle.normal.backgroundColor,
                          color: buttonStyle.normal.textColor,
                        }}
                        onMouseEnter={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.backgroundColor = buttonStyle.hover.backgroundColor;
                          target.style.color = buttonStyle.hover.textColor;
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.backgroundColor = buttonStyle.normal.backgroundColor;
                          target.style.color = buttonStyle.normal.textColor;
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
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 transition-colors disabled:opacity-30 ${design.sliderOptions.colors.arrows} ${design.sliderOptions.colors.arrowsHover}`}
            aria-label="Next tab"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden :flex :justify-center">
        <div 
          className="inline-flex rounded-lg p-1" 
          style={{ backgroundColor: design.buttonStyles.tab.container.backgroundColor }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const buttonStyle = isActive ? design.buttonStyles.tab.inverted : design.buttonStyles.tab.regular;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="px-6 py-3 text-sm font-medium rounded-md transition-all duration-200"
                style={{
                  fontFamily: design.fonts.body,
                  backgroundColor: buttonStyle.normal.backgroundColor,
                  color: buttonStyle.normal.textColor,
                }}
                onMouseEnter={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.backgroundColor = buttonStyle.hover.backgroundColor;
                  target.style.color = buttonStyle.hover.textColor;
                }}
                onMouseLeave={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.backgroundColor = buttonStyle.normal.backgroundColor;
                  target.style.color = buttonStyle.normal.textColor;
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

export default TabNav;
