# EDITABLE COMPONENT PATTERN

This document defines the complete pattern for creating properly editable components in the design system. Every component that should be editable through the Design Inspector must follow this exact pattern.

## Table of Contents

1. [Overview](#overview)
2. [Component Implementation](#component-implementation)
3. [Token Structure (dbV2.json)](#token-structure-dbv2json)
4. [Design Inspector Integration](#design-inspector-integration)
5. [Input Types & Controls](#input-types--controls)
6. [Typography Integration](#typography-integration)
7. [Complete Examples](#complete-examples)
8. [Validation Checklist](#validation-checklist)

---

## Overview

**The 5-Step Pattern:**
1. **Component**: Use `Card` wrapper with proper `data-card-type` and token consumption
2. **Tokens**: Define complete token structure in `dbV2.json` under `components.{cardType}`
3. **Typography**: Add typography tokens under `tokens.typography.{cardType}.*`
4. **Inspector**: Create card-specific panel in `DesignInspectorContent.tsx`
5. **Validation**: Test that all controls work and are properly connected

---

## Component Implementation

### Required Imports
```tsx
import { useDesign } from '@/contexts/DesignContext';
import { Card } from '@/components/ui/card';
```

### Token Resolver Function (Standard Pattern)
Every component must include this exact resolver:

```tsx
// Token resolver helper (standard pattern from other components)
const resolveTokenRef = (val: any): any => {
  if (typeof val !== 'string') return val;
  if (!val.startsWith('tokens.')) return val;
  try {
    const path = val.replace(/^tokens\./, '');
    const keys = path.split('.');
    let cur: any = design?.tokens || {};
    for (const k of keys) {
      if (cur && typeof cur === 'object' && k in cur) cur = cur[k]; else return undefined;
    }
    return cur ?? undefined;
  } catch { return undefined; }
};
```

### Card Wrapper Structure
```tsx
<Card
  className="additional-classes-if-needed"
  data-card-type="yourCardType"        // MANDATORY - must match inspector routing
  data-card-variant="standard"         // Optional - for variants
  style={{
    // All style properties must consume tokens with resolveTokenRef + ?? fallback
    backgroundColor: resolveTokenRef(cardTokens.backgroundColor) ?? 'transparent',
    borderColor: resolveTokenRef(cardTokens.borderColor) ?? '#e5e7eb',
    borderWidth: cardTokens.borderWidth ?? '1px',
    borderRadius: cardTokens.borderRadius ?? '8px',
    padding: cardTokens.padding ?? '1rem',
    boxShadow: cardTokens.shadow ?? 'none',
  }}
>
  {/* Card content */}
</Card>
```

### Token Consumption Pattern
```tsx
// Get tokens from design system
const { design } = useDesign();
const cardTokens = design.components?.yourCardType || {};
const textTokens = cardTokens.text || {};

// Apply styles using resolveTokenRef + ?? fallback (NEVER use ||)
style={{
  fontFamily: resolveTokenRef(textTokens.fontFamily) ?? design.tokens?.typography?.body?.fontFamily,
  fontSize: resolveTokenRef(textTokens.fontSize) ?? '1rem',
  fontWeight: resolveTokenRef(textTokens.fontWeight) ?? '400',
  color: resolveTokenRef(textTokens.color) ?? '#000000',
}}
```

### Typography Data Attributes
```tsx
<h3 data-typography="yourCardType.title">Title</h3>
<p data-typography="yourCardType.body">Content</p>
```

---

## Token Structure (dbV2.json)

### Component Tokens Location
All component tokens go under `designV2.components.{cardType}`:

```json
{
  "designV2": {
    "components": {
      "yourCardType": {
        "backgroundColor": "transparent",
        "borderColor": "#e5e7eb", 
        "borderWidth": "1px",
        "borderRadius": "8px",
        "padding": "1rem",
        "shadow": "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        "text": {
          "fontFamily": "tokens.typography.body.fontFamily",
          "fontSize": "1rem",
          "fontWeight": "400",
          "lineHeight": "1.5",
          "color": "tokens.colors.text"
        }
      }
    }
  }
}
```

### Typography Tokens Location
Typography tokens go under `designV2.tokens.typography.{cardType}*`:

```json
{
  "designV2": {
    "tokens": {
      "typography": {
        "yourCardTypeTitle": {
          "fontFamily": "Inter, sans-serif",
          "fontSize": "1.25rem",
          "fontWeight": "600",
          "lineHeight": "1.4",
          "color": "#1f2937"
        },
        "yourCardTypeBody": {
          "fontFamily": "Inter, sans-serif", 
          "fontSize": "0.875rem",
          "fontWeight": "400",
          "lineHeight": "1.5",
          "color": "#6b7280"
        }
      }
    }
  }
}
```

### Token Reference Strings
Use `"tokens.*"` strings to reference other tokens:
- `"tokens.colors.primary"` → references `designV2.tokens.colors.primary`
- `"tokens.typography.body.fontFamily"` → references `designV2.tokens.typography.body.fontFamily`

---

## Design Inspector Integration

### Panel Routing
Add your card type to the inspector routing in `DesignInspectorContent.tsx`:

```tsx
{/* Your Card Design Section */}
{(activeElement?.cardType === 'yourCardType') && (
  <div style={{ marginTop: 16, padding: 12, background: '#1e1e1e', borderRadius: 8, border: '1px solid #333' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: '#facc15', fontWeight: 'bold' }}>
        Your Card Type
      </span>
    </div>

    {/* Controls go here */}
  </div>
)}
```

### Panel Structure
Use `PanelRow` components for each control group:

```tsx
<PanelRow label="Background Color">
  <ColorSwatch
    value={design?.components?.yourCardType?.backgroundColor || 'transparent'}
    onChange={(val) => updateDesignLocal((prev: any) => {
      const d = { ...prev } as any;
      if (!d.components) d.components = {};
      if (!d.components.yourCardType) d.components.yourCardType = {};
      d.components.yourCardType.backgroundColor = val;
      return d;
    })}
    placeholder="transparent"
  />
</PanelRow>
```

---

## Input Types & Controls

### ColorSwatch (For Colors)
**Use for:** Any color property (background, border, text color, etc.)

```tsx
<PanelRow label="Background Color">
  <ColorSwatch
    value={design?.components?.cardType?.backgroundColor || '#ffffff'}
    onChange={(val) => updateDesignLocal((prev: any) => {
      const d = { ...prev } as any;
      if (!d.components) d.components = {};
      if (!d.components.cardType) d.components.cardType = {};
      d.components.cardType.backgroundColor = val;
      return d;
    })}
    placeholder="#ffffff"
  />
</PanelRow>
```

**Features:**
- Color picker popup
- Hex/RGB/HSL input
- Opacity slider
- Color swatches
- Recent colors

### SmartInput (For Text, Sizes, Numbers)
**Use for:** Text values, dimensions, font sizes, weights, etc.

```tsx
<PanelRow label="Border Width">
  <SmartInput
    value={design?.components?.cardType?.borderWidth || '1px'}
    onChange={(val) => updateDesignLocal((prev: any) => {
      const d = { ...prev } as any;
      if (!d.components) d.components = {};
      if (!d.components.cardType) d.components.cardType = {};
      d.components.cardType.borderWidth = val;
      return d;
    })}
    placeholder="1px"
    label="components.cardType.borderWidth"  // For numeric detection
  />
</PanelRow>
```

**Features:**
- **Increment/Decrement Arrows:** Appear when value is numeric or when `label` indicates numeric property
- **Unit Preservation:** Maintains px, rem, em, %, vh, vw units
- **Multi-value Support:** Handles values like "2rem 1rem" (padding shorthand)
- **Smart Stepping:** Different step sizes for different units (px: 1, rem: 0.25, %: 5)

**Numeric Detection Rules:**
1. **Label hints:** Pass canonical token path as `label` prop (e.g., `"sections.hero.layout.inner.borderRadius"`)
2. **Value detection:** Current value contains numbers with units
3. **Property inference:** Label contains keywords like `fontSize`, `width`, `height`, `padding`, `margin`, `borderRadius`

### ResponsiveInput (For Responsive Values)
**Use for:** Values that need different settings per breakpoint

```tsx
<PanelRow label="Padding">
  <ResponsiveInput
    value={design?.sections?.[activeSectionId]?.layout?.padding || { mobile: '1rem', tablet: '2rem', desktop: '3rem' }}
    onChange={(val) => updateDesignLocal((prev: any) => {
      const d = { ...prev } as any;
      if (!d.sections) d.sections = {};
      if (!d.sections[activeSectionId]) d.sections[activeSectionId] = { layout: {} };
      d.sections[activeSectionId].layout.padding = val;
      return d;
    })}
    placeholder={{ mobile: '1rem', tablet: '2rem', desktop: '3rem' }}
  />
</PanelRow>
```

### updateDesignLocal Pattern
**CRITICAL:** Always use this exact pattern for onChange handlers:

```tsx
onChange={(val) => updateDesignLocal((prev: any) => {
  const d = { ...prev } as any;                    // Clone design object
  
  // Ensure parent objects exist
  if (!d.components) d.components = {};
  if (!d.components.cardType) d.components.cardType = {};
  
  // Set the value
  d.components.cardType.propertyName = val;
  
  return d;                                        // Return mutated copy
})}
```

---

## Typography Integration

### Component Data Attributes
Add `data-typography` hints to text elements:

```tsx
<h3 data-typography="cardType.title">Title</h3>
<p data-typography="cardType.body">Body text</p>
```

### Typography Token Structure
Create corresponding typography tokens:

```json
{
  "tokens": {
    "typography": {
      "cardTypeTitle": {
        "fontFamily": "Inter, sans-serif",
        "fontSize": "1.25rem", 
        "fontWeight": "600",
        "lineHeight": "1.4",
        "color": "#1f2937"
      },
      "cardTypeBody": {
        "fontFamily": "Inter, sans-serif",
        "fontSize": "0.875rem",
        "fontWeight": "400", 
        "lineHeight": "1.5",
        "color": "#6b7280"
      }
    }
  }
}
```

### Typography Inspector Controls
Add typography controls to your panel:

```tsx
<PanelRow label="Title Font Size">
  <SmartInput
    value={design?.tokens?.typography?.cardTypeTitle?.fontSize || '1.25rem'}
    onChange={(val) => updateDesignLocal((prev: any) => {
      const d = { ...prev } as any;
      if (!d.tokens) d.tokens = {};
      if (!d.tokens.typography) d.tokens.typography = {};
      if (!d.tokens.typography.cardTypeTitle) d.tokens.typography.cardTypeTitle = {};
      d.tokens.typography.cardTypeTitle.fontSize = val;
      return d;
    })}
    placeholder="1.25rem"
    label="tokens.typography.cardTypeTitle.fontSize"
  />
</PanelRow>
```

---

## Complete Examples

### Example 1: Simple Card Component

**Component (MyCard.tsx):**
```tsx
import { useDesign } from '@/contexts/DesignContext';
import { Card } from '@/components/ui/card';

const MyCard = ({ title, content }: { title: string; content: string }) => {
  const { design } = useDesign();
  
  const resolveTokenRef = (val: any): any => {
    if (typeof val !== 'string') return val;
    if (!val.startsWith('tokens.')) return val;
    try {
      const path = val.replace(/^tokens\./, '');
      const keys = path.split('.');
      let cur: any = design?.tokens || {};
      for (const k of keys) {
        if (cur && typeof cur === 'object' && k in cur) cur = cur[k]; else return undefined;
      }
      return cur ?? undefined;
    } catch { return undefined; }
  };

  const cardTokens = design.components?.myCard || {};
  const textTokens = cardTokens.text || {};

  return (
    <Card
      data-card-type="myCard"
      data-card-variant="standard"
      style={{
        backgroundColor: resolveTokenRef(cardTokens.backgroundColor) ?? 'transparent',
        borderColor: resolveTokenRef(cardTokens.borderColor) ?? '#e5e7eb',
        borderWidth: cardTokens.borderWidth ?? '1px',
        padding: cardTokens.padding ?? '1rem',
        borderRadius: cardTokens.borderRadius ?? '8px',
      }}
    >
      <h3
        data-typography="myCard.title"
        style={{
          fontFamily: resolveTokenRef(textTokens.titleFontFamily) ?? design.tokens?.typography?.body?.fontFamily,
          fontSize: resolveTokenRef(textTokens.titleFontSize) ?? '1.25rem',
          fontWeight: resolveTokenRef(textTokens.titleFontWeight) ?? '600',
          color: resolveTokenRef(textTokens.titleColor) ?? '#1f2937',
        }}
      >
        {title}
      </h3>
      <p
        data-typography="myCard.body"
        style={{
          fontFamily: resolveTokenRef(textTokens.bodyFontFamily) ?? design.tokens?.typography?.body?.fontFamily,
          fontSize: resolveTokenRef(textTokens.bodyFontSize) ?? '0.875rem',
          fontWeight: resolveTokenRef(textTokens.bodyFontWeight) ?? '400',
          color: resolveTokenRef(textTokens.bodyColor) ?? '#6b7280',
        }}
      >
        {content}
      </p>
    </Card>
  );
};
```

**Tokens (dbV2.json):**
```json
{
  "designV2": {
    "components": {
      "myCard": {
        "backgroundColor": "transparent",
        "borderColor": "#e5e7eb",
        "borderWidth": "1px", 
        "borderRadius": "8px",
        "padding": "1rem",
        "text": {
          "titleFontFamily": "tokens.typography.body.fontFamily",
          "titleFontSize": "1.25rem",
          "titleFontWeight": "600", 
          "titleColor": "#1f2937",
          "bodyFontFamily": "tokens.typography.body.fontFamily",
          "bodyFontSize": "0.875rem",
          "bodyFontWeight": "400",
          "bodyColor": "#6b7280"
        }
      }
    },
    "tokens": {
      "typography": {
        "myCardTitle": {
          "fontFamily": "Inter, sans-serif",
          "fontSize": "1.25rem",
          "fontWeight": "600",
          "lineHeight": "1.4",
          "color": "#1f2937"
        },
        "myCardBody": {
          "fontFamily": "Inter, sans-serif",
          "fontSize": "0.875rem", 
          "fontWeight": "400",
          "lineHeight": "1.5",
          "color": "#6b7280"
        }
      }
    }
  }
}
```

**Inspector Panel (DesignInspectorContent.tsx):**
```tsx
{/* My Card Design Section */}
{(activeElement?.cardType === 'myCard') && (
  <div style={{ marginTop: 16, padding: 12, background: '#1e1e1e', borderRadius: 8, border: '1px solid #333' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: '#facc15', fontWeight: 'bold' }}>
        My Card
      </span>
    </div>

    {/* Background */}
    <PanelRow label="Background Color">
      <ColorSwatch
        value={design?.components?.myCard?.backgroundColor || 'transparent'}
        onChange={(val) => updateDesignLocal((prev: any) => {
          const d = { ...prev } as any;
          if (!d.components) d.components = {};
          if (!d.components.myCard) d.components.myCard = {};
          d.components.myCard.backgroundColor = val;
          return d;
        })}
        placeholder="transparent"
      />
    </PanelRow>

    {/* Border */}
    <PanelRow label="Border Color">
      <ColorSwatch
        value={design?.components?.myCard?.borderColor || '#e5e7eb'}
        onChange={(val) => updateDesignLocal((prev: any) => {
          const d = { ...prev } as any;
          if (!d.components) d.components = {};
          if (!d.components.myCard) d.components.myCard = {};
          d.components.myCard.borderColor = val;
          return d;
        })}
        placeholder="#e5e7eb"
      />
    </PanelRow>

    <PanelRow label="Border Width">
      <SmartInput
        value={design?.components?.myCard?.borderWidth || '1px'}
        onChange={(val) => updateDesignLocal((prev: any) => {
          const d = { ...prev } as any;
          if (!d.components) d.components = {};
          if (!d.components.myCard) d.components.myCard = {};
          d.components.myCard.borderWidth = val;
          return d;
        })}
        placeholder="1px"
        label="components.myCard.borderWidth"
      />
    </PanelRow>

    {/* Typography */}
    <PanelRow label="Title Color">
      <ColorSwatch
        value={design?.components?.myCard?.text?.titleColor || '#1f2937'}
        onChange={(val) => updateDesignLocal((prev: any) => {
          const d = { ...prev } as any;
          if (!d.components) d.components = {};
          if (!d.components.myCard) d.components.myCard = {};
          if (!d.components.myCard.text) d.components.myCard.text = {};
          d.components.myCard.text.titleColor = val;
          return d;
        })}
        placeholder="#1f2937"
      />
    </PanelRow>

    <PanelRow label="Title Font Size">
      <SmartInput
        value={design?.components?.myCard?.text?.titleFontSize || '1.25rem'}
        onChange={(val) => updateDesignLocal((prev: any) => {
          const d = { ...prev } as any;
          if (!d.components) d.components = {};
          if (!d.components.myCard) d.components.myCard = {};
          if (!d.components.myCard.text) d.components.myCard.text = {};
          d.components.myCard.text.titleFontSize = val;
          return d;
        })}
        placeholder="1.25rem"
        label="components.myCard.text.titleFontSize"
      />
    </PanelRow>
  </div>
)}
```

---

## Validation Checklist

### Component Validation
- [ ] Component uses `Card` wrapper with `data-card-type`
- [ ] Includes standard `resolveTokenRef` function
- [ ] All styles use `resolveTokenRef(value) ?? fallback` pattern
- [ ] No `||` fallbacks with token values (use `??` only)
- [ ] Typography elements have `data-typography` attributes
- [ ] Token consumption follows `design.components.{cardType}.*` pattern

### Token Validation  
- [ ] Component tokens exist in `designV2.components.{cardType}`
- [ ] Typography tokens exist in `designV2.tokens.typography.{cardType}*`
- [ ] Token references use `"tokens.*"` format
- [ ] All token paths are complete and valid
- [ ] Default fallback values are sensible

### Inspector Validation
- [ ] Panel routing checks `activeElement?.cardType === 'yourCardType'`
- [ ] Uses `ColorSwatch` for color properties
- [ ] Uses `SmartInput` for text/numeric properties
- [ ] All `onChange` handlers use `updateDesignLocal` pattern
- [ ] Proper object nesting with existence checks
- [ ] Placeholder values match token defaults

### Integration Validation
- [ ] Component appears in design mode with card handle
- [ ] Clicking card handle opens correct inspector panel
- [ ] All controls are visible and labeled correctly
- [ ] Color controls show color swatches
- [ ] Numeric controls show increment/decrement arrows
- [ ] Changes in inspector immediately update component
- [ ] Save functionality persists changes to dbV2.json

### Testing Process
1. **Design Mode**: Add `?design=1` to URL
2. **Card Selection**: Click card handle (should open inspector)
3. **Control Testing**: Verify each control works and updates component
4. **Save Testing**: Click "Save All Changes" and verify persistence
5. **Page Reload**: Confirm changes persist after reload

---

## Common Mistakes

### ❌ WRONG: Using || with tokens
```tsx
backgroundColor: design.components?.card?.backgroundColor || '#ffffff'
// Token strings are truthy, so fallback never applies
```

### ✅ CORRECT: Using resolveTokenRef + ??
```tsx
backgroundColor: resolveTokenRef(design.components?.card?.backgroundColor) ?? '#ffffff'
// Returns undefined if token missing, ?? applies fallback
```

### ❌ WRONG: Missing data-card-type
```tsx
<div className="card">  // Inspector can't route to this
```

### ✅ CORRECT: Proper Card wrapper
```tsx
<Card data-card-type="myCard">  // Inspector routes correctly
```

### ❌ WRONG: Inspector panel wrong condition
```tsx
{(activeElement?.label?.includes('card')) && (  // Fragile string matching
```

### ✅ CORRECT: Proper card type checking
```tsx
{(activeElement?.cardType === 'myCard') && (  // Exact card type match
```

### ❌ WRONG: Basic input for colors
```tsx
<SmartInput value={color} onChange={setColor} />  // No color picker
```

### ✅ CORRECT: ColorSwatch for colors
```tsx
<ColorSwatch value={color} onChange={setColor} />  // Full color picker UI
```

---

This pattern ensures consistent, reliable, and fully-editable components throughout the design system. Every editable component must follow this exact pattern to work properly with the Design Inspector.
