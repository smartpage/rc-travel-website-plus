## TODO / PLAN – Class Override System (Reusable classes from single design JSON)

- Add two structures to the single design JSON:
  - `design.classes`: registry of reusable class sets with optional viewport variants and `extends` for composition.
  - `design.classRules`: declarative rules that map element metadata → one or more named class sets (plus ad‑hoc utilities), with `mode` append|replace.
- Centralize logic in `src/lib/tokenResolver.ts` by adding `resolveClassOverrides(design, meta, viewport)`:
  - Expands named sets (handles `extends`) from `design.classes`.
  - Matches rules by `sectionId | component | part | tag | elementId | index | dataTypography`.
  - Returns the final class string for the current viewport and a merge `mode` (append/replace).
- Minimal component changes: add stable data attributes and compose classes via a tiny helper:
  - Roots: `data-section-id`, `data-component="..."`
  - Subparts: `data-part="..."`
  - Optional: `data-element-id`, keep `data-typography` where relevant
  - Helper `useDesignClasses(meta, base)` → returns merged className
- Editor extension (later): a "Local classes" editor in the inspector writes to `design.classRules` and may create named sets under `design.classes` to keep overrides reusable.

Example JSON additions:

```
{
  "classes": {
    "headingXL": { "base": "font-bold tracking-tight", "mobile": "text-4xl", "desktop": "text-7xl" },
    "mutedText": { "base": "text-slate-400" },
    "cardSurface": { "base": "rounded-xl shadow-lg border border-white/10 bg-black/30" },
    "containerPad": { "mobile": "px-4", "tablet": "px-6", "desktop": "px-8" },
    "buttonBase": { "base": "inline-flex items-center justify-center rounded-md" },
    "buttonPrimary": { "extends": ["buttonBase"], "base": "bg-yellow-500 text-black hover:bg-yellow-600" }
  },
  "classRules": [
    { "match": { "component": "HeroSection", "part": "Wrapper" }, "use": ["containerPad","cardSurface"], "mode": "append" },
    { "match": { "sectionId": "hero", "tag": "H1" }, "use": ["headingXL"], "mode": "append" },
    { "match": { "component": "TravelPackages", "part": "CTAButton" }, "use": ["buttonPrimary"], "add": "text-base", "mode": "append" }
  ]
}
```

Integration snippet:

```
const { className, mode } = resolveClassOverrides(design, { sectionId, component: 'HeroSection', part: 'Wrapper', tag: 'DIV' }, viewport);
const final = mode === 'append' ? clsx(existing, className) : className;
```

---

## Overlay Editor – Architecture & Usage

```
App
└─ Providers (SettingsProvider → DesignProvider → SkeletonProvider → ContentProvider → TooltipProvider)
   └─ BrowserRouter
      └─ EditorOverlayProvider (GLOBAL - Provider-Only Architecture)
         ├─ (Normal Mode): @container wrapper → [site content]
         └─ (Design Mode ?design=1):
            ├─ EditorPanelsWrapper (fixed right) + SelectionOverlay
            │  ├─ EditorPanel[id=inspector] → DesignInspectorContent
            │  └─ EditorPanel[id=navigator] → SectionNavigatorContent  
            └─ ViewportToggleOverlay (responsive container + viewport toggle)
               └─ [site content rendered via portal]
```

```
EditorOverlayContext (Provider-Only Architecture)
└─ state
   ├─ collapsed: { inspector: boolean, navigator: boolean }
   ├─ enabled: boolean (?design=1 detection)
   ├─ overlayRect: DOMRect | null (highlight positioning)
   ├─ activeElement: { label, sectionId, tokenMatches } | null
   ├─ selectedElement: Element | null (DOM reference)
   ├─ scrollContainer: HTMLElement | null (for scroll sync)
   └─ viewport: 'desktop' | 'mobile'
└─ actions (ALL LOGIC IN PROVIDER)
   ├─ Panel Controls: toggleCollapse, setCollapsed
   ├─ Selection: setActiveElement, setSelectedElement, setOverlayRect
   ├─ Viewport: setViewport, setScrollContainer
   └─ Event Handlers: mousemove, click, scroll (automatic)
```

### What it is
- A lightweight, API‑first overlay for live editing design tokens and navigating active sections.
- Uses container queries to preview responsive styles inside a single animated container, without iframes.
- **NEW**: Dynamic element selection - click any element to automatically identify and edit its design tokens.
- **NEW**: Provider-Only Architecture - all overlay logic centralized in `EditorOverlayProvider` for better maintainability.

### Core pieces
- **EditorOverlayProvider** (Provider-Only Architecture)
  - Centralized event handling: mousemove, click, scroll listeners
  - Automatic `?design=1` detection and overlay state management
  - **Smart token resolution**: context-aware mapping of computed styles to design tokens
    - Prioritizes section-specific tokens (e.g., `hero_headings` over `headings`)
    - Enhanced matching: fontSize variants, color, fontWeight, fontFamily
    - Context-aware based on sectionId and element properties
    - See “Token Resolver Specification” below for exact rules
  - Excludes overlay UI elements via `data-overlay-ui="1"` filtering

- **SelectionOverlay**
  - Visual highlight box and label for selected elements
  - Follows elements on scroll with real-time position sync
  - Excluded from being selectable itself

- ViewportToggleOverlay
  - Animates the container width between desktop/mobile.
  - Background consumes `design.colors.background` to avoid white gutters.
  - Renders the actual site content inside the container via React portal.
  - **NEW**: Excluded from element selection via `data-overlay-ui="1"`

- EditorPanelsWrapper
  - Right‑side stack of panels, gap = 0.5rem.
  - Height is auto; wrapper collapses to content height.
  - Each child uses max‑height animation (60px when collapsed; natural height when open).

- EditorPanel (reusable)
  - Props: `id: 'inspector' | 'navigator'`, `title`, `subtitle`.
  - Renders a header (click → toggle) and a content slot.

- DesignInspectorContent
  - Edits tokens from `DesignContext` (e.g., `colors.primary`, `sections.{id}.layout.padding.*`, `sections.{id}.layout.inner.width`).
  - Actions: Preview (local update), Save (json‑server API), Revert (reload remote).
  - Section focus: clicking site elements sets an active section id (see “Selection & Scoping”).

- SectionNavigatorContent
  - Lists anchorable, active sections from `siteIndex` (filters navigation/footer).
  - Smooth scroll to anchors (e.g., Hero → `#home`, TravelPackages → `#packages`).

### Data sources
- Content & sections: API‑first (same as production). No local fallbacks in design mode for content/settings.
- Design tokens: local json‑server (`db.json`) while backend endpoints are pending.
  - GET uses `no-store` + timestamp to bypass caches.
  - Save tries PUT then PATCH (json‑server singleton pattern).

### Token Resolver Specification

The resolver translates a clicked DOM element into one or more design token targets.

Selection snapshot:
- Captures `tagName`, `fontFamily`, `fontSize`, `lineHeight`, `fontWeight`, `letterSpacing`, `color`, `backgroundColor` via `window.getComputedStyle`.
- Walks ancestors to infer background context: `light`/`dark`/`unknown` (checks classes like `bg-white`, `bg-black` and computed RGB brightness).

Priorities and rules:
- Headings: if tag is H1–H6
  - Inside `data-section-id="hero"` → target `hero_headings` (responsive).
  - Else → target `headings` (responsive).
- Paragraphs: if tag is `P`
  - If background context is `light` → target `typography.cardBody`.
  - Else → target `typography.body`.
- PreTitle and TitleDescription are suggested only for non-heading, non-paragraph text elements.
- Buttons/links: only for `BUTTON` and `A` tags → suggest `buttonStyles.primary|secondary|tab`.
- Section layout tokens are excluded from element-level matches.

Matching is heuristic but conservative:
- We no longer require strict value matches for headings/paragraphs; tag type and context drive the primary decision.
- For body text, font-size and line-height are applied globally via injected CSS with `!important` to ensure immediate visual feedback from the inspector.

Returned structure for each match:
```
type TokenMatch = {
  scope: 'global' | 'section';
  tokenPath: string;   // e.g., 'headings', 'hero_headings', 'typography.body'
  label: string;       // human friendly label
  responsive?: boolean;// true for families with mobile/tablet/desktop values
}
```

Limitations and next steps:
- Local overrides per-element are planned (not yet enabled).
- Improve background detection for complex overlays and images.
- Add weighting/similarity scoring to rank multiple potential matches when applicable.

### Tokenization & dynamic CSS
- Base section layout is centralized in `components/ui/Section.tsx`.
  - Supports tokens for `padding.mobile/tablet/desktop`, `inner.width`, `inner.minHeight`, `margin`, `overflow`.
  - Injects dynamic CSS and applies container queries (`@md:`, `@lg:`) so responsiveness depends on the wrapper size.
- All components should consume tokens; remove hardcoded values when encountered.

### Selection & Scoping (click‑to‑scope)
- Sections render `data-section-id`.
- A document click listener detects the nearest section and updates active section in the editor UI.
- Inspector inputs bind to `sections.{activeSectionId}.*` tokens.

### Proposed context extension (Overlay Editor Context)
Keep current behavior and expand as needed:
```
interface OverlayEditorState {
  collapsed: { inspector: boolean; navigator: boolean };
  activeSectionId: string | null;          // click‑to‑scope
  activeElementId: string | null;          // optional: deep element scope
  viewport: 'desktop' | 'mobile';          // single source of truth
  overlay: { show: boolean; rects: DOMRect[] }; // selection highlights
}
interface OverlayEditorActions {
  toggleCollapse(panel);
  setActiveSection(id | null);
  setActiveElement(id | null);
  setViewport(mode);
  setOverlay(rects | null);
  reset();
}
```
Usage:
- ViewportToggleOverlay → `setViewport(...)`.
- Section.tsx (or a small helper) → `setActiveSection(...)` on click; optional `setOverlay(...)` for highlight rects.
- Panels read `activeSectionId` and `collapsed` states to render.

### Editor UX contracts
- Desktop view: exact replica (no borders/containers altering layout) – only the animated container around content.
- Mobile view: responsive preview driven by container queries – not clipping, no separate modals/windows.
- One wrapper, one portal; no iframe recursion.
- Panels do not overlap the toggle and do not parse un‑anchorable components.

### Dev checklist
- Add `?design=1` to any URL to enable panels.
- When editing tokens, confirm that:
  - Section padding is not double‑applied (prefer Section.tsx tokens over per‑component paddings).
  - Mobile inner width ≈ `98%` when requested (via `sections.{id}.layout.inner.width`).
  - Background tokens are either transparent or explicit per design; avoid accidental inherited images.
- For sliders/grids, prefer tokenized widths and dot styles (`design.sliderOptions.*`).

### Common pitfalls
- “Desktop container changed layout”: ensure wrapper background only, not borders/margins; avoid styling `#root`.
- “Cards all share same background”: check section‑level `inner.background` token and per‑card conditions.
- “Container queries not triggering”: confirm parent has `@container` class and classes use `@md:` / `@lg:`.
- “404 on save”: backend pending; local json‑server is the current target.

### File map
- `src/components/ViewportToggleOverlay.tsx` – container animation + BG token
- `src/components/EditorPanelsWrapper.tsx` – wrapper and two panels (reusable)
- `src/components/EditorPanel.tsx` – header + slot; collapse behavior
- `src/components/DesignInspectorContent.tsx` – token editor UI
- `src/components/SectionNavigatorContent.tsx` – anchors list
- `src/contexts/EditorOverlayContext.tsx` – panel collapse state (ready to extend)
- `src/components/ui/Section.tsx` – dynamic CSS, container queries, layout tokens
- `db.json` – design tokens (local dev)

### Roadmap (incremental)
1) Extend `EditorOverlayContext` to the “Overlay Editor Context” shape above.
2) Wire `ViewportToggleOverlay` to context for a single source of truth.
3) Add `SelectionOverlay` component to render highlight rects above content.
4) Gradually migrate any remaining hardcoded styles to tokens.

### Performance Optimizations

The Overlay Editor implements several performance optimizations to ensure smooth interaction:

- **RAF throttling for hover updates**: Mousemove events are throttled using `requestAnimationFrame` to prevent excessive DOM rect calculations during hover detection
- **Stable refs to avoid effect churn**: Uses `React.useRef` for `activeElement`, `selectedElement`, `scrollContainer`, and `design` to maintain stable references and prevent unnecessary effect re-runs
- **Memoized comparisons for overlay rect updates**: Compares rect coordinates before updating state to avoid unnecessary re-renders when overlay position hasn't changed
- **Session storage for viewport persistence**: Viewport state (`desktop`/`mobile`) is persisted to `sessionStorage` to maintain user preference across page reloads

These optimizations ensure the editor remains responsive even with complex layouts and frequent user interactions.

This document is the single reference for the Overlay Editor's architecture and contracts. Keep it aligned with the code after each change.
