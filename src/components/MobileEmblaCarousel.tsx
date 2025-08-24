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
          <div className="flex" style={{ marginLeft: 'calc(-1 * var(--gap))', '--gap': gapCss } as React.CSSProperties}>
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex-none"
                style={{
                  marginLeft: 'var(--gap)',
                  width: 'calc((100% - 0 * var(--gap)) / 1)'
                } as React.CSSProperties}
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
