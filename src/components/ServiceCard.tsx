import React from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ServiceCardProps {
  service: {
    id?: string;
    title: string;
    description: string;
    icon: string;
    featured?: boolean;
    image?: string;
    buttonText?: string;
    buttonLink?: string;
    specialStyling?: string;
    cardType?: 'standard' | 'highlight';
  };
  iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, iconMap }) => {
  const { design } = useDesign();
  if (!service) return null;
  const IconComponent = iconMap[service.icon as keyof typeof iconMap];

  // Resolve variant from v2 cardType, fallback to legacy specialStyling
  const variant: 'standard' | 'highlight' = (service.cardType as any) || (service.specialStyling === 'yellow-card' ? 'highlight' : 'standard');
  const variantTokens = (design.components as any)?.serviceCard?.variants?.[variant] || {};

  const handleButtonClick = () => {
    if (service.buttonLink) {
      // Open external links in new tab, internal links in same tab
      if (service.buttonLink.startsWith('http') || service.buttonLink.startsWith('https')) {
        window.open(service.buttonLink, '_blank');
      } else {
        window.location.href = service.buttonLink;
      }
    }
  };

  // Featured service with photo (must be explicitly true)
  if (service.featured === true && typeof service.image === 'string' && service.image.trim() !== '') {
    return (
      <Card className="relative overflow-hidden bg-gray-900 hover:bg-gray-800 transition-all duration-300 group min-h-[500px] rounded-2xl">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          style={{ backgroundImage: `url(${service.image})` }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        <div className="relative z-10 p-4 @md:p-8 @lg:p-12 h-full flex flex-col min-h-[500px]">
          {/* Icon at top */}
          <div className="mb-12">
            {IconComponent && <IconComponent className="w-12 h-12 text-white" />}
          </div>
          
          {/* Content at fixed position */}
          <div>
            {/* Yellow bar - using RC Travel's primary color */}
            <div className={`w-full h-1 bg-${design.tokens?.colors?.primary} mb-6`} />
            
            <h3
              data-typography="serviceCard.title"
              className={`${design.components?.primaryCards?.title?.base || ''} ${design.components?.primaryCards?.header?.spacing || ''}`}
              style={{
                fontFamily: design.tokens?.typography?.serviceCardTitle?.fontFamily || design.tokens?.typography?.headings?.fontFamily,
                fontSize: design.tokens?.typography?.serviceCardTitle?.fontSize || '1.5rem',
                fontWeight: design.tokens?.typography?.serviceCardTitle?.fontWeight || '300',
                lineHeight: design.tokens?.typography?.serviceCardTitle?.lineHeight || '1.2',
                letterSpacing: design.tokens?.typography?.serviceCardTitle?.letterSpacing,
                color: design.tokens?.typography?.serviceCardTitle?.color || 'white'
              }}
            >
              {service.title}
            </h3>
            <p
              data-typography="serviceCard.description"
              className={`${design.components?.primaryCards?.description?.spacing || ''}`}
              style={{
                fontFamily: design.tokens?.typography?.serviceCardDescription?.fontFamily || design.tokens?.typography?.body?.fontFamily,
                fontSize: design.tokens?.typography?.serviceCardDescription?.fontSize || '1.125rem',
                fontWeight: design.tokens?.typography?.serviceCardDescription?.fontWeight || '300',
                lineHeight: design.tokens?.typography?.serviceCardDescription?.lineHeight || '1.6',
                letterSpacing: design.tokens?.typography?.serviceCardDescription?.letterSpacing,
                color: design.tokens?.typography?.serviceCardDescription?.color || '#cbd5e1'
              }}
            >
              {service.description}
            </p>
            {service.buttonText && service.buttonText.trim() !== '' && (
              <Button
                onClick={handleButtonClick}
                data-element="primaryButton"
                className="mt-4 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
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
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColorHover || '';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = design.components?.button?.variants?.primary?.borderColorHover || '';
                  (e.currentTarget as HTMLButtonElement).style.color = design.components?.button?.variants?.primary?.textColorHover || '';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColor || '';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = design.components?.button?.variants?.primary?.borderColor || '';
                  (e.currentTarget as HTMLButtonElement).style.color = design.components?.button?.variants?.primary?.textColor || '';
                }}
              >
                {service.buttonText}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Special yellow card styling
  if (variant === 'highlight') {
    return (
      <Card className="relative overflow-hidden transition-all duration-300 group min-h-[500px] flex flex-col rounded-2xl" style={{ backgroundColor: variantTokens.backgroundColor }}>
        <div className="relative z-10 p-4 @md:p-8 @lg:p-12 h-full flex flex-col min-h-[500px]">
          {/* Icon at top */}
          <div className="mb-12">
            {IconComponent && <IconComponent className="w-12 h-12" style={{ color: variantTokens.textColor || '#000000' }} />}
          </div>
          
          {/* Content */}
          <div>
            {/* Black bar */}
            <div className="w-full h-1 mb-6" style={{ backgroundColor: variantTokens.headerBarColor || '#000000' }} />
            
            <h3
              data-typography="serviceCard.title"
              className={`${design.components?.primaryCards?.header?.spacing || ''}`}
              style={{
                fontFamily: design.tokens?.typography?.serviceCardTitle?.fontFamily || design.tokens?.typography?.headings?.fontFamily,
                fontSize: design.tokens?.typography?.serviceCardTitle?.fontSize || '1.5rem',
                fontWeight: design.tokens?.typography?.serviceCardTitle?.fontWeight || '300',
                lineHeight: design.tokens?.typography?.serviceCardTitle?.lineHeight || '1.2',
                letterSpacing: design.tokens?.typography?.serviceCardTitle?.letterSpacing,
                color: design.tokens?.typography?.serviceCardTitle?.color || '#000000'
              }}
            >
              {service.title}
            </h3>
            <p
              data-typography="serviceCard.description"
              className={`${design.components?.primaryCards?.description?.spacing || ''}`}
              style={{
                fontFamily: design.tokens?.typography?.serviceCardDescription?.fontFamily || design.tokens?.typography?.body?.fontFamily,
                fontSize: design.tokens?.typography?.serviceCardDescription?.fontSize || '1.125rem',
                fontWeight: design.tokens?.typography?.serviceCardDescription?.fontWeight || '300',
                lineHeight: design.tokens?.typography?.serviceCardDescription?.lineHeight || '1.6',
                letterSpacing: design.tokens?.typography?.serviceCardDescription?.letterSpacing,
                color: design.tokens?.typography?.serviceCardDescription?.color || variantTokens.textColor || '#000000'
              }}
            >
              {service.description}
            </p>
            
            {/* Button - Only render if buttonText exists */}
            {service.buttonText && (
              <button 
                onClick={handleButtonClick}
                data-element="primaryButton"
                className="transition-all duration-300"
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
                {service.buttonText}
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Regular service (no background image)
  return (
    <Card className="relative overflow-hidden transition-all duration-300 group min-h-[500px] flex flex-col rounded-2xl" style={{
      backgroundColor: variantTokens.backgroundColor || 'transparent',
      borderColor: variantTokens.borderColor || '#1f2937',
      borderWidth: variantTokens.borderWidth || '1px',
      borderStyle: 'solid',
      borderRadius: variantTokens.borderRadius || '1rem',
      boxShadow: variantTokens.shadow || 'none'
    }}>
      {/* Keep background layer transparent to avoid bleed */}
      <div className="absolute inset-0" style={{ backgroundImage: 'none' }} />
      <div className="relative z-10 p-4 @md:p-8 @lg:p-12 mb-12">
        {IconComponent && (
          <IconComponent className={`w-12 h-12 transition-colors duration-300`} style={{ color: '#9ca3af' }} />
        )}
      </div>
      <div className="relative z-10 p-4 @md:p-8 @lg:p-12 pt-0">
        <h3
          data-typography="serviceCard.title"
          className="mb-6"
          style={{
            fontFamily: design.tokens?.typography?.serviceCardTitle?.fontFamily || 'inherit',
            fontSize: design.tokens?.typography?.serviceCardTitle?.fontSize || '1.5rem',
            fontWeight: design.tokens?.typography?.serviceCardTitle?.fontWeight || '300',
            lineHeight: design.tokens?.typography?.serviceCardTitle?.lineHeight || '1.2',
            letterSpacing: design.tokens?.typography?.serviceCardTitle?.letterSpacing,
            color: design.tokens?.typography?.serviceCardTitle?.color || variantTokens.textColor || '#cbd5e1'
          }}
        >
          {service.title}
        </h3>
        <p
          data-typography="serviceCard.description"
          style={{
            fontFamily: design.tokens?.typography?.serviceCardDescription?.fontFamily || 'inherit',
            fontSize: design.tokens?.typography?.serviceCardDescription?.fontSize || '1.125rem',
            fontWeight: design.tokens?.typography?.serviceCardDescription?.fontWeight || '300',
            lineHeight: design.tokens?.typography?.serviceCardDescription?.lineHeight || '1.6',
            letterSpacing: design.tokens?.typography?.serviceCardDescription?.letterSpacing,
            color: design.tokens?.typography?.serviceCardDescription?.color || variantTokens.textColor || '#cbd5e1'
          }}
        >
          {service.description}
        </p>
        
        {/* Button - Only render if buttonText exists */}
        {service.buttonText && (
          <Button
            onClick={handleButtonClick}
            data-element="primaryButton"
            className="mt-6 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
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
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColorHover || '';
              (e.currentTarget as HTMLButtonElement).style.borderColor = design.components?.button?.variants?.primary?.borderColorHover || '';
              (e.currentTarget as HTMLButtonElement).style.color = design.components?.button?.variants?.primary?.textColorHover || '';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColor || '';
              (e.currentTarget as HTMLButtonElement).style.borderColor = design.components?.button?.variants?.primary?.borderColor || '';
              (e.currentTarget as HTMLButtonElement).style.color = design.components?.button?.variants?.primary?.textColor || '';
            }}
          >
            {service.buttonText}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ServiceCard;
