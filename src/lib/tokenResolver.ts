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

export function resolveGlobalTokens(snapshot: ComputedSnapshot, sectionId: string | null, design: any): TokenMatch[] {
  const matches: TokenMatch[] = [];

  // Text elements → headings / hero_headings / preTitle / titleDescription
  const isTextTag = ['H1','H2','H3','H4','H5','H6','P','SPAN','DIV'].includes(snapshot.tagName);
  if (isTextTag) {
    // Hero-specific headings (priority over global headings)
    if (sectionId === 'hero' && design?.hero_headings) {
      const h = design.hero_headings;
      if (
        (snapshot.fontFamily && softContains(snapshot.fontFamily, h.fontFamily)) ||
        (snapshot.letterSpacing && approxEq(snapshot.letterSpacing, h.letterSpacing)) ||
        (snapshot.fontWeight && softContains(snapshot.fontWeight, h.fontWeight)) ||
        (snapshot.fontSize && (softContains(snapshot.fontSize, h.fontSize) || softContains(snapshot.fontSize, h.fontSizeMd) || softContains(snapshot.fontSize, h.fontSizeLg))) ||
        (snapshot.color && softContains(snapshot.color, h.color))
      ) {
        matches.push({ scope: 'section', tokenPath: 'hero_headings', label: 'Hero Headings', responsive: true });
      }
    }
    
    // Global headings match (fallback)
    if (design?.headings) {
      const h = design.headings;
      if (
        (snapshot.fontFamily && softContains(snapshot.fontFamily, h.fontFamily)) ||
        (snapshot.letterSpacing && approxEq(snapshot.letterSpacing, h.letterSpacing)) ||
        (snapshot.fontWeight && softContains(snapshot.fontWeight, h.fontWeight))
      ) {
        matches.push({ scope: 'global', tokenPath: 'headings', label: 'Headings', responsive: true });
      }
    }
    
    // PreTitle match
    if (design?.preTitle) {
      const t = design.preTitle;
      if (snapshot.color && t.color && softContains(snapshot.color, t.color)) {
        matches.push({ scope: 'global', tokenPath: 'preTitle', label: 'PreTitle', responsive: false });
      }
    }
    
    // Title Description match
    if (design?.titleDescription) {
      const d = design.titleDescription;
      if (snapshot.lineHeight && d.lineHeight && approxEq(snapshot.lineHeight, d.lineHeight)) {
        matches.push({ scope: 'global', tokenPath: 'titleDescription', label: 'Title Description', responsive: false });
      }
    }
  }

  // Buttons/links → buttonStyles
  const isButtonLike = ['A','BUTTON'].includes(snapshot.tagName);
  if (isButtonLike && design?.buttonStyles) {
    matches.push({ scope: 'global', tokenPath: 'buttonStyles.primary', label: 'Button Primary', responsive: false });
    matches.push({ scope: 'global', tokenPath: 'buttonStyles.secondary', label: 'Button Secondary', responsive: false });
    matches.push({ scope: 'global', tokenPath: 'buttonStyles.tab', label: 'Button Tab', responsive: false });
  }

  // Section container/layout → section tokens
  if (sectionId && design?.sections?.[sectionId]) {
    matches.push({ scope: 'section', tokenPath: `sections.${sectionId}.layout.padding`, label: `Section ${sectionId} padding`, responsive: true });
    matches.push({ scope: 'section', tokenPath: `sections.${sectionId}.layout.inner`, label: `Section ${sectionId} inner`, responsive: true });
    matches.push({ scope: 'section', tokenPath: `sections.${sectionId}.layout.inner.background`, label: `Section ${sectionId} background`, responsive: false });
  }

  return matches;
}


