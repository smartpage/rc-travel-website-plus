# Design System

This document consolidates all design tokens, configuration system, React context, hooks, and TypeScript types powering the UI of the Cascais Happy Tours website.

---

## 1. Overview

The design system centralizes:

- **Visual tokens**: colors, spacing, typography, logos, buttons.
- **Section configurations**: layout, background, padding, responsive rules.
- **Component integration**: `Section`, `SectionTitle`, `TabGrid` slider.
- **Context & hooks**: `DesignContext`, `useDesign`.
- **Type definitions**: interfaces governing config shapes.

All tokens live in `src/config.ts` under the exported `design` object.

---

## 2. Configuration Object (`design`)

`src/config.ts` exports:

```ts
export const design = {
  colors: { /* color tokens */ },
  navigation: { /* menuOverlay, hamburger */ },
  faq: { /* FAQ card and arrow styles */ },
  logos: { main: { url, height, ... }, inverted: { ... } },
  buttonStyles: { primary, tab, container },
  sections: { /* per-section layout & style configs */ },
  hero_headings, preTitle, preTitleInverted,
  titleDescription, titleDescriptionInverted,
  headings, headingsInverted,
  buttons: { primary, secondary, whatsapp },
  sliderOptions: { loop, dots, autoplay, autoplayDelay, slidesToShow, gap, dragFree, colors }
} as const;
```

### 2.1 Colors
- `design.colors.primary`, `.primaryHover`, `.primaryLight`, `.primaryDark`
- `secondary`, `background`, `text`, `textMuted`, `accent`, `highlight`, `success`, `warning`, `error`, `border`, etc.

### 2.2 Navigation
- `design.navigation.menuOverlay`: `backgroundColor`, `linkColor`, `linkHoverColor`
- `design.navigation.hamburger`: bar colors, thickness, backdrop styles

### 2.3 Logos
- `design.logos.main` & `.inverted`: `url`, `height`/`heightMd`/`heightLg`, `objectFit`

### 2.4 Button Styles
- `design.buttonStyles.primary`: base classes, `backgroundColor`, `borderHover`, `rounded`, `padding`, `shadow`
- `design.buttonStyles.tab`: regular, active styles, container backgrounds

### 2.5 Section Configurations
Each key in `design.sections` (e.g. `hero`, `travelPackages`, `whyTravel`, `travelDesigner`, etc.) defines a `layout`:

```ts
interface SectionLayout {
  maxWidth: string;
  backgroundColor?: string;
  padding: { mobile: string; tablet: string; desktop: string; };
  inner: {
    maxWidth: string;
    overflow: string;
    rounded: boolean;
    background: { type: 'color' | 'image'; value: string; overlay?: {...} };
  };
}
```

These drive the `<Section>` component's responsive styles.

### 2.6 Typography Variants
- `hero_headings`, `headings`, `headingsInverted`: font families, sizes per breakpoint, `letterSpacing`, `fontWeight`, `color`, `textAlign`.
- `preTitle`, `preTitleInverted`: subtitle styles.
- `titleDescription`, `titleDescriptionInverted`: description styles.

### 2.7 Buttons
Under `design.buttons`:
```ts
buttons: {
  primary: { text, bg, hover, textColor, fontWeight },
  secondary: { ... },
  whatsapp: { ... }
}
```
These define default text and Tailwind CSS classes for CTA buttons.

### 2.8 Slider Options
`design.sliderOptions` for Embla Carousel:
- `loop`, `dots`, `autoplay`, `autoplayDelay`, `slidesToShow`, `gap`, `dragFree`
- `colors`: `dotActive`, `dotInactive`, `arrows`, `arrowsHover`

---

## 3. React Context & Hook

### 3.1 DesignContext
Defined in `src/contexts/DesignContext.tsx`:

```ts
export interface DesignContextType {
  design: DesignConfig;
  loading: boolean;
  error: string | null;
  siteId: string;
  setSiteId: (id: string) => void;
}
const DesignContext = createContext<DesignContextType|undefined>(undefined);
```

### 3.2 DesignProvider
```tsx
<DesignProvider defaultSiteId="hugo-ramos-nomadwise">
  <App />
</DesignProvider>
```
- Fetches remote design or falls back to local `design`.
- Exposes `design`, `loading`, `error`, `siteId`, `setSiteId`.

### 3.3 useDesign Hook
```ts
export const useDesign = (): DesignContextType => {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesign must be used within DesignProvider');
  return ctx;
};
```

---

## 4. Core UI Components

### 4.1 Section Component
- Located at `src/components/ui/Section.tsx`.
- Props:
  - `sectionId: string` → key in `design.sections`.
  - `backgroundImageUrl?: string` → override.
- Responsibilities:
  1. Wrap content in `<section id={uniqueId}>` and inner `<div>`.
  2. Inject responsive CSS (`<style>`) for padding, backgrounds, overlays.
  3. Scope styles via unique IDs to avoid collisions.

### 4.2 SectionTitle Component
- Located at `src/components/ui/SectionTitle.tsx`.
- Props: `subtitle`, `title`, `description`, `variant?: string`.
- Renders H tags and P tags styled via `useDesign()` tokens.
- Supports dynamic overrides of colors via props.

---

## 5. Type Definitions

Found in `DesignContext.tsx`:

- `SectionPadding` – breakpoints for padding
- `SectionBackground` – image/color backgrounds + overlay options
- `SectionInnerLayout` – wrapper styles
- `SectionLayout` – section layout
- `SectionConfig` – `{ layout: SectionLayout }`
- `TravelPackageCardConfig` – detailed card styling for travel packages
- `DesignConfig` – full shape of `design` object
- `SiteConfig` – site metadata and content field definitions
- `AgentConfig` – contact/agent info
- `DesignContextType` – context value shape

---

## 6. Integration Patterns

- **Manifest-driven sections**: UI components (`TravelPackages`, `TabGrid`) read `siteIndex.json` and render via `<Section sectionId="..." />`.
- **Design tokens**: All static styles are sourced from `design` to eliminate inline classes and hardcoded values.
- **Responsive behaviour**: Breakpoints (`mobile`, `tablet`, `desktop`) in both layout and typography ensure fluid UI.
- **Slider vs Grid**: `TabGrid` uses `useSlider` flag to switch between grid layout and Embla Carousel, consuming `design.sliderOptions`.

---

## 7. Further Reading

- `src/config.ts`: full token definitions.
- `src/contexts/DesignContext.tsx`: context and types.
- UI components under `src/components/ui`.

---

*Document generated by AI consolidation.*
