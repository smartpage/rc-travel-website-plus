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
  - Dynamic token resolution: maps computed styles to design tokens
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

This document is the single reference for the Overlay Editor’s architecture and contracts. Keep it aligned with the code after each change.


