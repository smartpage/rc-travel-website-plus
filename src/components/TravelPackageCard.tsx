import { useDesign } from "@/contexts/DesignContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { CheckCircle, MapPin, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TravelPackageCardProps {
  pkg: {
    id: string;
    name: string;
    image: string;
    price: {
      value: number;
      currency: string;
      type: string;
    };
    duration: string;
    description: string;
    includes: string[];
    availableDates: string[];
    categoryIds: string[];
  };
  ctaText: string;
  moreDetailsText: string;
  onWhatsAppContact: (packageName: string) => void;
}

const TravelPackageCard = ({ pkg, ctaText, moreDetailsText, onWhatsAppContact }: TravelPackageCardProps) => {
  const { design } = useDesign();
  const { travelPackageCard, colors, fonts, buttons } = design;

  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
    <Card 
      className={`bg-${colors.cardBackground} rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group`}
      style={{ height: travelPackageCard.maxHeight, minHeight: travelPackageCard.minHeight }}
    >
      <CardHeader 
        className="p-0 relative overflow-hidden"
        style={{ height: travelPackageCard.imageHeight }}
      >
        <div className="relative w-full h-full overflow-hidden">
          <img 
            src={pkg.image} 
            alt={pkg.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className={`absolute top-4 left-4 bg-${colors.accent} text-black text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm`}>
            {pkg.duration}
          </div>
        </div>
      </CardHeader>
      
      <CardContent 
        className="overflow-y-auto"
        style={{ flex: '1 1 auto', padding: travelPackageCard.contentPadding }}
      >
        <div className="flex items-start gap-2 mb-3">
          <MapPin className={`w-4 h-4 text-${colors.accent} mt-1 flex-shrink-0`} />
          <div>
            <CardTitle className={`text-xl font-bold text-${colors.text} leading-tight`} style={{ fontFamily: fonts.title }}>
              {pkg.name}
            </CardTitle>
            <p className={`text-sm text-${colors.textLight} mt-1`} style={{ fontFamily: fonts.body }}>{pkg.duration}</p>
          </div>
        </div>
        
        <p className={`text-${colors.text} mb-4 text-sm leading-relaxed line-clamp-2`} style={{ fontFamily: fonts.body }}>
          {pkg.description}
        </p>
        
        <div className="space-y-2 mb-4">
          {pkg.includes?.slice(0, 4).map((item, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className={`w-4 h-4 text-${colors.accent} mr-2 mt-0.5 flex-shrink-0`} />
              <span className={`text-${colors.text} text-sm`} style={{ fontFamily: fonts.body }}>{item}</span>
            </div>
          ))}
          <div className="flex items-start mt-2">
            <MessageCircle className={`w-4 h-4 text-${colors.highlight} mr-2 mt-0.5 flex-shrink-0`} />
            <span className={`text-${colors.highlight} text-sm font-normal`} style={{ fontFamily: fonts.body }}>{moreDetailsText}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter style={{ padding: travelPackageCard.contentPadding }}>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col items-start">
            <span className="text-sm font-light" style={{ fontFamily: fonts.body, color: colors.accent }}>{pkg.price?.type || 'Price'}</span>
            <span className="text-3xl font-medium" style={{ fontFamily: fonts.title, color: colors.text }}>
              {pkg.price?.currency || ''}{pkg.price?.value || 'N/A'}
            </span>
          </div>
          <Button 
            onClick={() => onWhatsAppContact(pkg.name)}
            className={`${buttons.primary.bg} ${buttons.primary.hover} ${buttons.primary.textColor} font-normal py-3 px-5 rounded-lg text-sm shadow-lg hover:shadow-yellow-600/30 transition-all duration-300`}
            style={{ fontFamily: fonts.body }}
          >
            {ctaText}
          </Button>
        </div>
      </CardFooter>
    </Card>
    </motion.div>
  );
};

export default TravelPackageCard;
