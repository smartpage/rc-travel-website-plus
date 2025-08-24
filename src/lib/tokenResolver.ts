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

  // 0) Component-level matches by data-element wrappers
  if (element && (element as HTMLElement).dataset && (element as HTMLElement).dataset.element === 'primaryButton') {
    // Primary button tokens
    const btn = design?.components?.button?.variants?.primary;
    if (btn) {
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary.backgroundColor', label: 'Primary Button Background', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary.textColor', label: 'Primary Button Text', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary.borderColor', label: 'Primary Button Border', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary.fontSize', label: 'Primary Button Font Size', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary.fontWeight', label: 'Primary Button Font Weight', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary.padding', label: 'Primary Button Padding', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary.borderRadius', label: 'Primary Button Border Radius', responsive: false });
    }
    hasSpecificMatch = true;
  }
  
  if (element && (element as HTMLElement).dataset && (element as HTMLElement).dataset.element === 'secondaryButton') {
    // Secondary button tokens
    const btn = design?.components?.button?.variants?.secondary;
    if (btn) {
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary.backgroundColor', label: 'Secondary Button Background', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary.textColor', label: 'Secondary Button Text', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary.borderColor', label: 'Secondary Button Border', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary.fontSize', label: 'Secondary Button Font Size', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary.fontWeight', label: 'Secondary Button Font Weight', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary.padding', label: 'Secondary Button Padding', responsive: false });
      matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary.borderRadius', label: 'Secondary Button Border Radius', responsive: false });
    }
    hasSpecificMatch = true;
  }

  // 1) Hard hints via data-typography attribute take absolute priority
  if (element && (element as HTMLElement).dataset && (element as HTMLElement).dataset.typography) {
    const hint = (element as HTMLElement).dataset.typography;
    switch (hint) {
      case 'testimonialCard.title':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.testimonialCardTitle', label: 'Testimonial Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'testimonialCard.location':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.testimonialCardLocation', label: 'Testimonial Location', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'testimonialCard.body':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.testimonialCardBody', label: 'Testimonial Body', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'preTitle':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.preTitle', label: 'Pre Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'titleDescription':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.titleDescription', label: 'Title Description', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'serviceCard.title':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.serviceCardTitle', label: 'Service Card Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'serviceCard.description':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.serviceCardDescription', label: 'Service Card Description', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'whyCard.title':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.whyCardTitle', label: 'Why Card Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'whyCard.description':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.whyCardDescription', label: 'Why Card Description', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'contactCard.title':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.contactCardTitle', label: 'Contact Card Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'contactCard.body':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.contactCardBody', label: 'Contact Card Body', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'contactCard.icon':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.contactCardIcon.color', label: 'Contact Card Icon Color', responsive: false });
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.contactCardIcon.size', label: 'Contact Card Icon Size', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'headings':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.headings', label: 'Headings', responsive: true });
        hasSpecificMatch = true;
        break;
      case 'hero_headings':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.hero_headings', label: 'Hero Headings', responsive: true });
        hasSpecificMatch = true;
        break;
      case 'travelDesignerCard':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.travelDesignerCard', label: 'Travel Designer Card Text', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'packageDescription':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.packageDescription', label: 'Package Description', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'travelPackageTitle':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.travelPackageTitle', label: 'Travel Package Title', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'faq.question':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.faqQuestion', label: 'FAQ Question', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'faq.answer':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.faqAnswer', label: 'FAQ Answer', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'faqCardQuestion':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.faqCardQuestion', label: 'FAQ Card Question', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'faqCardAnswer':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.faqCardAnswer', label: 'FAQ Card Answer', responsive: false });
        hasSpecificMatch = true;
        break;
      case 'faq.answerStrong':
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.faqAnswerStrong', label: 'FAQ Answer Strong', responsive: false });
        hasSpecificMatch = true;
        break;
    }
  }

  // Text elements → headings / hero_headings / preTitle / titleDescription
  const isTextTag = ['H1','H2','H3','H4','H5','H6','P','SPAN','DIV'].includes(snapshot.tagName);
  const isHeadingTag = ['H1','H2','H3','H4','H5','H6'].includes(snapshot.tagName);
  
  if (isTextTag) {
    const insideCard = !!element?.closest('[data-card-type]');
    // Headings: always classify H1–H6 as headings. Prioritize hero headings inside hero section.
    if (isHeadingTag) {
      if (sectionId === 'hero' && design?.tokens?.typography?.hero_headings) {
        matches.push({ scope: 'section', tokenPath: 'tokens.typography.hero_headings', label: 'Hero Headings', responsive: true });
        hasSpecificMatch = true;
      } else if (!insideCard && design?.tokens?.typography?.headings) {
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.headings', label: 'Headings', responsive: true });
        hasSpecificMatch = true;
      }
    }
    
    // PreTitle match (only for smaller text elements)
    if (!isHeadingTag && design?.tokens?.typography?.preTitle) {
      const t = design.tokens.typography.preTitle as any;
      if (snapshot.color && t.color && softContains(snapshot.color, t.color)) {
        matches.push({ scope: 'global', tokenPath: 'preTitle', label: 'PreTitle', responsive: false });
      }
    }
    
    // Body text match (for paragraph elements) - context-aware
    if (snapshot.tagName === 'P') {
      // Prefer cardBody for light backgrounds; fallback to body
      if (!insideCard && design?.tokens?.typography?.cardBody && (bgContext === 'light')) {
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.cardBody', label: 'Card Body Text', responsive: false });
        hasSpecificMatch = true;
      }
      if (!insideCard && !hasSpecificMatch && design?.tokens?.typography?.body) {
        matches.push({ scope: 'global', tokenPath: 'tokens.typography.body', label: 'Body Text', responsive: false });
        hasSpecificMatch = true;
      }
    }
    
    // Title Description match (only for non-heading, non-paragraph elements)
    if (!isHeadingTag && snapshot.tagName !== 'P' && !hasSpecificMatch && design?.tokens?.typography?.titleDescription) {
      const d = design.tokens.typography.titleDescription as any;
      if (snapshot.lineHeight && d.lineHeight && approxEq(snapshot.lineHeight, d.lineHeight)) {
        matches.push({ scope: 'global', tokenPath: 'titleDescription', label: 'Title Description', responsive: false });
      }
    }
  }

  // Buttons/links → buttonStyles and buttons (only for actual buttons/links)
  const isButtonLike = ['A','BUTTON'].includes(snapshot.tagName);
  if (isButtonLike) {
    const btn = design?.components?.button?.variants;
    if (btn?.primary) matches.push({ scope: 'global', tokenPath: 'components.button.variants.primary', label: 'Buttons Primary', responsive: false });
    if (btn?.secondary) matches.push({ scope: 'global', tokenPath: 'components.button.variants.secondary', label: 'Buttons Secondary', responsive: false });
    if (btn?.tab) matches.push({ scope: 'global', tokenPath: 'components.button.variants.tab', label: 'Buttons Tab', responsive: false });
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
    const innerSection = sectionEl?.querySelector('.inner-section') as HTMLElement | null;
    const isDirectSectionClick = sectionEl === element || innerSection === element;
    
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
      
      // Add inner section padding tokens (responsive)
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.padding`, 
        label: 'Inner Padding', 
        responsive: true 
      });

      // Add inner width tokens
      matches.push({
        scope: 'section',
        tokenPath: `sections.${sectionId}.layout.inner.width`,
        label: 'Inner Width',
        responsive: false,
      });

      matches.push({
        scope: 'section',
        tokenPath: `sections.${sectionId}.layout.inner.maxWidth`,
        label: 'Inner Max Width',
        responsive: false,
      });

      matches.push({
        scope: 'section',
        tokenPath: `sections.${sectionId}.layout.inner.minWidth`,
        label: 'Inner Min Width',
        responsive: false,
      });

      // Add inner height tokens
      matches.push({
        scope: 'section',
        tokenPath: `sections.${sectionId}.layout.inner.minHeight`,
        label: 'Inner Min Height',
        responsive: false,
      });

      matches.push({
        scope: 'section',
        tokenPath: `sections.${sectionId}.layout.inner.height`,
        label: 'Inner Height',
        responsive: false,
      });

      // Add flex layout tokens
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.display`, 
        label: 'Display Type', 
        responsive: false 
      });
      
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.flexDirection`, 
        label: 'Flex Direction', 
        responsive: false 
      });
      
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.alignItems`, 
        label: 'Align Items (Vertical)', 
        responsive: false 
      });
      
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.justifyContent`, 
        label: 'Justify Content (Horizontal)', 
        responsive: false 
      });
      
      // Add border tokens
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.borderRadius`, 
        label: 'Border Radius', 
        responsive: false 
      });
      
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.border`, 
        label: 'Border Style', 
        responsive: false 
      });
      
      matches.push({ 
        scope: 'section', 
        tokenPath: `sections.${sectionId}.layout.inner.borderColor`, 
        label: 'Border Color', 
        responsive: false 
      });
    }
  }

  return matches;
}


