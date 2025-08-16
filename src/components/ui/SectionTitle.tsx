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
  const headingConfig: HeadingConfig = (variant === 'hero_headings' && design.hero_headings)
    ? design.hero_headings
    : design.headings || {
    fontFamily: design.fonts.title,
    fontSize: '2.5rem',
    fontSizeMd: '3rem',
    fontSizeLg: '3.5rem',
    lineHeight: '1.2',
    fontWeight: '600',
    letterSpacing: 'normal',
    color: design.colors.headingColor || '#111827',
    marginBottom: '1rem',
    textAlign: 'center'
  };
  
  // Estilos responsivos para o título
  const subtitleStyles: React.CSSProperties = {
    fontFamily: design.preTitle?.fontFamily || design.fonts.body,
    fontSize: design.preTitle?.fontSize,
    fontWeight: design.preTitle?.fontWeight,
    color: subtitleColor || design.preTitle?.color || design.colors.textLight,
    marginBottom: design.preTitle?.marginBottom
  };

  const descriptionStyles: React.CSSProperties = {
    fontFamily: design.titleDescription?.fontFamily || design.fonts.body,
    fontSize: design.titleDescription?.fontSize,
    fontWeight: design.titleDescription?.fontWeight,
    color: descriptionColor || design.titleDescription?.color || design.colors.textLight,
    lineHeight: design.titleDescription?.lineHeight,
    marginTop: design.titleDescription?.marginTop
  };

  const titleStyles: React.CSSProperties = {
    fontFamily: headingConfig.fontFamily,
    fontSize: headingConfig.fontSize,
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
    @container (min-width: 768px) {
      #${uniqueId} {
        font-size: ${headingConfig.fontSizeMd || '3rem'} !important;
      }
    }
    @container (min-width: 1024px) {
      #${uniqueId} {
        font-size: ${headingConfig.fontSizeLg || '3.5rem'} !important;
      }
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
      
      <div className={`${centerAlign ? 'text-center' : ''} mb-12 md:mb-16 ${className}`}>
        {/* Subtitle */}
        {subtitle && (
          <p 
            style={subtitleStyles}
          >
            {subtitle}
          </p>
        )}
        
        {/* Main Title */}
        <h2 
          id={uniqueId}
          style={titleStyles}
          className="mt-2"
        >
          {renderTitleContent()}
        </h2>
        
        {/* Description */}
        {description && (
          <p 
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
