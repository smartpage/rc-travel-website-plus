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
    people?: string;
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
  const travelPackageCard = (design.components as any)?.travelPackageCard || ({} as any);
  const colors = design.tokens?.colors || ({} as any);
  const fonts = design.tokens?.typography || ({} as any);

  return (
    <motion.div
      className="w-full max-w-full min-w-0 h-full"
      initial={{ opacity: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
    <Card 
      className={`w-full max-w-full rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group`}
      style={{ height: travelPackageCard.maxHeight, minHeight: travelPackageCard.minHeight, boxSizing: 'border-box', backgroundColor: colors.cardBackground }}
      data-card-type="travelPackageCard"
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
          {/* Pills: duration and people (content token) */}
          <div className="absolute top-4 left-4 flex flex-col items-start">
            <div className={`text-black text-xs font-semibold px-3 py-1.5 backdrop-blur-sm w-fit`} style={{ borderRadius: '12px 0px 12px 0px', backgroundColor: colors.accent }}>
              {pkg.duration}
            </div>
            {pkg.people && (
              <div className="bg-black text-white text-xs font-semibold px-3 py-1.5 backdrop-blur-sm w-fit" style={{ borderRadius: '0px 12px 0px 12px' }}>
                {pkg.people}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent 
        className="overflow-y-auto"
        style={{ flex: '1 1 auto', padding: travelPackageCard.contentPadding }}
      >
        <div className="flex items-start gap-2 mb-3">
          <MapPin className={`w-4 h-4 mt-1 flex-shrink-0`} style={{ color: colors.accent }} />
          <div>
            <CardTitle
              data-typography="travelPackageTitle"
              className="leading-tight"
              style={{
                fontFamily: design.tokens?.typography?.travelPackageTitle?.fontFamily || fonts.title,
                fontSize: design.tokens?.typography?.travelPackageTitle?.fontSize || '1.25rem',
                fontWeight: design.tokens?.typography?.travelPackageTitle?.fontWeight || '700',
                lineHeight: design.tokens?.typography?.travelPackageTitle?.lineHeight || '1.2',
                color: design.tokens?.typography?.travelPackageTitle?.color || colors.text
              }}
            >
              {pkg.name}
            </CardTitle>
          </div>
        </div>
        
        <p
          data-typography="packageDescription"
          className={`mb-4 line-clamp-2`}
          style={{
            fontFamily: design.tokens?.typography?.packageDescription?.fontFamily || fonts.body?.fontFamily,
            fontSize: design.tokens?.typography?.packageDescription?.fontSize || '1rem',
            lineHeight: design.tokens?.typography?.packageDescription?.lineHeight || '1.6',
            fontWeight: design.tokens?.typography?.packageDescription?.fontWeight || '400',
            color: design.tokens?.typography?.packageDescription?.color || `var(--text-color, white)`
          }}
        >
          {pkg.description}
        </p>
        
        <div className="space-y-2 mb-4">
          {pkg.includes?.slice(0, 4).map((item, index) => (
            <div key={index} className="flex items-start">
              <CheckCircle className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0`} style={{ color: colors.accent }} />
              <span className={`text-sm`} style={{ fontFamily: fonts.body, color: colors.text }}>{item}</span>
            </div>
          ))}
          <div className="flex items-start mt-2">
            <MessageCircle className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0`} style={{ color: colors.highlight }} />
            <span className={`text-sm font-normal`} style={{ fontFamily: fonts.body, color: colors.highlight }}>{moreDetailsText}</span>
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
            data-element="primaryButton"
            className="shadow-lg hover:shadow-yellow-600/30 transition-all duration-300"
            style={{
              backgroundColor: design.components?.button?.variants?.primary?.backgroundColor,
              color: design.components?.button?.variants?.primary?.textColor,
              borderColor: design.components?.button?.variants?.primary?.borderColor,
              fontFamily: design.components?.button?.variants?.primary?.fontFamily,
              fontSize: design.components?.button?.variants?.primary?.fontSize,
              fontWeight: design.components?.button?.variants?.primary?.fontWeight,
              padding: design.components?.button?.variants?.primary?.padding,
              borderRadius: design.components?.button?.variants?.primary?.borderRadius,
              borderWidth: design.components?.button?.variants?.primary?.borderWidth,
              borderStyle: 'solid'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColorHover || '';
              e.currentTarget.style.borderColor = design.components?.button?.variants?.primary?.borderColorHover || '';
              e.currentTarget.style.color = design.components?.button?.variants?.primary?.textColorHover || '';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColor || '';
              e.currentTarget.style.borderColor = design.components?.button?.variants?.primary?.borderColor || '';
              e.currentTarget.style.color = design.components?.button?.variants?.primary?.textColor || '';
            }}
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
