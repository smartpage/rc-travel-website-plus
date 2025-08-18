import { TokenMatch } from '@/contexts/EditorOverlayContext';
import { useDesign } from '@/contexts/DesignContext';

// Lightweight utility to compute CSS styles and map to global tokens heuristically.

export type ComputedSnapshot = {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  fontWeight?: string;
  letterSpacing?: string;
  color?: string;
  backgroundColor?: string;
  tagName: string;
};

export function takeComputedSnapshot(el: Element): ComputedSnapshot {
  const cs = window.getComputedStyle(el as Element);
  return {
    tagName: (el as HTMLElement).tagName,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    lineHeight: cs.lineHeight,
    fontWeight: cs.fontWeight,
    letterSpacing: cs.letterSpacing,
    color: cs.color,
    backgroundColor: cs.backgroundColor,
  };
}

// Heuristic comparators
function approxEq(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.replace(/\s+/g, '').toLowerCase() === b.replace(/\s+/g, '').toLowerCase();
}

function softContains(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
}

// Helper function to detect background context by traversing parent elements
function detectBackgroundContext(element: Element): 'light' | 'dark' | 'unknown' {
  let current = element.parentElement;
  
  while (current) {
    const classes = current.className || '';
    const computedStyle = window.getComputedStyle(current);
    
    // Check for explicit background classes
    if (classes.includes('bg-white') || classes.includes('bg-gray-') || classes.includes('bg-slate-1') || classes.includes('bg-light')) {
      return 'light';
    }
    if (classes.includes('bg-black') || classes.includes('bg-gray-9') || classes.includes('bg-dark')) {
      return 'dark';
    }
    
    // Check computed background color
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      // Parse RGB values to determine if light or dark
      const rgb = bgColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const [r, g, b] = rgb.map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? 'light' : 'dark';
      }
    }
    
    current = current.parentElement;
  }
  
  return 'unknown';
}

export function resolveGlobalTokens(snapshot: ComputedSnapshot, sectionId: string | null, design: any, element?: Element): TokenMatch[] {
  const matches: TokenMatch[] = [];
  let hasSpecificMatch = false; // Track if we found a highly specific match
  const bgContext: 'light' | 'dark' | 'unknown' = element ? detectBackgroundContext(element) : 'unknown';

  // 1) Hard hints via data-typography attribute take absolute priority
  if (element && (element as HTMLElement).dataset && (element as HTMLElement).dataset.typography) {
    const hint = (element as HTMLElement).dataset.typography;
    switch (hint) {
      case 'preTitle':
        matches.push({ scope: 'global', tokenPath: 'preTitle', label: 'Pre Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'titleDescription':
        matches.push({ scope: 'global', tokenPath: 'titleDescription', label: 'Title Description', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'serviceCard.title':
        matches.push({ scope: 'global', tokenPath: 'typography.serviceCardTitle', label: 'Service Card Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'serviceCard.description':
        matches.push({ scope: 'global', tokenPath: 'typography.serviceCardDescription', label: 'Service Card Description', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'whyCard.title':
        matches.push({ scope: 'global', tokenPath: 'typography.whyCardTitle', label: 'Why Card Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'whyCard.description':
        matches.push({ scope: 'global', tokenPath: 'typography.whyCardDescription', label: 'Why Card Description', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'travelDesignerCard':
        matches.push({ scope: 'global', tokenPath: 'typography.travelDesignerCard', label: 'Travel Designer Card Text', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'packageDescription':
        matches.push({ scope: 'global', tokenPath: 'typography.packageDescription', label: 'Package Description', responsive: false });
        hasSpecificMatch = true;
        break;
    }
  }

  // Text elements → headings / hero_headings / preTitle / titleDescription
  const isTextTag = ['H1','H2','H3','H4','H5','H6','P','SPAN','DIV'].includes(snapshot.tagName);
  const isHeadingTag = ['H1','H2','H3','H4','H5','H6'].includes(snapshot.tagName);
  
  if (isTextTag) {
    // Headings: always classify H1–H6 as headings. Prioritize hero headings inside hero section.
    if (isHeadingTag) {
      if (sectionId === 'hero' && design?.hero_headings) {
        matches.push({ scope: 'section', tokenPath: 'hero_headings', label: 'Hero Headings', responsive: true });
        hasSpecificMatch = true;
      } else if (design?.headings) {
        matches.push({ scope: 'global', tokenPath: 'headings', label: 'Headings', responsive: true });
        hasSpecificMatch = true;
      }
    }
    
    // PreTitle match (only for smaller text elements)
    if (!isHeadingTag && design?.preTitle) {
      const t = design.preTitle;
      if (snapshot.color && t.color && softContains(snapshot.color, t.color)) {
        matches.push({ scope: 'global', tokenPath: 'preTitle', label: 'PreTitle', responsive: false });
      }
    }
    
    // Body text match (for paragraph elements) - context-aware
    if (snapshot.tagName === 'P') {
      // Prefer cardBody for light backgrounds; fallback to body
      if (design?.typography?.cardBody && (bgContext === 'light')) {
        matches.push({ scope: 'global', tokenPath: 'typography.cardBody', label: 'Card Body Text', responsive: false });
        hasSpecificMatch = true;
      }
      if (!hasSpecificMatch && design?.typography?.body) {
        matches.push({ scope: 'global', tokenPath: 'typography.body', label: 'Body Text', responsive: false });
        hasSpecificMatch = true;
      }
    }
    
    // Title Description match (only for non-heading, non-paragraph elements)
    if (!isHeadingTag && snapshot.tagName !== 'P' && !hasSpecificMatch && design?.titleDescription) {
      const d = design.titleDescription;
      if (snapshot.lineHeight && d.lineHeight && approxEq(snapshot.lineHeight, d.lineHeight)) {
        matches.push({ scope: 'global', tokenPath: 'titleDescription', label: 'Title Description', responsive: false });
      }
    }
  }

  // Buttons/links → buttonStyles and buttons (only for actual buttons/links)
  const isButtonLike = ['A','BUTTON'].includes(snapshot.tagName);
  if (isButtonLike) {
    if (design?.buttonStyles) {
      // Only show button styles for button elements, not text
      matches.push({ scope: 'global', tokenPath: 'buttonStyles.primary', label: 'Button Primary', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'buttonStyles.secondary', label: 'Button Secondary', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'buttonStyles.tab', label: 'Button Tab', responsive: false });
    }
    if (design?.buttons) {
      matches.push({ scope: 'global', tokenPath: 'buttons.primary', label: 'Buttons Primary', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'buttons.secondary', label: 'Buttons Secondary', responsive: false });
      if (design?.buttons?.whatsapp) {
        matches.push({ scope: 'global', tokenPath: 'buttons.whatsapp', label: 'Buttons WhatsApp', responsive: false });
      }
    }
  }

  // Travel package card parts → travelPackageCard (by inline style hints)
  if (element && design?.travelPackageCard) {
    const el = element as HTMLElement;
    const s = el.style || ({} as CSSStyleDeclaration);
    const tpc = design.travelPackageCard;
    const looksLikeCardRoot =
      (s.height && approxEq(s.height, tpc.maxHeight)) ||
      (s.minHeight && approxEq(s.minHeight, tpc.minHeight));
    const looksLikeHeader = s.height && approxEq(s.height, tpc.imageHeight);
    const looksLikeContent = s.padding && approxEq(s.padding, tpc.contentPadding);
    if (looksLikeCardRoot || looksLikeHeader || looksLikeContent) {
      matches.push({ scope: 'global', tokenPath: 'travelPackageCard', label: 'Travel Package Card', responsive: false });
    }
  }

  // Section background tokens - detect when clicking on section container
  if (element && sectionId) {
    const sectionEl = element.closest('[data-section-id]') as HTMLElement | null;
    const isDirectSectionClick = sectionEl === element || sectionEl?.querySelector('.inner-section') === element;
    
    if (isDirectSectionClick && design?.sections?.[sectionId]) {
      // Add section layout background tokens
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.backgroundColor`, 
        label: 'Section Background Color', 
        responsive: false 
      });
      
      // Add inner section background tokens
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.backgroundColor`, 
        label: 'Inner Background Color', 
        responsive: false 
      });
      
      // Add background image token
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.background.value`, 
        label: 'Background Image URL', 
        responsive: false 
      });
      
      // Add overlay color token if overlay exists
      const sectionConfig = design.sections[sectionId];
      if (sectionConfig?.layout?.inner?.background?.overlay) {
        matches.push({ 
          scope: 'section', 
          tokenPath: `sections.${sectionId}.layout.inner.background.overlay.color`, 
          label: 'Background Overlay Color', 
          responsive: false 
        });
      }
      
      // Add section padding tokens (responsive)
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.padding`, 
        label: 'Section Padding', 
        responsive: true 
      });
    }
  }

  return matches;
}


