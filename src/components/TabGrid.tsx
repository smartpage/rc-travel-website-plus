import { useState, useEffect } from 'react';
import { useContent } from "@/contexts/ContentContext";
import { useDesign } from "@/contexts/DesignContext";
import useEmblaCarousel from 'embla-carousel-react';
import CardGrid from './CardGrid';
import MobileEmblaCarousel from './MobileEmblaCarousel';
import TabNavLess from './TabNavLess';
import TravelPackageCard from './TravelPackageCard';
import TestimonialCard from './TestimonialCard';

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

  // Embla carousel setup for slider
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    loop: false,
    containScroll: false,
  });


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
        <TabNavLess
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showNavigation={showTabsNavigation}
        />
        
        {/* Working Embla Slider like the old version */}
        <div className="relative mx-0 w-full">
          <div className="overflow-hidden py-24 w-full" ref={emblaRef}>
            <div className="flex items-stretch" style={{ marginLeft: `-${design.components?.slider?.gap || 16}px` }}>
              {activeCards.map((card, index) => (
                <div
                  key={card.id}
                  className="flex-none w-[var(--slide-mobile-width,90%)] @md:w-[45%] @lg:w-[60%] @xl:w-[45%] flex"
                  style={{
                    marginLeft: `${design.components?.slider?.gap || 16}px`,
                    '--slide-mobile-width': (design as any)?.components?.slider?.mobileCardWidth || '90%'
                  } as React.CSSProperties}
                >
                  <CardGrid
                    cards={[card]}
                    cardType={cardType}
                    gridLayout="grid-cols-1 h-full"
                    ctaText={ctaText}
                    moreDetailsText={moreDetailsText}
                    onWhatsAppContact={onWhatsAppContact}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Grid rendering with TabNav
  return (
    <div className="w-full">
      <TabNavLess
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showNavigation={showTabsNavigation}
      />
      
      {/* Direct grid like ServicesSection */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-8">
        {activeCards.map((card, index) => {
          switch (cardType) {
            case 'testimonial':
              return (
                <TestimonialCard
                  key={card.id || index}
                  testimonial={card as any}
                />
              );
              
            case 'travel':
            default:
              return (
                <TravelPackageCard
                  key={card.id || index}
                  pkg={card as any}
                  ctaText={ctaText!}
                  moreDetailsText={moreDetailsText!}
                  onWhatsAppContact={onWhatsAppContact!}
                />
              );
          }
        })}
      </div>
    </div>
  );
};

export default TabGrid;
