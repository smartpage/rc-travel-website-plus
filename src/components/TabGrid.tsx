import { useState, useEffect, useCallback } from 'react';
import { useContent } from "@/contexts/ContentContext";
import { useDesign } from "@/contexts/DesignContext";
import useEmblaCarousel from 'embla-carousel-react';
import { type EmblaOptionsType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import TabNav from './TabNav';
import CardGrid from './CardGrid';

interface Tab {
  id: string;
  name: string;
  cardIds: string[];
}

// Generic card interface - can be travel package, testimonial, etc.
interface Card {
  id: string;
  name: string;
  image?: string;
  categoryIds: string[];
  [key: string]: any; // Allow any additional properties for different card types
}

interface TabGridContent {
  tabs: Tab[];
  cards: Card[];
}

interface TabGridProps {
  contentFile: string;
  showTabsNavigation?: boolean;
  cardType?: 'travel' | 'testimonial' | 'portfolio' | 'blog';
  gridLayout?: string;
  useSlider?: boolean;
  // Props specific to travel packages (optional)
  ctaText?: string;
  moreDetailsText?: string;
  onWhatsAppContact?: (packageName: string) => void;
}

const TabGrid = ({ 
  contentFile, 
  showTabsNavigation = true, 
  cardType = 'travel',
  gridLayout,
  useSlider = false,
  ctaText = 'Saber Mais', 
  moreDetailsText = 'mais detalhes', 
  onWhatsAppContact 
}: TabGridProps) => {
  const { getSectionContent } = useContent();
  const { design } = useDesign();
  const [activeTab, setActiveTab] = useState<string>('');
  const [content, setContent] = useState<TabGridContent | null>(null);
  
  // Embla carousel setup
  const emblaOptions: EmblaOptionsType = {
    loop: true,
    dragFree: design.sliderOptions.dragFree,
    containScroll: false,
    inViewThreshold: 0,
    align: 'start'
  };
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    emblaOptions,
    [design.sliderOptions.autoplay ? Autoplay({ delay: design.sliderOptions.autoplayDelay }) : undefined].filter(Boolean) as any
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  // Embla callbacks
  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );
  
  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);
  
  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, []);
  
  useEffect(() => {
    if (!emblaApi) return;
    
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  useEffect(() => {
    const loadTabGridContent = () => {
      console.log('🔍 TabGrid: Loading content for file:', contentFile);
      
      // Get content from ContentContext (Firebase only)
      const tabGridContent = getSectionContent<TabGridContent>(contentFile);
      console.log('🔍 TabGrid: Content from Firebase:', tabGridContent);
      
      if (tabGridContent && tabGridContent.tabs && tabGridContent.cards) {
        console.log('🔍 TabGrid: Setting content:', {
          tabsCount: tabGridContent.tabs.length,
          cardsCount: tabGridContent.cards.length
        });
        setContent(tabGridContent);
        // Set first tab as default active tab
        if (tabGridContent.tabs.length > 0) {
          setActiveTab(tabGridContent.tabs[0].id);
          console.log('🔍 TabGrid: Set active tab:', tabGridContent.tabs[0].id);
        }
      } else {
        console.warn('🔍 TabGrid: No content found in Firebase for:', contentFile);
      }
    };

    loadTabGridContent();
  }, [contentFile, getSectionContent]);

  if (!content) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando conteúdo...</p>
      </div>
    );
  }

  const { tabs, cards } = content;

  // Get cards for the active tab
  const activeTabObj = tabs.find(tab => tab.id === activeTab);
  const activeCards = activeTabObj 
    ? cards.filter(card => activeTabObj.cardIds.includes(card.id))
    : [];

  // Render slider if useSlider is true
  if (useSlider) {
    return (
      <div>
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showNavigation={showTabsNavigation}
        />
        
        {/* Embla Slider with Arrows */}
        <div className="relative mx-0 w-full">
          <button
            className={`hidden :block absolute -left-12 top-1/2 -translate-y-1/2 z-10 p-2 transition-colors disabled:opacity-30 ${design.sliderOptions.colors.arrows} ${design.sliderOptions.colors.arrowsHover}`}
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </button>
          <button
            className={`hidden :block absolute -right-12 top-1/2 -translate-y-1/2 z-10 p-2 transition-colors disabled:opacity-30 ${design.sliderOptions.colors.arrows} ${design.sliderOptions.colors.arrowsHover}`}
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          </button>
          <div className="overflow-hidden py-24 w-full" ref={emblaRef}>
          <div className="flex" style={{ marginLeft: `-${design.sliderOptions.gap}px` }}>
            {activeCards.map((card, index) => (
              <div
                key={card.id}
                className="flex-none w-[var(--slide-mobile-width,98%)] @md:w-1/2 @lg:w-1/3 @xl:w-1/4"
                style={{
                  marginLeft: `${design.sliderOptions.gap}px`,
                  // Allow tokenized control over mobile slide width
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  '--slide-mobile-width': (design as any)?.sliderOptions?.mobileCardWidth || '98%'
                } as React.CSSProperties}
              >
                <div className="h-full mx-auto">
                  <CardGrid
                    cards={[card]}
                    cardType={cardType}
                    gridLayout="grid-cols-1"
                    ctaText={ctaText}
                    moreDetailsText={moreDetailsText}
                    onWhatsAppContact={onWhatsAppContact}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        
        {/* Dots Navigation */}
        {design.sliderOptions.dots && scrollSnaps.length > 0 && (
          <div className="flex justify-center mt-6 space-x-2">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                className={`${(design as any)?.sliderOptions?.dotSizeClass || 'w-2.5 h-2.5'} rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? design.sliderOptions.colors.dotActive
                    : design.sliderOptions.colors.dotInactive
                }`}
                onClick={() => onDotButtonClick(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Default grid rendering
  return (
    <div>
      <TabNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showNavigation={showTabsNavigation}
      />
      
      <CardGrid
        cards={activeCards}
        cardType={cardType}
        gridLayout={gridLayout}
        ctaText={ctaText}
        moreDetailsText={moreDetailsText}
        onWhatsAppContact={onWhatsAppContact}
      />
    </div>
  );
};

export default TabGrid;
