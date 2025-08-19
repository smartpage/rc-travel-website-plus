import React, { ReactNode } from 'react';
import { useDesign } from '@/contexts/DesignContext';

// Component Props
interface SectionProps {
  children: ReactNode;
  sectionId: string;
  className?: string;
  id?: string; // For anchor links
  backgroundImageUrl?: string; // Allow overriding the background image
}

const Section: React.FC<SectionProps> = ({ children, sectionId, className, id, backgroundImageUrl }) => {
  const { design } = useDesign();

  // Get the configuration for the specific section, or fallback to default
  const config = design.sections[sectionId] || design.sections.default;

  if (!config) {
    console.error(`[Section] No configuration found for sectionId: ${sectionId}`);
    return null;
  }

  const { layout } = config;
  const { inner } = layout;
  // Use sectionId as the anchor ID for navigation, or fallback to custom id if provided
  const uniqueId = id || sectionId;

  // --- Style Objects ---
  const outerStyle: React.CSSProperties = {
    width: layout.width || '100%',
    maxWidth: layout.maxWidth,
    margin: (layout as any).margin || '0 auto',
    backgroundColor: layout.backgroundColor || design.colors.background,
    overflow: (layout as any).overflow,
  };

  const innerStyle: React.CSSProperties = {
    position: 'relative',
    width: (inner as any).width || '100%',
    minWidth: (inner as any).minWidth,
    maxWidth: inner.maxWidth,
    margin: inner.margin,
    backgroundColor: inner.backgroundColor,
    overflow: inner.overflow,
    borderRadius: inner.rounded ? (inner.borderRadius || '0.75rem') : '0',
    display: (inner as any).display,
    flexDirection: (inner as any).flexDirection,
    alignItems: (inner as any).alignItems,
    justifyContent: (inner as any).justifyContent,
    minHeight: (inner as any).minHeight,
    height: (inner as any).height,
    border: (inner as any).border,
    borderColor: (inner as any).borderColor,
    boxSizing: 'border-box', // Ensure proper box-sizing for width calculations
  };

  // --- Dynamic CSS Generation ---
  const generateDynamicCSS = () => {
    let css = `
      #${uniqueId} {
        padding: ${layout.padding.mobile};
        box-sizing: border-box;
      }
      #${uniqueId} > .inner-section {
        container-type: inline-size;
        padding: ${inner.padding.mobile};
        box-sizing: border-box;
        max-width: 100%;
        width: 100%;
        ${(inner as any).minWidth ? `min-width: ${(inner as any).minWidth};` : ''}
        ${(inner as any).minHeight ? `min-height: ${(inner as any).minHeight};` : ''}
        ${(inner as any).height ? `height: ${(inner as any).height};` : ''}
      }

      @container (min-width: 768px) {
        #${uniqueId} {
          padding: ${layout.padding.tablet};
          overflow-x: visible;
        }
        #${uniqueId} > .inner-section {
          padding: ${inner.padding.tablet};
          max-width: ${inner.maxWidth === '100%' ? '100%' : inner.maxWidth};
          width: ${(inner as any).width || '100%'};
          ${(inner as any).minWidth ? `min-width: ${(inner as any).minWidth};` : ''}
          ${(inner as any).minHeight ? `min-height: ${(inner as any).minHeight};` : ''}
          ${(inner as any).height ? `height: ${(inner as any).height};` : ''}
        }
      }

      @container (min-width: 1024px) {
        #${uniqueId} {
          padding: ${layout.padding.desktop};
        }
        #${uniqueId} > .inner-section {
          padding: ${inner.padding.desktop};
          max-width: ${inner.maxWidth === '100%' ? '100%' : inner.maxWidth};
          width: ${(inner as any).width || '100%'};
          ${(inner as any).minWidth ? `min-width: ${(inner as any).minWidth};` : ''}
          ${(inner as any).minHeight ? `min-height: ${(inner as any).minHeight};` : ''}
          ${(inner as any).height ? `height: ${(inner as any).height};` : ''}
        }
      }
    `;

    const imageUrl = backgroundImageUrl || inner.background.value;
    if (inner.background.type === 'image' && imageUrl) {
      css += `
        #${uniqueId} .inner-section {
          background-image: url('${imageUrl}');
          background-size: ${inner.background.styles?.objectFit || 'cover'};
          background-position: center;
          background-repeat: no-repeat;
        }
      `;
    }

    if (inner.background.overlay) {
      css += `
        #${uniqueId} .inner-section::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: ${inner.background.overlay.color};
          z-index: 1;
        }
      `;
    }

    // The children inside the inner section need to be on top of the overlay
    css += `
      #${uniqueId} .inner-section > * {
        position: relative;
        z-index: 2;
      }
    `;

    return css;
  };

  return (
    <>
      <style>{generateDynamicCSS()}</style>
      <section id={uniqueId} data-section-id={sectionId} style={outerStyle} className={className}>
        <div className="inner-section" style={innerStyle}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            {children}
          </div>
        </div>
      </section>
    </>
  );
};

export default Section;
