import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useDesign } from '@/contexts/DesignContext';
import CardGrid from './CardGrid';
import TravelPackageCard from './TravelPackageCard';
import TestimonialCard from './TestimonialCard';

// Minimal props to render a mobile-only Embla with grid fallback on @md+
interface MobileEmblaCarouselProps {
  cards: Array<Record<string, any>>;
  cardType?: 'travel' | 'testimonial' | 'portfolio' | 'blog';
  gridLayout?: string;
  ctaText?: string;
  moreDetailsText?: string;
  onWhatsAppContact?: (packageName: string) => void;
}

const MobileEmblaCarousel: React.FC<MobileEmblaCarouselProps> = ({
  cards,
  cardType = 'travel',
  gridLayout,
  ctaText = 'Saber Mais',
  moreDetailsText = 'mais detalhes',
  onWhatsAppContact,
}) => {
  const { design } = useDesign();
  const gap = design.components?.slider?.gap || 16;

  // Keep options untyped to avoid versioned type conflicts
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    loop: false,
    containScroll: false,
  } as any);

  return (
    <div className="w-full">
      {/* Slider works on all screen sizes */}
      <div className="w-full">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex-none w-full px-4"
              >
                <div className="w-full max-w-sm mx-auto">
                  <CardGrid
                    cards={[card] as any}
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
    </div>
  );
};

export default MobileEmblaCarousel;
