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
            {(() => {
              const pickResponsiveGap = (token: any): string => {
                const toCss = (v: any): string => {
                  if (v == null) return '16px';
                  if (typeof v === 'number') return `${v}px`;
                  const s = String(v).trim();
                  if (s.endsWith('px')) return s;
                  if (s.endsWith('rem')) {
                    const n = parseFloat(s.replace('rem',''));
                    return `${isNaN(n) ? 1 : n * 16}px`;
                  }
                  const n = parseFloat(s);
                  return isNaN(n) ? '16px' : `${n}px`;
                };
                if (!token || typeof token !== 'object') return toCss(token);
                const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
                if (width < 768) return toCss(token.mobile ?? token.tablet ?? token.desktop);
                if (width < 1024) return toCss(token.tablet ?? token.desktop ?? token.mobile);
                return toCss(token.desktop ?? token.tablet ?? token.mobile);
              };
              const gapCss = pickResponsiveGap((design as any)?.components?.testimonialCard?.gap ?? (design as any)?.components?.slider?.gap ?? 16);

              const slidesToShow = (design as any)?.components?.slider?.slidesToShow || {};
              const nMobile = Number(slidesToShow.mobile) || 1;
              const nTablet = Number(slidesToShow.tablet) || 2;
              const nDesktop = Number(slidesToShow.desktop) || 2;

              const widthCalc = (n: number) => `calc((100% - ${(n - 1)} * var(--gap)) / ${Math.max(n, 1)})`;

              return (
                <div
                  className="flex items-stretch"
                  style={{ marginLeft: 'calc(-1 * var(--gap))', '--gap': gapCss } as React.CSSProperties}
                >
                  {activeCards.map((card, index) => (
                    <div
                      key={card.id}
                      className="flex-none flex w-[var(--slide-w-mobile)] @md:w-[var(--slide-w-tablet)] @lg:w-[var(--slide-w-desktop)]"
                      style={{
                        marginLeft: 'var(--gap)',
                        '--slide-w-mobile': widthCalc(nMobile),
                        '--slide-w-tablet': widthCalc(nTablet),
                        '--slide-w-desktop': widthCalc(nDesktop)
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
              );
            })()}
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
      <div 
        className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3"
        style={{ 
          gap: (() => {
            if (cardType !== 'testimonial') return '2rem';
            const gapToken: any = design?.components?.testimonialCard?.gap;
            if (!gapToken) return '2rem';
            if (typeof gapToken === 'string') return gapToken;
            const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
            if (width < 768) return gapToken.mobile ?? gapToken.tablet ?? gapToken.desktop ?? '2rem';
            if (width < 1024) return gapToken.tablet ?? gapToken.desktop ?? gapToken.mobile ?? '2rem';
            return gapToken.desktop ?? gapToken.tablet ?? gapToken.mobile ?? '2rem';
          })()
        }}
      >
        {activeCards.map((card, index) => {
          switch (cardType) {
            case 'testimonial':
              return (
                <div key={card.id || index} className="flex justify-center">
                  <TestimonialCard
                    testimonial={card as any}
                  />
                </div>
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
