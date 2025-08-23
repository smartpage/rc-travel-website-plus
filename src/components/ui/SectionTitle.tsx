import React from 'react';
import { useDesign } from '@/contexts/DesignContext';

// Tipo para o design.headings
interface HeadingConfig {
  fontFamily: string;
  fontSize: string;
  fontSizeMd?: string;
  fontSizeLg?: string;
  lineHeight: string;
  fontWeight: string;
  letterSpacing: string;
  color: string;
  marginBottom?: string;
  textAlign?: string;
}

interface SectionTitleProps {
  // Escolher o tipo de heading
  variant?: 'headings' | 'hero_headings';
  
  // Textos
  subtitle?: string;
  title: string;
  description?: string;
  
  // Cores personalizadas (overrides)
  titleColor?: string;
  subtitleColor?: string;
  descriptionColor?: string;
  
  // Layout customizações
  className?: string;
  centerAlign?: boolean;
  
  // Renderização HTML (opcional para incluir formatação)
  useHtmlRendering?: boolean;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  variant = 'headings',
  subtitle,
  title,
  description,
  titleColor,
  subtitleColor,
  descriptionColor,
  className = '',
  centerAlign = true,
  useHtmlRendering = false
}) => {
  // Access design system
  const { design } = useDesign();
  
  // Get typography config from design based on variant
  const headingConfig: HeadingConfig = (variant === 'hero_headings' && (design.tokens?.typography?.hero_headings as any))
    ? (design.tokens?.typography?.hero_headings as any)
    : (design.tokens?.typography?.headings as any) || {
    fontFamily: design.tokens?.typography?.headings?.fontFamily,
    fontSize: '2.5rem',
    fontSizeMd: '3rem',
    fontSizeLg: '3.5rem',
    lineHeight: '1.2',
    fontWeight: '600',
    letterSpacing: 'normal',
    color: design.tokens?.colors?.headingColor || '#111827',
    marginBottom: '1rem',
    textAlign: 'center'
  };
  
  // Estilos responsivos para o título
  const subtitleStyles: React.CSSProperties = {
    fontFamily: design.tokens?.typography?.preTitle?.fontFamily || design.tokens?.typography?.body?.fontFamily,
    fontSize: design.tokens?.typography?.preTitle?.fontSize,
    fontWeight: design.tokens?.typography?.preTitle?.fontWeight,
    color: subtitleColor || design.tokens?.typography?.preTitle?.color || design.tokens?.colors?.textLight,
    marginBottom: design.tokens?.typography?.preTitle?.marginBottom
  };

  const descriptionStyles: React.CSSProperties = {
    fontFamily: design.tokens?.typography?.titleDescription?.fontFamily || design.tokens?.typography?.body?.fontFamily,
    fontSize: design.tokens?.typography?.titleDescription?.fontSize,
    fontWeight: design.tokens?.typography?.titleDescription?.fontWeight,
    color: descriptionColor || design.tokens?.typography?.titleDescription?.color || design.tokens?.colors?.textLight,
    lineHeight: design.tokens?.typography?.titleDescription?.lineHeight,
    marginTop: design.tokens?.typography?.titleDescription?.marginTop
  };

  const titleStyles: React.CSSProperties = {
    fontFamily: headingConfig.fontFamily,
    // Use CSS variable so media queries can override without !important
    fontSize: 'var(--heading-fs)',
    fontWeight: headingConfig.fontWeight,
    letterSpacing: headingConfig.letterSpacing,
    lineHeight: headingConfig.lineHeight,
    color: titleColor || headingConfig.color,
    marginBottom: headingConfig.marginBottom,
    textAlign: centerAlign ? 'center' : 'left',
    // Controle de overflow e quebra de palavras
    maxWidth: '100%',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    hyphens: 'auto'
  };
  
  // ID único para este componente
  const uniqueId = `title-${Math.random().toString(36).substr(2, 9)}`;
  
  // Container queries para responsividade
  const mediaQueryStyles = `
    /* Base variable for font size; allows responsive overrides without !important */
    #${uniqueId} { --heading-fs: ${headingConfig.fontSize}; }
    @container (min-width: 768px) {
      #${uniqueId} { --heading-fs: ${headingConfig.fontSizeMd || headingConfig.fontSize || '3rem'}; }
    }
    @container (min-width: 1024px) {
      #${uniqueId} { --heading-fs: ${headingConfig.fontSizeLg || headingConfig.fontSizeMd || headingConfig.fontSize || '3.5rem'}; }
    }
  `;

  // Função para renderizar HTML se necessário
  const renderTitleContent = () => {
    if (useHtmlRendering) {
      return <div dangerouslySetInnerHTML={{ __html: title }} />;
    }
    return title;
  };

  return (
    <>
      {/* Injetar CSS responsivo */}
      <style dangerouslySetInnerHTML={{ __html: mediaQueryStyles }} />
      
      <div className={`${centerAlign ? 'text-center' : ''} mb-12 md:mb-16 max-w-full overflow-x-hidden ${className}`}>
        {/* Subtitle */}
        {subtitle && (
          <p
            data-typography="preTitle"
            style={subtitleStyles}
          >
            {subtitle}
          </p>
        )}
        
        {/* Main Title */}
        <h1 
          id={uniqueId}
          style={titleStyles}
          className="mt-2 break-words"
        >
          {renderTitleContent()}
        </h1>
        
        {/* Description */}
        {description && (
          <p
            data-typography="titleDescription"
            className={`${centerAlign ? 'max-w-3xl mx-auto' : ''}`}
            style={descriptionStyles}
          >
            {description}
          </p>
        )}
      </div>
    </>
  );
};

export default SectionTitle;
