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

  // Text elements → headings / hero_headings / preTitle / titleDescription
  const isTextTag = ['H1','H2','H3','H4','H5','H6','P','SPAN','DIV'].includes(snapshot.tagName);
  const isHeadingTag = ['H1','H2','H3','H4','H5','H6'].includes(snapshot.tagName);
  
  if (isTextTag) {
    // Hero-specific headings (priority over global headings)
    if (sectionId === 'hero' && design?.hero_headings && isHeadingTag) {
      const h = design.hero_headings;
      if (
        (snapshot.fontFamily && softContains(snapshot.fontFamily, h.fontFamily)) ||
        (snapshot.letterSpacing && approxEq(snapshot.letterSpacing, h.letterSpacing)) ||
        (snapshot.fontWeight && softContains(snapshot.fontWeight, h.fontWeight)) ||
        (snapshot.fontSize && (softContains(snapshot.fontSize, h.fontSize) || softContains(snapshot.fontSize, h.fontSizeMd) || softContains(snapshot.fontSize, h.fontSizeLg))) ||
        (snapshot.color && softContains(snapshot.color, h.color))
      ) {
        matches.push({ scope: 'section', tokenPath: 'hero_headings', label: 'Hero Headings', responsive: true });
        hasSpecificMatch = true; // Found specific match, deprioritize generic ones
      }
    }
    
    // Global headings match (only if no specific match found)
    if (!hasSpecificMatch && design?.headings && isHeadingTag) {
      const h = design.headings;
      if (
        (snapshot.fontFamily && softContains(snapshot.fontFamily, h.fontFamily)) ||
        (snapshot.letterSpacing && approxEq(snapshot.letterSpacing, h.letterSpacing)) ||
        (snapshot.fontWeight && softContains(snapshot.fontWeight, h.fontWeight))
      ) {
        matches.push({ scope: 'global', tokenPath: 'headings', label: 'Headings', responsive: true });
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
      // Check for card body text (on light backgrounds)
      if (design?.typography?.cardBody) {
        const cb = design.typography.cardBody;
        if (
          (snapshot.color && softContains(snapshot.color, cb.color)) ||
          (snapshot.fontSize && softContains(snapshot.fontSize, cb.fontSize))
        ) {
          matches.push({ scope: 'global', tokenPath: 'typography.cardBody', label: 'Card Body Text', responsive: false });
          hasSpecificMatch = true;
        }
      }
      
      // Check for general body text (fallback)
      if (!hasSpecificMatch && design?.typography?.body) {
        const b = design.typography.body;
        if (
          (snapshot.fontFamily && softContains(snapshot.fontFamily, b.fontFamily)) ||
          (snapshot.fontSize && softContains(snapshot.fontSize, b.fontSize)) ||
          (snapshot.lineHeight && approxEq(snapshot.lineHeight, b.lineHeight)) ||
          (snapshot.fontWeight && softContains(snapshot.fontWeight, b.fontWeight))
        ) {
          matches.push({ scope: 'global', tokenPath: 'typography.body', label: 'Body Text', responsive: false });
          hasSpecificMatch = true;
        }
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

  // Buttons/links → buttonStyles (only for actual buttons/links)
  const isButtonLike = ['A','BUTTON'].includes(snapshot.tagName);
  if (isButtonLike && design?.buttonStyles) {
    // Only show button tokens for button elements, not text
    matches.push({ scope: 'global', tokenPath: 'buttonStyles.primary', label: 'Button Primary', responsive: false });
    matches.push({ scope: 'global', tokenPath: 'buttonStyles.secondary', label: 'Button Secondary', responsive: false });
    matches.push({ scope: 'global', tokenPath: 'buttonStyles.tab', label: 'Button Tab', responsive: false });
  }

  // Remove section container tokens - they're not useful for individual element editing
  // Users should edit section layouts through dedicated section controls, not individual elements

  return matches;
}


