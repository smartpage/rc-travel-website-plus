import React from 'react';
import TravelPackageCard from './TravelPackageCard';
import TestimonialCard from './TestimonialCard';
import { useDesign } from '@/contexts/DesignContext';

// Generic card interface to support different card types
interface Card {
  id: string;
  name: string;
  image?: string;
  categoryIds: string[];
  [key: string]: any; // Allow any additional properties for different card types
}

interface CardGridProps {
  cards: Card[];
  cardType?: 'travel' | 'testimonial' | 'portfolio' | 'blog';
  gridLayout?: string;
  // Props specific to travel packages (optional)
  ctaText?: string;
  moreDetailsText?: string;
  onWhatsAppContact?: (packageName: string) => void;
}

const CardGrid = ({ 
  cards, 
  cardType = 'travel', 
  gridLayout = 'grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3',
  ctaText = 'Saber Mais', 
  moreDetailsText = 'mais detalhes', 
  onWhatsAppContact 
}: CardGridProps) => {
  const { design } = useDesign();
  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum conteúdo disponível.</p>
      </div>
    );
  }

  // Get responsive gap from design tokens
  const getGap = (): string => {
    if (cardType !== 'testimonial') return '2rem';
    const gapToken: any = design?.components?.testimonialCard?.gap;
    if (!gapToken) return '2rem';
    if (typeof gapToken === 'string') return gapToken;
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (width < 768) return gapToken.mobile ?? gapToken.tablet ?? gapToken.desktop ?? '2rem';
    if (width < 1024) return gapToken.tablet ?? gapToken.desktop ?? gapToken.mobile ?? '2rem';
    return gapToken.desktop ?? gapToken.tablet ?? gapToken.mobile ?? '2rem';
  };

  const [computedGap, setComputedGap] = React.useState<string>(getGap());

  React.useEffect(() => {
    const onResize = () => setComputedGap(getGap());
    onResize();
    if (typeof window !== 'undefined') window.addEventListener('resize', onResize);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('resize', onResize); };
  }, [design, cardType]);

  return (
    <div 
      className={`${gridLayout} w-full`}
      style={{ gap: computedGap }}
    >
      {cards.map((card, index) => {
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
  );
};

export default CardGrid;
