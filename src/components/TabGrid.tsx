import { useState, useEffect } from 'react';
import { useContent } from "@/contexts/ContentContext";
import CardGrid from './CardGrid';
import MobileEmblaCarousel from './MobileEmblaCarousel';
import TabNavLess from './TabNavLess';

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
  const [activeTab, setActiveTab] = useState<string>('');
  const [content, setContent] = useState<TabGridContent | null>(null);


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
      <div className="w-full max-w-full min-w-0 overflow-x-hidden">
        <TabNavLess
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showNavigation={showTabsNavigation}
        />
        <MobileEmblaCarousel
          cards={activeCards as any}
          cardType={cardType}
          gridLayout={gridLayout}
          ctaText={ctaText}
          moreDetailsText={moreDetailsText}
          onWhatsAppContact={onWhatsAppContact}
        />
      </div>
    );
  }
  
  // Grid rendering with TabNav
  return (
    <div className="w-full max-w-full min-w-0">
      <TabNavLess
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
