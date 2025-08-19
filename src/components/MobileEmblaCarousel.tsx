import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useDesign } from '@/contexts/DesignContext';
import CardGrid from './CardGrid';

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
  const gap = design.sliderOptions.gap || 16;

  // Keep options untyped to avoid versioned type conflicts
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    loop: false,
    containScroll: false,
  } as any);

  return (
    <div className="w-full max-w-full min-w-0">
      {/* Mobile-only slider */}
      <div className="@md:hidden w-full">
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

      {/* Grid fallback for @md+ */}
      <div className="hidden @md:block w-full">
        <CardGrid
          cards={cards as any}
          cardType={cardType}
          gridLayout={gridLayout}
          ctaText={ctaText}
          moreDetailsText={moreDetailsText}
          onWhatsAppContact={onWhatsAppContact}
        />
      </div>
    </div>
  );
};

export default MobileEmblaCarousel;
