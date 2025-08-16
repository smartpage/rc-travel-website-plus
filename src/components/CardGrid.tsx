import TravelPackageCard from './TravelPackageCard';
import TestimonialCard from './TestimonialCard';

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
  gridLayout = 'grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3',
  ctaText = 'Saber Mais', 
  moreDetailsText = 'mais detalhes', 
  onWhatsAppContact 
}: CardGridProps) => {
  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum conteúdo disponível.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridLayout} gap-8 h-full`}>
      {cards.map((card, index) => {
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
  );
};

export default CardGrid;
