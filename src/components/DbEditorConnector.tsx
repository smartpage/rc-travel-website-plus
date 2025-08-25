import React from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { useEditorOverlay } from '@/contexts/EditorOverlayContext';
import SmartInput from './SmartInput';
import ColorSwatch from './ColorSwatch';

// Small utility: dot-path get
const getAtPath = (obj: any, path: string): any => {
  if (!obj) return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p]; else return undefined;
  }
  return cur;
};

// Small utility: dot-path set (mutating copy pattern)
const setAtPath = (obj: any, path: string, value: any): any => {
  const parts = path.split('.');
  const root = obj ?? {};
  let cur: any = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return root;
};

// Infer control type based on key name and current value
type Control = 'color' | 'length' | 'text' | 'number' | 'boolean';
const inferControl = (key: string, value: any): Control => {
  const k = key.toLowerCase();
  
  // Force color control for any color-related field
  if (k.includes('color') || 
      k === 'bg' || 
      k.endsWith('bg') ||
      k.includes('overlay') ||
      k.includes('background') && !k.includes('backgroundimage') && !k.includes('backgroundurl')) {
    return 'color';
  }
  
  if (typeof value === 'boolean' || (/^is|^has|^use|^show/.test(k) && k !== 'rounded')) return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    const v = value.trim();
    // Detect color values by format
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || 
        /^rgba?\(/i.test(v) || 
        /^hsl\(/i.test(v) ||
        /^(transparent|inherit|initial|unset)$/i.test(v) ||
        /^(black|white|red|green|blue|yellow|purple|orange|pink|gray|grey)$/i.test(v)) {
      return 'color';
    }
    if (/fontfamily$/i.test(k)) return 'text';
    if (/(fontsize|lineheight|letterspacing)$/i.test(k)) return 'length';
    if (/(padding|margin|width|height|maxwidth|maxheight|minwidth|minheight|borderwidth|borderradius|radius|spacing|gap)$/i.test(k)) return 'length';
    return 'text';
  }
  return 'text';
};

// Known enum options (parity with legacy inspector)
type EnumOption = { value: string; label: string };
const enumOptionsForKey = (key: string): EnumOption[] | null => {
  const k = key.toLowerCase();
  if (k === 'display') return [
    { value: 'block', label: 'block' },
    { value: 'inline-block', label: 'inline-block' },
    { value: 'flex', label: 'flex' },
    { value: 'grid', label: 'grid' },
    { value: 'none', label: 'none' },
  ];
  if (k === 'flexdirection' || k === 'flex-direction') return [
    { value: 'row', label: 'row' },
    { value: 'row-reverse', label: 'row-reverse' },
    { value: 'column', label: 'column' },
    { value: 'column-reverse', label: 'column-reverse' },
  ];
  if (k === 'flexwrap' || k === 'flex-wrap') return [
    { value: 'nowrap', label: 'nowrap' },
    { value: 'wrap', label: 'wrap' },
    { value: 'wrap-reverse', label: 'wrap-reverse' },
  ];
  if (k === 'justifycontent' || k === 'justify-content') return [
    { value: 'flex-start', label: 'flex-start' },
    { value: 'center', label: 'center' },
    { value: 'flex-end', label: 'flex-end' },
    { value: 'space-between', label: 'space-between' },
    { value: 'space-around', label: 'space-around' },
    { value: 'space-evenly', label: 'space-evenly' },
  ];
  if (k === 'alignitems' || k === 'align-items') return [
    { value: 'stretch', label: 'stretch' },
    { value: 'flex-start', label: 'flex-start' },
    { value: 'center', label: 'center' },
    { value: 'flex-end', label: 'flex-end' },
    { value: 'baseline', label: 'baseline' },
  ];
  if (k === 'aligncontent' || k === 'align-content') return [
    { value: 'normal', label: 'normal' },
    { value: 'stretch', label: 'stretch' },
    { value: 'center', label: 'center' },
    { value: 'flex-start', label: 'flex-start' },
    { value: 'flex-end', label: 'flex-end' },
    { value: 'space-between', label: 'space-between' },
    { value: 'space-around', label: 'space-around' },
  ];
  if (k === 'borderstyle' || k === 'border-style') return [
    { value: 'solid', label: 'solid' },
    { value: 'dashed', label: 'dashed' },
    { value: 'dotted', label: 'dotted' },
    { value: 'double', label: 'double' },
    { value: 'groove', label: 'groove' },
    { value: 'ridge', label: 'ridge' },
    { value: 'inset', label: 'inset' },
    { value: 'outset', label: 'outset' },
    { value: 'none', label: 'none' },
  ];
  if (k === 'overflow') return [
    { value: 'visible', label: 'visible' },
    { value: 'hidden', label: 'hidden' },
    { value: 'scroll', label: 'scroll' },
    { value: 'auto', label: 'auto' },
  ];
  if (k === 'position') return [
    { value: 'static', label: 'static' },
    { value: 'relative', label: 'relative' },
    { value: 'absolute', label: 'absolute' },
    { value: 'fixed', label: 'fixed' },
    { value: 'sticky', label: 'sticky' },
  ];
  if (k === 'textalign' || k === 'text-align') return [
    { value: 'left', label: 'left' },
    { value: 'center', label: 'center' },
    { value: 'right', label: 'right' },
    { value: 'justify', label: 'justify' },
  ];

  if (k === 'textalign' || k === 'text-align') return [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
    { value: 'justify', label: 'Justify' },
  ];
  return null;
};

// Normalize units on blur if unitless numbers appear in length-like fields
const normalizeUnits = (value: string, defaultUnit: string): string => {
  if (typeof value !== 'string') return value as any;
  return value.replace(/(-?\d+(?:\.\d+)?)(?![a-z%])/gi, (match, num) => {
    const n = parseFloat(num);
    if (!isFinite(n) || n === 0) return num;
    return `${num}${defaultUnit}`;
  });
};

// Traverse object to collect leaf fields with dot paths
type Field = { path: string; key: string; value: any };
const collectFields = (rootObj: any, basePath: string): Field[] => {
  const out: Field[] = [];
  const walk = (obj: any, curPath: string) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const nextPath = curPath ? `${curPath}.${key}` : key;
      const v = (obj as any)[key];
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        // Recurse into objects; only add leaves
        walk(v, nextPath);
      } else {
        out.push({ path: nextPath, key, value: v });
      }
    }
  };
  walk(rootObj, basePath);
  return out;
};

// Group by first child after the base (e.g., text.*, barTop.*)
const groupForPath = (base: string, path: string): string => {
  if (!path.startsWith(base)) return 'Misc';
  const rest = path.slice(base.length + 1); // remove base + dot
  const seg = rest.split('.')[0];
  return seg || 'Misc';
};

// If a group contains a single flat leaf (e.g., base.foo), suppress the group header
const shouldShowGroupHeader = (basePath: string, groupName: string, fields: Field[]): boolean => {
  if (groupName === 'Misc') return true;
  if (fields.length !== 1) return true;
  const only = fields[0];
  const leaf = only.path.replace(`${basePath}.`, '');
  const isNested = leaf.includes('.');
  return isNested; // show header only when nested
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ margin: '10px 0 6px', color: '#facc15', fontSize: 12, fontWeight: 700 }}>{title}</div>
);

// UI parity: simple row with a label like the legacy inspector
const PanelRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'grid', gap: 4 }}>
    <span style={{ fontSize: 11, color: '#facc15', letterSpacing: 0.2 as any }}>{label}</span>
    {children}
  </label>
);

// ---- Label helpers (parity with legacy component) ----
const CAMEL_TO_TITLE = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());

const FRIENDLY_KEY_MAP: Record<string, string> = {
  backgroundColor: 'Background Color',
  backgroundColorHover: 'Background Color (Hover)',
  background: 'Background',
  bg: 'Background',
  textColor: 'Text Color',
  textColorHover: 'Text Color (Hover)',
  borderColor: 'Border Color',
  borderColorHover: 'Border Color (Hover)',
  borderRadius: 'Border Radius',
  borderWidth: 'Border Width',
  borderStyle: 'Border Style',
  overlayColor: 'Overlay Color',
  headerBarColor: 'Header Bar Color',
  iconColor: 'Icon Color',
  minHeight: 'Min Height',
  maxHeight: 'Max Height',
  minWidth: 'Min Width',
  maxWidth: 'Max Width',
  alignItems: 'Align Items',
  justifyContent: 'Justify Content',
  flexDirection: 'Flex Direction',
  flexWrap: 'Flex Wrap',
  alignContent: 'Align Content',
  display: 'Display',
  position: 'Position',
  overflow: 'Overflow',
  textAlign: 'Text Align',
  fontWeight: 'Font Weight',
  fontSize: 'Font Size',
  lineHeight: 'Line Height',
  letterSpacing: 'Letter Spacing',
  fontFamily: 'Font Family',
  padding: 'Padding',
  margin: 'Margin',
  gap: 'Gap',
  spacing: 'Spacing',
  imageOpacity: 'Image Opacity',
  transition: 'Transition',
  shadow: 'Shadow',
  rounded: 'Rounded',
  iconSize: 'Icon Size',
  avatarSize: 'Avatar Size',
};

const friendlyLabelForPath = (path: string, currentViewport?: string): string => {
  const parts = path.split('.');
  const key = parts[parts.length - 1];
  let baseLabel = FRIENDLY_KEY_MAP[key] || CAMEL_TO_TITLE(key);
  
  // Add viewport context for responsive fields
  if (currentViewport) {
    const objSuffixMatch = path.match(/\.(mobile|tablet|desktop)$/);
    const lgSuffixMatch = key.match(/^(.+?)Lg$/);
    const smSuffixMatch = key.match(/^(.+?)Sm$/);
    
    if (objSuffixMatch || lgSuffixMatch || smSuffixMatch) {
      const viewportLabel = currentViewport === 'desktop' ? 'Desktop' : 'Mobile';
      baseLabel = `${baseLabel} (${viewportLabel})`;
    }
  }
  
  return baseLabel;
};

const placeholderForKey = (key: string): string => {
  const k = key.toLowerCase();
  if (k.includes('color') || k === 'bg' || k.endsWith('bg') || k.includes('overlay')) return '#000000';
  if (k.includes('padding')) return 'e.g., 1rem 0';
  if (k.includes('margin')) return 'e.g., 0 auto';
  if (k.includes('radius')) return 'e.g., 8px';
  if (k.includes('width')) return 'e.g., 100%';
  if (k.includes('height')) return 'e.g., 100vh';
  if (k.includes('size')) return 'e.g., 2rem';
  if (k.includes('spacing') || k.includes('gap')) return 'e.g., 1rem';
  if (k.includes('weight')) return '400';
  if (k.includes('opacity')) return '1';
  if (k.includes('border') && k.includes('width')) return '1px';
  if (k.includes('shadow')) return 'none';
  if (k.includes('transition')) return 'all 0.3s ease';
  if (k.includes('fontsize')) return 'e.g., 1rem';
  if (k.includes('lineheight')) return 'e.g., 1.5';
  if (k.includes('letterspacing')) return 'e.g., 0.025em';
  if (k.includes('family')) return 'e.g., Arial, sans-serif';
  return '';
};

// Direct data attribute reading - replaces tokenResolver.ts logic
const getTokenPathsFromElement = (element: Element | null): { 
  typography: string[], 
  cardType: string | null, 
  cardVariant: string | null,
  sectionId: string | null 
} => {
  if (!element) return { typography: [], cardType: null, cardVariant: null, sectionId: null };
  
  const typography: string[] = [];
  
  // Read data-typography attribute directly
  const typographyAttr = element.getAttribute('data-typography');
  if (typographyAttr) {
    // Convert "testimonialCard.title" → "testimonialCardTitle"
    const typographyKey = typographyAttr.replace(/\./g, '');
    typography.push(typographyKey);
  }
  
  // Read card information
  const cardType = element.getAttribute('data-card-type') || 
                   element.closest('[data-card-type]')?.getAttribute('data-card-type') || 
                   null;
  const cardVariant = element.getAttribute('data-card-variant') || 
                      element.closest('[data-card-variant]')?.getAttribute('data-card-variant') || 
                      null;
  
  // Read section information  
  const sectionEl = element.closest('[data-section-id]');
  const sectionId = sectionEl?.getAttribute('data-section-id') || null;
  
  return { typography, cardType, cardVariant, sectionId };
};

// Hardcoded card panel renderers for legacy parity
const renderServiceCardPanel = (design: any, updateDesignLocal: any): React.ReactNode => {
  const activeVariant = design?.components?.serviceCard?.activeVariant || 'standard';
  
  return (
    <div>
      <SectionHeader title="Service Card" />
      
      {/* Variant Selection */}
      <PanelRow label="Card Variant">
        <select
          value={activeVariant}
          onChange={(e) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            newDesign.components.serviceCard.activeVariant = e.target.value;
            return newDesign;
          })}
          style={{
            width: '100%',
            padding: '8px',
            background: '#1b1b1b',
            color: '#fff',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          <option value="standard">Standard</option>
          <option value="highlight">Highlight</option>
          <option value="featured">Featured</option>
        </select>
      </PanelRow>

      {/* Common Card Properties */}
      <PanelRow label="Min Height">
        <SmartInput
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.minHeight || '500px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].minHeight = val;
            return newDesign;
          })}
          placeholder="500px"
          label={`serviceCard.variants.${activeVariant}.minHeight`}
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Max Height">
        <SmartInput
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.maxHeight || 'none'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].maxHeight = val;
            return newDesign;
          })}
          placeholder="none"
          label={`serviceCard.variants.${activeVariant}.maxHeight`}
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Background Color">
        <ColorSwatch
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.backgroundColor || 'transparent'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].backgroundColor = val;
            return newDesign;
          })}
          placeholder="transparent"
        />
      </PanelRow>

      <PanelRow label="Text Color">
        <ColorSwatch
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.textColor || '#ffffff'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].textColor = val;
            return newDesign;
          })}
          placeholder="#ffffff"
        />
      </PanelRow>

      <PanelRow label="Border Color">
        <ColorSwatch
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.borderColor || '#1f2937'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].borderColor = val;
            return newDesign;
          })}
          placeholder="#1f2937"
        />
      </PanelRow>

      <PanelRow label="Icon Color">
        <ColorSwatch
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.iconColor || '#9ca3af'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].iconColor = val;
            return newDesign;
          })}
          placeholder="#9ca3af"
        />
      </PanelRow>

      <PanelRow label="Header Bar Color">
        <ColorSwatch
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.headerBarColor || '#1f2937'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].headerBarColor = val;
            return newDesign;
          })}
          placeholder="#1f2937"
        />
      </PanelRow>

      <PanelRow label="Padding">
        <SmartInput
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.padding || '1rem 2rem 3rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].padding = val;
            return newDesign;
          })}
          placeholder="1rem 2rem 3rem"
          label={`serviceCard.variants.${activeVariant}.padding`}
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Radius">
        <SmartInput
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.borderRadius || '1rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].borderRadius = val;
            return newDesign;
          })}
          placeholder="1rem"
          label={`serviceCard.variants.${activeVariant}.borderRadius`}
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Width">
        <SmartInput
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.borderWidth || '1px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].borderWidth = val;
            return newDesign;
          })}
          placeholder="1px"
          label={`serviceCard.variants.${activeVariant}.borderWidth`}
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Icon Size">
        <SmartInput
          value={design?.components?.serviceCard?.variants?.[activeVariant]?.iconSize || '3rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.serviceCard) newDesign.components.serviceCard = {};
            if (!newDesign.components.serviceCard.variants) newDesign.components.serviceCard.variants = {};
            if (!newDesign.components.serviceCard.variants[activeVariant]) newDesign.components.serviceCard.variants[activeVariant] = {};
            newDesign.components.serviceCard.variants[activeVariant].iconSize = val;
            return newDesign;
          })}
          placeholder="3rem"
          label={`serviceCard.variants.${activeVariant}.iconSize`}
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>
    </div>
  );
};

const renderTravelPackageCardPanel = (design: any, updateDesignLocal: any): React.ReactNode => {
  return (
    <div>
      <SectionHeader title="Travel Package Card" />
      
      <PanelRow label="Background Color">
        <ColorSwatch
          value={design?.components?.travelPackageCard?.backgroundColor || '#ffffff'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.backgroundColor = val;
            return newDesign;
          })}
          placeholder="#ffffff"
        />
      </PanelRow>

      <PanelRow label="Border Color">
        <ColorSwatch
          value={design?.components?.travelPackageCard?.borderColor || 'rgba(0,0,0,1)'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.borderColor = val;
            return newDesign;
          })}
          placeholder="rgba(0,0,0,1)"
        />
      </PanelRow>

      <PanelRow label="Min Height">
        <SmartInput
          value={design?.components?.travelPackageCard?.minHeight || '80vh'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.minHeight = val;
            return newDesign;
          })}
          placeholder="80vh"
          label="travelPackageCard.minHeight"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Max Height">
        <SmartInput
          value={design?.components?.travelPackageCard?.maxHeight || '80vh'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.maxHeight = val;
            return newDesign;
          })}
          placeholder="80vh"
          label="travelPackageCard.maxHeight"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Radius">
        <SmartInput
          value={design?.components?.travelPackageCard?.borderRadius || '1rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.borderRadius = val;
            return newDesign;
          })}
          placeholder="1rem"
          label="travelPackageCard.borderRadius"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Width">
        <SmartInput
          value={design?.components?.travelPackageCard?.borderWidth || '8px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.borderWidth = val;
            return newDesign;
          })}
          placeholder="8px"
          label="travelPackageCard.borderWidth"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Content Padding">
        <SmartInput
          value={design?.components?.travelPackageCard?.contentPadding || '.5rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.contentPadding = val;
            return newDesign;
          })}
          placeholder=".5rem"
          label="travelPackageCard.contentPadding"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Inner Padding">
        <SmartInput
          value={design?.components?.travelPackageCard?.innerPadding || '1.25rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.innerPadding = val;
            return newDesign;
          })}
          placeholder="1.25rem"
          label="travelPackageCard.innerPadding"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Image Height">
        <SmartInput
          value={design?.components?.travelPackageCard?.imageHeight || '100%'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.imageHeight = val;
            return newDesign;
          })}
          placeholder="100%"
          label="travelPackageCard.imageHeight"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <SectionHeader title="Text Colors" />
      
      <PanelRow label="Title Color">
        <ColorSwatch
          value={design?.tokens?.typography?.travelPackageTitle?.color || '#0a253d'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackageTitle) newDesign.tokens.typography.travelPackageTitle = {};
            newDesign.tokens.typography.travelPackageTitle.color = val;
            return newDesign;
          })}
          placeholder="#0a253d"
        />
      </PanelRow>

      <PanelRow label="Description Color">
        <ColorSwatch
          value={design?.tokens?.typography?.packageDescription?.color || '#111827'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.packageDescription) newDesign.tokens.typography.packageDescription = {};
            newDesign.tokens.typography.packageDescription.color = val;
            return newDesign;
          })}
          placeholder="#111827"
        />
      </PanelRow>

      <PanelRow label="Includes Color">
        <ColorSwatch
          value={design?.tokens?.typography?.travelPackageIncludes?.color || '#b54545'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackageIncludes) newDesign.tokens.typography.travelPackageIncludes = {};
            newDesign.tokens.typography.travelPackageIncludes.color = val;
            return newDesign;
          })}
          placeholder="#b54545"
        />
      </PanelRow>

      <PanelRow label="Price Type Color">
        <ColorSwatch
          value={design?.tokens?.typography?.travelPackagePriceType?.color || '#6b7280'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackagePriceType) newDesign.tokens.typography.travelPackagePriceType = {};
            newDesign.tokens.typography.travelPackagePriceType.color = val;
            return newDesign;
          })}
          placeholder="#6b7280"
        />
      </PanelRow>

      <PanelRow label="Price Value Color">
        <ColorSwatch
          value={design?.tokens?.typography?.travelPackagePriceValue?.color || '#1f1a1a'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackagePriceValue) newDesign.tokens.typography.travelPackagePriceValue = {};
            newDesign.tokens.typography.travelPackagePriceValue.color = val;
            return newDesign;
          })}
          placeholder="#1f1a1a"
        />
      </PanelRow>

      <SectionHeader title="Icon Colors & Sizes" />
      
      <PanelRow label="Map Icon Color">
        <ColorSwatch
          value={design?.components?.travelPackageCard?.iconColors?.map || design?.tokens?.colors?.accent || '#eab308'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            if (!newDesign.components.travelPackageCard.iconColors) newDesign.components.travelPackageCard.iconColors = {};
            newDesign.components.travelPackageCard.iconColors.map = val;
            return newDesign;
          })}
          placeholder="#eab308"
        />
      </PanelRow>

      <PanelRow label="Map Icon Size">
        <SmartInput
          value={design?.components?.travelPackageCard?.iconSizes?.map || '1.25rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            if (!newDesign.components.travelPackageCard.iconSizes) newDesign.components.travelPackageCard.iconSizes = {};
            newDesign.components.travelPackageCard.iconSizes.map = val;
            return newDesign;
          })}
          placeholder="1.25rem"
          label="travelPackageCard.iconSizes.map"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Check Icon Color">
        <ColorSwatch
          value={design?.components?.travelPackageCard?.iconColors?.check || design?.tokens?.colors?.accent || '#eab308'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            if (!newDesign.components.travelPackageCard.iconColors) newDesign.components.travelPackageCard.iconColors = {};
            newDesign.components.travelPackageCard.iconColors.check = val;
            return newDesign;
          })}
          placeholder="#eab308"
        />
      </PanelRow>

      <PanelRow label="Check Icon Size">
        <SmartInput
          value={design?.components?.travelPackageCard?.iconSizes?.check || '1rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            if (!newDesign.components.travelPackageCard.iconSizes) newDesign.components.travelPackageCard.iconSizes = {};
            newDesign.components.travelPackageCard.iconSizes.check = val;
            return newDesign;
          })}
          placeholder="1rem"
          label="travelPackageCard.iconSizes.check"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Message Icon Color">
        <ColorSwatch
          value={design?.components?.travelPackageCard?.iconColors?.message || design?.tokens?.colors?.highlight || '#ff69b4'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            if (!newDesign.components.travelPackageCard.iconColors) newDesign.components.travelPackageCard.iconColors = {};
            newDesign.components.travelPackageCard.iconColors.message = val;
            return newDesign;
          })}
          placeholder="#ff69b4"
        />
      </PanelRow>

      <PanelRow label="Message Icon Size">
        <SmartInput
          value={design?.components?.travelPackageCard?.iconSizes?.message || '1rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            if (!newDesign.components.travelPackageCard.iconSizes) newDesign.components.travelPackageCard.iconSizes = {};
            newDesign.components.travelPackageCard.iconSizes.message = val;
            return newDesign;
          })}
          placeholder="1rem"
          label="travelPackageCard.iconSizes.message"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <SectionHeader title="Text Sizes" />
      
      <PanelRow label="Title Font Size">
        <SmartInput
          value={design?.tokens?.typography?.travelPackageTitle?.fontSize || '1.75rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackageTitle) newDesign.tokens.typography.travelPackageTitle = {};
            newDesign.tokens.typography.travelPackageTitle.fontSize = val;
            return newDesign;
          })}
          placeholder="1.75rem"
          label="travelPackageTitle.fontSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Description Font Size">
        <SmartInput
          value={design?.tokens?.typography?.packageDescription?.fontSize || '0.75rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.packageDescription) newDesign.tokens.typography.packageDescription = {};
            newDesign.tokens.typography.packageDescription.fontSize = val;
            return newDesign;
          })}
          placeholder="0.75rem"
          label="packageDescription.fontSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Includes Font Size">
        <SmartInput
          value={design?.tokens?.typography?.travelPackageIncludes?.fontSize || '0.875rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackageIncludes) newDesign.tokens.typography.travelPackageIncludes = {};
            newDesign.tokens.typography.travelPackageIncludes.fontSize = val;
            return newDesign;
          })}
          placeholder="0.875rem"
          label="travelPackageIncludes.fontSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Price Type Font Size">
        <SmartInput
          value={design?.tokens?.typography?.travelPackagePriceType?.fontSize || '0.875rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackagePriceType) newDesign.tokens.typography.travelPackagePriceType = {};
            newDesign.tokens.typography.travelPackagePriceType.fontSize = val;
            return newDesign;
          })}
          placeholder="0.875rem"
          label="travelPackagePriceType.fontSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Price Value Font Size">
        <SmartInput
          value={design?.tokens?.typography?.travelPackagePriceValue?.fontSize || '3.25rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.tokens) newDesign.tokens = {};
            if (!newDesign.tokens.typography) newDesign.tokens.typography = {};
            if (!newDesign.tokens.typography.travelPackagePriceValue) newDesign.tokens.typography.travelPackagePriceValue = {};
            newDesign.tokens.typography.travelPackagePriceValue.fontSize = val;
            return newDesign;
          })}
          placeholder="3.25rem"
          label="travelPackagePriceValue.fontSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <SectionHeader title="Card Paddings" />
      
      <PanelRow label="Card Padding">
        <SmartInput
          value={design?.components?.travelPackageCard?.padding || '16px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.padding = val;
            return newDesign;
          })}
          placeholder="16px"
          label="travelPackageCard.padding"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Header Padding">
        <SmartInput
          value={design?.components?.travelPackageCard?.headerPadding || '0'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.headerPadding = val;
            return newDesign;
          })}
          placeholder="0"
          label="travelPackageCard.headerPadding"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Footer Padding">
        <SmartInput
          value={design?.components?.travelPackageCard?.footerPadding || '16px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.travelPackageCard) newDesign.components.travelPackageCard = {};
            newDesign.components.travelPackageCard.footerPadding = val;
            return newDesign;
          })}
          placeholder="16px"
          label="travelPackageCard.footerPadding"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>
    </div>
  );
};

const renderTestimonialCardPanel = (design: any, updateDesignLocal: any): React.ReactNode => {
  return (
    <div>
      <SectionHeader title="Testimonial Card" />
      
      <PanelRow label="Background Color">
        <ColorSwatch
          value={design?.components?.testimonialCard?.backgroundColor || 'tokens.colors.background'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.backgroundColor = val;
            return newDesign;
          })}
          placeholder="tokens.colors.background"
        />
      </PanelRow>

      <PanelRow label="Text Color">
        <ColorSwatch
          value={design?.components?.testimonialCard?.textColor || 'tokens.colors.text'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.textColor = val;
            return newDesign;
          })}
          placeholder="tokens.colors.text"
        />
      </PanelRow>

      <PanelRow label="Border Color">
        <ColorSwatch
          value={design?.components?.testimonialCard?.borderColor || 'tokens.colors.secondary'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.borderColor = val;
            return newDesign;
          })}
          placeholder="tokens.colors.secondary"
        />
      </PanelRow>

      <PanelRow label="Star Color">
        <ColorSwatch
          value={design?.components?.testimonialCard?.starColor || 'rgb(255, 217, 90)'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.starColor = val;
            return newDesign;
          })}
          placeholder="rgb(255, 217, 90)"
        />
      </PanelRow>

      <PanelRow label="Avatar Size">
        <SmartInput
          value={design?.components?.testimonialCard?.avatarSize || '7rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.avatarSize = val;
            return newDesign;
          })}
          placeholder="7rem"
          label="testimonialCard.avatarSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Star Size">
        <SmartInput
          value={design?.components?.testimonialCard?.starSize || '1.5rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.starSize = val;
            return newDesign;
          })}
          placeholder="1.5rem"
          label="testimonialCard.starSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Min Height">
        <SmartInput
          value={design?.components?.testimonialCard?.minHeight || '500px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.minHeight = val;
            return newDesign;
          })}
          placeholder="500px"
          label="testimonialCard.minHeight"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Max Width">
        <SmartInput
          value={design?.components?.testimonialCard?.maxWidth || '500px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.testimonialCard) newDesign.components.testimonialCard = {};
            newDesign.components.testimonialCard.maxWidth = val;
            return newDesign;
          })}
          placeholder="500px"
          label="testimonialCard.maxWidth"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>
    </div>
  );
};

const renderWhyFeatureCardPanel = (design: any, updateDesignLocal: any): React.ReactNode => {
  return (
    <div>
      <SectionHeader title="Why Feature Card" />
      
      <PanelRow label="Background Color">
        <ColorSwatch
          value={design?.components?.whyFeatureCard?.backgroundColor || 'transparent'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.backgroundColor = val;
            return newDesign;
          })}
          placeholder="transparent"
        />
      </PanelRow>

      <PanelRow label="Text Color">
        <ColorSwatch
          value={design?.components?.whyFeatureCard?.textColor || 'tokens.colors.background'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.textColor = val;
            return newDesign;
          })}
          placeholder="tokens.colors.background"
        />
      </PanelRow>

      <PanelRow label="Border Color">
        <ColorSwatch
          value={design?.components?.whyFeatureCard?.borderColor || 'transparent'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.borderColor = val;
            return newDesign;
          })}
          placeholder="transparent"
        />
      </PanelRow>

      <PanelRow label="Icon Color">
        <ColorSwatch
          value={design?.components?.whyFeatureCard?.iconColor || 'rgba(0,0,0,1)'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.iconColor = val;
            return newDesign;
          })}
          placeholder="rgba(0,0,0,1)"
        />
      </PanelRow>

      <PanelRow label="Icon Size">
        <SmartInput
          value={design?.components?.whyFeatureCard?.iconSize || '4.25rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.iconSize = val;
            return newDesign;
          })}
          placeholder="4.25rem"
          label="whyFeatureCard.iconSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Icon Inner Size">
        <SmartInput
          value={design?.components?.whyFeatureCard?.iconInnerSize || '2.5rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.iconInnerSize = val;
            return newDesign;
          })}
          placeholder="2.5rem"
          label="whyFeatureCard.iconInnerSize"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Icon Spacing">
        <SmartInput
          value={design?.components?.whyFeatureCard?.iconSpacing || '1.5rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.iconSpacing = val;
            return newDesign;
          })}
          placeholder="1.5rem"
          label="whyFeatureCard.iconSpacing"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Description Padding">
        <SmartInput
          value={design?.components?.whyFeatureCard?.descriptionPadding || '2rem 2rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.descriptionPadding = val;
            return newDesign;
          })}
          placeholder="2rem 2rem"
          label="whyFeatureCard.descriptionPadding"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Radius">
        <SmartInput
          value={design?.components?.whyFeatureCard?.borderRadius || 'tokens.radii.medium'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.borderRadius = val;
            return newDesign;
          })}
          placeholder="tokens.radii.medium"
          label="whyFeatureCard.borderRadius"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Width">
        <SmartInput
          value={design?.components?.whyFeatureCard?.borderWidth || '2px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.whyFeatureCard) newDesign.components.whyFeatureCard = {};
            newDesign.components.whyFeatureCard.borderWidth = val;
            return newDesign;
          })}
          placeholder="2px"
          label="whyFeatureCard.borderWidth"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>
    </div>
  );
};

const renderContactCardPanel = (design: any, updateDesignLocal: any): React.ReactNode => {
  return (
    <div>
      <SectionHeader title="Contact Card" />
      
      <PanelRow label="Background Color">
        <ColorSwatch
          value={design?.components?.contactCard?.backgroundColor || '#1f2937'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.contactCard) newDesign.components.contactCard = {};
            newDesign.components.contactCard.backgroundColor = val;
            return newDesign;
          })}
          placeholder="#1f2937"
        />
      </PanelRow>

      <PanelRow label="Border Color">
        <ColorSwatch
          value={design?.components?.contactCard?.borderColor || '#eab308'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.contactCard) newDesign.components.contactCard = {};
            newDesign.components.contactCard.borderColor = val;
            return newDesign;
          })}
          placeholder="#eab308"
        />
      </PanelRow>

      <PanelRow label="Border Width">
        <SmartInput
          value={design?.components?.contactCard?.borderWidth || '2px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.contactCard) newDesign.components.contactCard = {};
            newDesign.components.contactCard.borderWidth = val;
            return newDesign;
          })}
          placeholder="2px"
          label="contactCard.borderWidth"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Radius">
        <SmartInput
          value={design?.components?.contactCard?.borderRadius || '1rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.contactCard) newDesign.components.contactCard = {};
            newDesign.components.contactCard.borderRadius = val;
            return newDesign;
          })}
          placeholder="1rem"
          label="contactCard.borderRadius"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Shadow">
        <SmartInput
          value={design?.components?.contactCard?.shadow || '0 10px 20px rgba(0,0,0,.35)'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.contactCard) newDesign.components.contactCard = {};
            newDesign.components.contactCard.shadow = val;
            return newDesign;
          })}
          placeholder="0 10px 20px rgba(0,0,0,.35)"
          label="contactCard.shadow"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Padding">
        <SmartInput
          value={design?.components?.contactCard?.padding || '2rem'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.contactCard) newDesign.components.contactCard = {};
            newDesign.components.contactCard.padding = val;
            return newDesign;
          })}
          placeholder="2rem"
          label="contactCard.padding"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>
    </div>
  );
};

const renderFooterCardPanel = (design: any, updateDesignLocal: any): React.ReactNode => {
  return (
    <div>
      <SectionHeader title="Footer Card" />
      
      <PanelRow label="Background Color">
        <ColorSwatch
          value={design?.components?.footerCard?.backgroundColor || '#000000'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.footerCard) newDesign.components.footerCard = {};
            newDesign.components.footerCard.backgroundColor = val;
            return newDesign;
          })}
          placeholder="#000000"
        />
      </PanelRow>

      <PanelRow label="Border Color">
        <ColorSwatch
          value={design?.components?.footerCard?.borderColor || '#000000'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.footerCard) newDesign.components.footerCard = {};
            newDesign.components.footerCard.borderColor = val;
            return newDesign;
          })}
          placeholder="#000000"
        />
      </PanelRow>

      <PanelRow label="Border Radius">
        <SmartInput
          value={design?.components?.footerCard?.borderRadius || '0'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.footerCard) newDesign.components.footerCard = {};
            newDesign.components.footerCard.borderRadius = val;
            return newDesign;
          })}
          placeholder="0"
          label="footerCard.borderRadius"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Border Style">
        <select
          value={design?.components?.footerCard?.borderStyle || 'solid'}
          onChange={(e) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.footerCard) newDesign.components.footerCard = {};
            newDesign.components.footerCard.borderStyle = e.target.value;
            return newDesign;
          })}
          style={{
            width: '100%',
            padding: '8px',
            background: '#1b1b1b',
            color: '#fff',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="none">None</option>
        </select>
      </PanelRow>

      <PanelRow label="Border Width">
        <SmartInput
          value={design?.components?.footerCard?.borderWidth || '1px'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.footerCard) newDesign.components.footerCard = {};
            newDesign.components.footerCard.borderWidth = val;
            return newDesign;
          })}
          placeholder="1px"
          label="footerCard.borderWidth"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>

      <PanelRow label="Height">
        <SmartInput
          value={design?.components?.footerCard?.height || '100%'}
          onChange={(val) => updateDesignLocal((prev: any) => {
            const newDesign = { ...prev };
            if (!newDesign.components) newDesign.components = {};
            if (!newDesign.components.footerCard) newDesign.components.footerCard = {};
            newDesign.components.footerCard.height = val;
            return newDesign;
          })}
          placeholder="100%"
          label="footerCard.height"
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>
    </div>
  );
};

const DbEditorConnector: React.FC = () => {
  const { design, updateDesignLocal } = useDesign() as any;
  const { activeElement, viewport, selectedElement } = useEditorOverlay() as any;
  
  // Get token paths directly from the selected element, bypassing tokenResolver
  const elementTokens = getTokenPathsFromElement(selectedElement);
  // IMPORTANT: cardType must come only from data-card-type (not from label)
  const cardType = elementTokens.cardType || activeElement?.cardType || null;

  const renderField = (f: Field) => {
    const visibleLabel = friendlyLabelForPath(f.path);
    const control = inferControl(f.key, f.value);
    const onChange = (val: any) => {
      updateDesignLocal((prev: any) => {
        const next = { ...prev };
        setAtPath(next, f.path, val);
        return next;
      });
    };

    // Check if this field should use a dropdown
    const enumOptions = enumOptionsForKey(f.key);
    if (enumOptions) {
      return (
        <PanelRow key={f.path} label={visibleLabel}>
          <select
            value={getAtPath(design, f.path) || enumOptions[0]?.value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#1b1b1b',
              color: '#fff',
              border: '1px solid #2a2a2a',
              borderRadius: '6px',
              fontSize: '12px'
            }}
          >
            {enumOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </PanelRow>
      );
    }

    if (control === 'color') {
      return (
        <PanelRow key={f.path} label={visibleLabel}>
        <ColorSwatch
          value={getAtPath(design, f.path) || ''}
          onChange={onChange}
            placeholder={placeholderForKey(f.key) || '#000000'}
        />
        </PanelRow>
      );
    }

    if (control === 'boolean') {
      const checked = !!getAtPath(design, f.path);
      return (
        <PanelRow key={f.path} label={visibleLabel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 14, height: 14 }}
          />
          </div>
        </PanelRow>
      );
    }

    // number → SmartInput as plain number
    if (control === 'number') {
      return (
        <PanelRow key={f.path} label={visibleLabel}>
        <SmartInput
          value={String(getAtPath(design, f.path) ?? '')}
          onChange={(val) => onChange(val)}
            placeholder={placeholderForKey(f.key) || '0'}
          label={f.path}
          style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
        </PanelRow>
      );
    }

    // length or text
    const isLength = control === 'length';
    const value = String(getAtPath(design, f.path) ?? '');
    return (
      <PanelRow key={f.path} label={visibleLabel}>
      <SmartInput
        value={value}
        onChange={(val) => onChange(val)}
          placeholder={isLength ? (placeholderForKey(f.key) || 'e.g., 1rem 0') : ''}
        label={f.path}
        style={{ background: '#2a2a2a', color: '#fff', padding: 8, borderRadius: 4, border: '1px solid #444', fontSize: 12 }}
        />
      </PanelRow>
    );
  };

  // --- Components panel (if present) ---
  let componentPanel: React.ReactNode = null;
  // --- Sections panel (if present) ---
  let sectionPanel: React.ReactNode = null;

  // Helper: intelligently filter responsive fields based on current viewport
  const filterByViewport = (fields: Field[]): Field[] => {
    const responsiveGroups = new Map<string, Field[]>();
    const nonResponsiveFields: Field[] = [];

    // Group fields by their base property name
    for (const field of fields) {
      const leafKey = field.path.split('.').pop() || '';
      
      // Check for various responsive patterns
      const objSuffixMatch = field.path.match(/\.(mobile|tablet|desktop)$/);
      const lgSuffixMatch = leafKey.match(/^(.+?)Lg$/);
      const mdSuffixMatch = leafKey.match(/^(.+?)Md$/);
      const smSuffixMatch = leafKey.match(/^(.+?)Sm$/);
      
      if (objSuffixMatch) {
        // Pattern: path.mobile, path.desktop
        const basePath = field.path.replace(/\.(mobile|tablet|desktop)$/, '');
        const baseKey = basePath.split('.').pop() || '';
        if (!responsiveGroups.has(baseKey)) responsiveGroups.set(baseKey, []);
        responsiveGroups.get(baseKey)!.push(field);
      } else if (lgSuffixMatch) {
        // Pattern: fontSizeLg (desktop)
        const baseKey = lgSuffixMatch[1];
        if (!responsiveGroups.has(baseKey)) responsiveGroups.set(baseKey, []);
        responsiveGroups.get(baseKey)!.push(field);
      } else if (mdSuffixMatch) {
        // Pattern: fontSizeMd (tablet) - usually skip these
        const baseKey = mdSuffixMatch[1];
        if (!responsiveGroups.has(baseKey)) responsiveGroups.set(baseKey, []);
        responsiveGroups.get(baseKey)!.push(field);
      } else if (smSuffixMatch) {
        // Pattern: fontSizeSm (mobile) - usually skip these
        const baseKey = smSuffixMatch[1];
        if (!responsiveGroups.has(baseKey)) responsiveGroups.set(baseKey, []);
        responsiveGroups.get(baseKey)!.push(field);
      } else {
        // Check if this could be a base responsive field
        const possibleResponsiveKeys = [`${leafKey}Lg`, `${leafKey}Md`, `${leafKey}Sm`];
        const hasResponsiveVariants = fields.some(f => {
          const otherLeafKey = f.path.split('.').pop() || '';
          return possibleResponsiveKeys.includes(otherLeafKey);
        });
        
        if (hasResponsiveVariants) {
          // This is a base field with responsive variants
          if (!responsiveGroups.has(leafKey)) responsiveGroups.set(leafKey, []);
          responsiveGroups.get(leafKey)!.push(field);
        } else {
          // Non-responsive field
          nonResponsiveFields.push(field);
        }
      }
    }

    const filteredFields: Field[] = [...nonResponsiveFields];

    // For each responsive group, select the appropriate field based on viewport
    for (const [baseKey, groupFields] of responsiveGroups) {
      let selectedField: Field | null = null;

      if (viewport === 'desktop') {
        // Desktop: prefer Lg suffix, fallback to Md, then base
        selectedField = groupFields.find(f => f.path.endsWith('.desktop') || f.path.endsWith('Lg')) ||
                      groupFields.find(f => f.path.endsWith('Md')) ||
                      groupFields.find(f => !f.path.includes('.mobile') && !f.path.includes('.tablet') && 
                                            !f.path.endsWith('Md') && !f.path.endsWith('Sm') && !f.path.endsWith('Lg')) ||
                      groupFields[0];
      } else {
        // Mobile: prefer base field (fontSize), avoid desktop variants
        selectedField = groupFields.find(f => !f.path.includes('.desktop') && !f.path.includes('.tablet') && 
                                              !f.path.endsWith('Lg') && !f.path.endsWith('Md')) ||
                       groupFields.find(f => f.path.endsWith('.mobile') || f.path.endsWith('Sm')) ||
                       groupFields[0];
      }

      if (selectedField) {
        filteredFields.push(selectedField);
      }
    }

    return filteredFields;
  };

  // Build a dynamic sections panel based on the current selection's sectionId
  const sectionId: string | null = elementTokens.sectionId || activeElement?.sectionId || null;
  // Show section panel only when clicking section background/root (not any descendant)
  const isDirectSectionClick = !!selectedElement && (
    selectedElement.matches?.('[data-section-id]') ||
    selectedElement.matches?.('.inner-section') ||
    selectedElement.closest?.('[data-section-id]') === selectedElement.parentElement
  );
  const tokenMatches: any[] = Array.isArray(activeElement?.tokenMatches) ? activeElement!.tokenMatches : [];
  const hasSectionMatches = tokenMatches.some((m) => String(m?.tokenPath || m?.path || '').includes('sections.'));
  
  // Require NOT being inside a card to render the section panel
  if (!cardType && (hasSectionMatches || isDirectSectionClick) && sectionId && design?.sections?.[sectionId] && typeof design.sections[sectionId] === 'object') {
    const secBaseObj = design.sections[sectionId];
    const secBasePath = `sections.${sectionId}`;
    const allSec = filterByViewport(collectFields(secBaseObj, secBasePath));
    const outerFields = allSec.filter((f) => f.path.startsWith(`${secBasePath}.layout.`) && !f.path.startsWith(`${secBasePath}.layout.inner.`));
    const innerFields = allSec.filter((f) => f.path.startsWith(`${secBasePath}.layout.inner.`));

    const groupsOuter = new Map<string, Field[]>();
    for (const f of outerFields) {
      const grp = groupForPath(`${secBasePath}.layout`, f.path);
      if (!groupsOuter.has(grp)) groupsOuter.set(grp, []);
      groupsOuter.get(grp)!.push(f);
    }
    const groupsInner = new Map<string, Field[]>();
    for (const f of innerFields) {
      const grp = groupForPath(`${secBasePath}.layout.inner`, f.path);
      if (!groupsInner.has(grp)) groupsInner.set(grp, []);
      groupsInner.get(grp)!.push(f);
    }
    sectionPanel = (
      <div>
        <SectionHeader title={`Section · ${sectionId} · Outer`} />
        {[...groupsOuter.keys()].sort().map((groupName) => {
          const fields = groupsOuter.get(groupName)!;
          const showHeader = shouldShowGroupHeader(`${secBasePath}.layout`, groupName, fields);
          return (
          <div key={`outer-${groupName}`}>
              {showHeader && <SectionHeader title={groupName === 'Misc' ? 'General' : groupName} />}
            <div style={{ display: 'grid', gap: 8 }}>
                {fields.map((f) => (
                <div key={f.path}>{renderField(f)}</div>
              ))}
            </div>
          </div>
          );
        })}
        {innerFields.length > 0 && (
          <>
            <SectionHeader title={`Section · ${sectionId} · Inner`} />
            {[...groupsInner.keys()].sort().map((groupName) => {
              const fields = groupsInner.get(groupName)!;
              const showHeader = shouldShowGroupHeader(`${secBasePath}.layout.inner`, groupName, fields);
              return (
              <div key={`inner-${groupName}`}>
                  {showHeader && <SectionHeader title={groupName === 'Misc' ? 'General' : groupName} />}
                <div style={{ display: 'grid', gap: 8 }}>
                    {fields.map((f) => (
                    <div key={f.path}>{renderField(f)}</div>
                  ))}
                </div>
              </div>
              );
            })}
          </>
        )}
      </div>
    );
  }
  if (cardType && design?.components?.[cardType] && typeof design.components[cardType] === 'object') {
    const baseObj = design.components[cardType];
    const basePath = `components.${cardType}`;

    // Add hardcoded specific controls for key card types to match legacy parity
    if (cardType === 'serviceCard') {
      componentPanel = renderServiceCardPanel(design, updateDesignLocal);
    } else if (cardType === 'travelPackageCard') {
      componentPanel = renderTravelPackageCardPanel(design, updateDesignLocal);
    } else if (cardType === 'testimonialCard') {
      componentPanel = renderTestimonialCardPanel(design, updateDesignLocal);
    } else if (cardType === 'whyFeatureCard') {
      componentPanel = renderWhyFeatureCardPanel(design, updateDesignLocal);
    } else if (cardType === 'contactCard') {
      componentPanel = renderContactCardPanel(design, updateDesignLocal);
    } else if (cardType === 'footerCard') {
      componentPanel = renderFooterCardPanel(design, updateDesignLocal);
    } else {
      // Fallback to dynamic system for other card types
    // Variants support (heuristic): if components.cardType.variants exists, show a dropdown and render only that variant
    const variantObj = baseObj?.variants && typeof baseObj.variants === 'object' ? baseObj.variants : undefined;
    const variantKeys = variantObj ? Object.keys(variantObj) : [];
    const activeVariant: string | undefined = baseObj?.activeVariant || (variantKeys[0] || undefined);

    const allFields = filterByViewport(collectFields(baseObj, basePath));
    const baseFields = allFields.filter(
      (f) => !f.path.startsWith(`${basePath}.variants.`) && f.path !== `${basePath}.activeVariant`
    );

    const groupsBase = new Map<string, Field[]>();
    for (const f of baseFields) {
      const grp = groupForPath(basePath, f.path);
      if (!groupsBase.has(grp)) groupsBase.set(grp, []);
      groupsBase.get(grp)!.push(f);
    }

    let variantSection: React.ReactNode = null;
    if (variantObj && activeVariant) {
      const variantFields = filterByViewport(allFields.filter((f) => f.path.startsWith(`${basePath}.variants.${activeVariant}`)));
      const variantBasePath = `${basePath}.variants.${activeVariant}`;
      const groupsVar = new Map<string, Field[]>();
      for (const f of variantFields) {
        const grp = groupForPath(variantBasePath, f.path);
        if (!groupsVar.has(grp)) groupsVar.set(grp, []);
        groupsVar.get(grp)!.push(f);
      }
      variantSection = (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
            <span style={{ color: '#9ca3af', fontSize: 12 }}>Variant</span>
            <select
              value={activeVariant}
              onChange={(e) => {
                const v = e.target.value;
                updateDesignLocal((prev: any) => {
                  const next = { ...prev };
                  setAtPath(next, `${basePath}.activeVariant`, v);
                  return next;
                });
              }}
              style={{ background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '4px 6px', fontSize: 12 }}
            >
              {variantKeys.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          {[...groupsVar.keys()].sort().map((groupName) => (
            <div key={groupName}>
              <SectionHeader title={groupName === 'Misc' ? 'Variant · General' : `Variant · ${groupName}`} />
              <div style={{ display: 'grid', gap: 8 }}>
                {groupsVar.get(groupName)!.map((f) => (
                  <div key={f.path}>{renderField(f)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    componentPanel = (
      <div>
        <SectionHeader title={`Components · ${cardType}`} />
        {[...groupsBase.keys()].sort().map((groupName) => (
          <div key={groupName}>
            <SectionHeader title={groupName === 'Misc' ? 'General' : groupName} />
            <div style={{ display: 'grid', gap: 8 }}>
              {groupsBase.get(groupName)!.map((f) => (
                <div key={f.path}>{renderField(f)}</div>
              ))}
            </div>
          </div>
        ))}
        {variantSection}
      </div>
    );
    }
  }

  // --- Typography panel(s) (direct from data attributes) ---
  const variantSet = new Set<string>();
  
  // Add typography variants directly from data attributes
  for (const typographyKey of elementTokens.typography) {
    if (design?.tokens?.typography && Object.prototype.hasOwnProperty.call(design.tokens.typography, typographyKey)) {
      variantSet.add(typographyKey);
    }
  }
  
  // Legacy fallback: extract from tokenMatches for backward compatibility
  const matches: any[] = tokenMatches;
  for (const m of matches) {
    const p: string | undefined = m?.tokenPath || m?.path || m?.token;
    if (typeof p === 'string') {
      const re = /tokens\.typography\.([a-zA-Z0-9_]+)/;
      const mm = p.match(re);
      if (mm && mm[1]) variantSet.add(mm[1]);
    }
  }

  const typographyPanels: React.ReactNode[] = [];
  // Only show typography panels for matched variants; no global fallback
  for (const variant of Array.from(variantSet)) {
    const baseObj = design?.tokens?.typography?.[variant];
    if (!baseObj || typeof baseObj !== 'object') continue;
    const basePath = `tokens.typography.${variant}`;
    const fields = filterByViewport(collectFields(baseObj, basePath));
    // No grouping needed here; render flat or group by first-level child under variant
    const groups = new Map<string, Field[]>();
    for (const f of fields) {
      const grp = groupForPath(basePath, f.path);
      if (!groups.has(grp)) groups.set(grp, []);
      groups.get(grp)!.push(f);
    }
    typographyPanels.push(
      <div key={variant}>
        <SectionHeader title={`Typography · ${variant}`} />
        {[...groups.keys()].sort().map((groupName) => {
          const groupFields = groups.get(groupName)!;
          // Avoid duplicate labels: if the group is a single flat leaf (e.g., basePath.fontSize),
          // do not render a group header – just render the field row.
          const isSingleFlatLeaf = groupFields.length === 1 && !groupFields[0].path.replace(`${basePath}.`, '').includes('.');
          return (
          <div key={groupName}>
              {!isSingleFlatLeaf && groupName !== 'Misc' && <SectionHeader title={groupName} />} 
            <div style={{ display: 'grid', gap: 8 }}>
                {groupFields.map((f) => (
                <div key={f.path}>{renderField(f)}</div>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    );
  }

  // Only show the empty-state message when none of the panels will render
  if (!componentPanel && typographyPanels.length === 0 && !sectionPanel) {
    return <div style={{ color: '#999', fontSize: 12 }}>No design data for components.{cardType}. If you selected pure text, typography tokens will appear when available.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {sectionPanel}
      {componentPanel}
      {typographyPanels}
    </div>
  );
};

export default DbEditorConnector;
