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
      className={`w-full max-w-full overflow-hidden flex flex-col group hover:shadow-xl`}
      style={{
        height: travelPackageCard.maxHeight,
        minHeight: travelPackageCard.minHeight,
        boxSizing: 'border-box',
        backgroundColor: travelPackageCard.backgroundColor || colors.cardBackground || '#ffffff',
        borderWidth: travelPackageCard.borderWidth || '1px',
        borderColor: travelPackageCard.borderColor || '#e5e7eb',
        borderStyle: 'solid',
        borderRadius: travelPackageCard.borderRadius || '8px',
        padding: travelPackageCard.padding || '16px',
        boxShadow: travelPackageCard.shadow || '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        transition: travelPackageCard.transition || 'all 0.3s ease',
        transform: 'translateY(0px)',
      }}
      onMouseEnter={(e) => {
        const transform = travelPackageCard.hoverTransform || 'translateY(-2px)';
        e.currentTarget.style.transform = transform;
        const hoverShadow = travelPackageCard.hoverShadow || '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)';
        e.currentTarget.style.boxShadow = hoverShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        const shadow = travelPackageCard.shadow || '0 4px 6px -1px rgb(0 0 0 / 0.1)';
        e.currentTarget.style.boxShadow = shadow;
      }}
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
        style={{ flex: '1 1 auto', padding: 0 }}
      >
        <div style={{ padding: travelPackageCard.innerPadding || '16px' }}>
        <div className="flex items-start gap-2 mb-3">
          <MapPin
            className={`w-4 h-4 mt-1 flex-shrink-0`}
            style={{ color: travelPackageCard.iconColors?.map || colors.accent }}
          />
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
              <CheckCircle
                className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0`}
                style={{ color: travelPackageCard.iconColors?.check || colors.accent }}
              />
              <span
                data-typography="travelPackageIncludes"
                className={`text-sm`}
                style={{
                  fontFamily: design.tokens?.typography?.travelPackageIncludes?.fontFamily || fonts.body,
                  fontSize: design.tokens?.typography?.travelPackageIncludes?.fontSize || '0.875rem',
                  color: design.tokens?.typography?.travelPackageIncludes?.color || colors.text
                }}
              >
                {item}
              </span>
            </div>
          ))}
          <div className="flex items-start mt-2">
            <MessageCircle
              className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0`}
              style={{ color: travelPackageCard.iconColors?.message || colors.highlight }}
            />
            <span
              data-typography="travelPackageIncludes"
              className={`text-sm font-normal`}
              style={{
                fontFamily: design.tokens?.typography?.travelPackageIncludes?.fontFamily || fonts.body,
                fontSize: design.tokens?.typography?.travelPackageIncludes?.fontSize || '0.875rem',
                color: design.tokens?.typography?.travelPackageIncludes?.color || colors.highlight
              }}
            >
              {moreDetailsText}
            </span>
          </div>
        </div>
        </div>
      </CardContent>
      
      <CardFooter style={{ padding: travelPackageCard.innerPadding || '16px', backgroundColor: 'inherit' }}>
        <div className="flex justify-between items-center w-full">
          <div
            className="flex items-start"
            style={{
              display: 'flex',
              flexDirection: travelPackageCard.priceGroup?.direction || 'column',
              gap: travelPackageCard.priceGroup?.gap || '0.25rem'
            }}
          >
            <span
              data-typography="travelPackagePriceType"
              className="text-sm font-light"
              style={{
                fontFamily: design.tokens?.typography?.travelPackagePriceType?.fontFamily || fonts.body,
                fontSize: design.tokens?.typography?.travelPackagePriceType?.fontSize || '0.875rem',
                color: design.tokens?.typography?.travelPackagePriceType?.color || colors.accent
              }}
            >
              {pkg.price?.type || 'Price'}
            </span>
            <span
              data-typography="travelPackagePriceValue"
              className="text-3xl font-medium"
              style={{
                fontFamily: design.tokens?.typography?.travelPackagePriceValue?.fontFamily || fonts.title,
                fontSize: design.tokens?.typography?.travelPackagePriceValue?.fontSize || '1.25rem',
                color: design.tokens?.typography?.travelPackagePriceValue?.color || colors.text
              }}
            >
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
