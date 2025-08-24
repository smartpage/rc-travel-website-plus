# Editor Selection Pipeline (Design Mode)

This document explains how the design-mode editor selection pipeline works in `rc-travel-website-plus`: how the card handle triggers selection, which files and contexts are involved, and how the inspector/overlay update.

## Quick questions (Typography · Testimonials)

1) Are testimonial text nodes labeled with the expected `data-typography` hints?
- Answer: In `src/components/TestimonialCard.tsx` the nodes use `testimonialCard.name` and `testimonialCard.text` in some versions. The resolver is wired to `testimonialCard.title`, `testimonialCard.location`, and `testimonialCard.body`. If these don’t match, the editor can’t bind and appears to fall back. Align the component to use the resolver’s keys (or extend the resolver to accept the current hints).

2) Do the specific typography tokens exist in the active dbV2?
- Answer: Ensure `designV2.tokens.typography.testimonialCardTitle`, `testimonialCardBody`, and `testimonialCardLocation` exist in `/public/dbV2.json`. If they’re only in `design-default.json`, the live editor won’t find specific tokens and will present global controls.

3) Why does it look like a global fallback and how can we disable it?
- Answer: The resolver adds global `headings/body` when it can’t map a specific token. For card contexts we can suppress that by checking `activeElement.cardType` and skipping global pushes if a card is selected but no precise typography hint matched. This prevents misleading global controls.

4) Why are contact card typography controls “disconnected” in the inspector?
- Answer: We completed steps 1–2 of the pipeline (DOM hints via `data-typography` and resolver mapping), but skipped step 3: binding the component’s render styles to the typography tokens. The resolver is not at fault; the component doesn’t read `design.tokens.typography.contactCardTitle` / `contactCardBody`, so inspector changes don’t reflect.

5) How to fix the contact card binding quickly?
- Answer: In `ContactSection.tsx`, for the `CardTitle` and its body `p`, read from `design.tokens.typography.contactCardTitle.*` and `design.tokens.typography.contactCardBody.*` (fontFamily, fontSize, lineHeight, fontWeight, color). Do this via inline styles or CSS variables consumed by classNames. Ensure those keys exist in `public/dbV2.json`.

6) Why are some components immediately responsive while others are not?
- Answer: Responsive components (e.g., `TestimonialCard.tsx`) read their styles directly from `design.tokens.typography.*` in their JSX styles, so when tokens change the UI updates instantly. Non-responsive ones rely only on `design.components.*` class strings and never consult the typography tokens; they therefore ignore inspector updates unless those classes happen to reference CSS variables wired to the same tokens.

> State sources
> - Source of truth: current saved dbV2 (as loaded in `DesignContext`)
> - Working copy: local in-memory design edits via `updateDesignLocal`
>
> Save flow (button)
> - Persist to local `public/dbV2.json` through the existing provisional save endpoint (`/api/save-dbv2`)
> - On success: update internal reference of last-saved design so the button disables when no diff exists

> Save function reference
> - `saveDesignToDBV2()` lives in `src/contexts/DesignContext.tsx` and is exposed via the DesignContext.
> - Always reuse this function for manual and auto-save operations.

## Auto Open (panel precedence switch)

- UX: Add a left-aligned toggle in the Design header named “Auto Open”. When ON, any selection via selector-hints should focus the Design panel and collapse others.
- Wiring: Use `EditorOverlayContext` (panel state lives here: `activePanelId`, `togglePanel`, etc.).
- Implementation notes:
  - Add `autoOpen` boolean in a small UI state (either `EditorOverlayContext` or a new context, persisted in localStorage `design_auto_open`).
  - In `EditorOverlayContext` click-selection handler, after computing `activeElement`, if `autoOpen === true`, call `setActivePanelId('inspector')` and optionally collapse others by design (single-open accordion already enforced).
  - Keep behavior gated to design mode only.


## Overview
- The editor is enabled by a URL query flag (`?design=1|true`).
- In design mode, editor UI (panels + selection overlay) mounts and the site content is rendered inside a fixed, centered container with class `@container`.
- Hover and click events are handled globally by `EditorOverlayContext` with strict gating rules so only page elements (not editor UI) are interactive.
- Clicking a card handle (`[data-card-selector]`) selects the whole card (`[data-card]`) and opens the Inspector. Clicking other elements selects the closest meaningful element.
- The overlay rectangle is computed from the selected element’s `getBoundingClientRect()` and is kept in sync on scroll/resize.
- The Inspector shows design token matches for the selected element via a snapshot + resolver.


## Key Files
- `src/App.tsx`
- `src/components/ViewportToggleOverlay.tsx`
- `src/contexts/EditorOverlayContext.tsx`
- `src/components/ui/card.tsx`
- `src/components/SelectionOverlay.tsx`
- `src/components/EditorPanelsWrapper.tsx`
- `src/components/DesignInspectorContent.tsx`
- `src/components/ui/Section.tsx`
- (Embed-only) `src/components/EditorBridge.tsx`


## URL Flags and DOM Markers
- URL flags
  - `design=1|true` → enables editor overlay and panels.
  - (Embed) `embed=1` → activates `EditorBridge`.
- DOM markers
  - `data-card` on card roots (`Card` component).
  - `data-card-selector` on the card handle badge.
  - `data-section-id` on each section root (`Section` component).
  - `data-overlay-ui="1"` on editor UI surfaces (panels, overlay), so they’re ignored by selection logic.
  - `class="@container"` on the viewport wrapper. Event handling is gated to content inside this container.


## High-Level Flow
1. App bootstraps providers and routing. In design mode, it renders:
   - `SelectionOverlay` and `EditorPanelsWrapper`.
   - `ViewportToggleOverlay` that hosts the site content in a fixed, scrollable `div.@container` and registers it as the editor's `scrollContainer`.
2. `EditorOverlayContext` attaches global `mousemove` and `click` listeners.
3. Hovering the card handle highlights its parent card. Hovering elsewhere highlights a meaningful element.
4. Clicking the handle selects the card; otherwise selection chooses the semantic target under the cursor.
5. Selection updates context: `selectedElement`, `activeElement` (label, sectionId, tokenMatches), `overlayRect`, and focuses the Inspector.
6. On scroll/resize/token changes, the overlay rect and token matches are recomputed for the `selectedElement`.

### Visual Pipeline Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   User Clicks   │───→│  Element Selection │───→│   Inspector Opens   │
│   on Element    │    │                  │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  User Changes   │◄───│  Inspector UI    │◄───│   tokenMatches      │
│  Token Value    │    │   Controls       │    │   Resolution        │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                                      
         ▼                                      
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  updateDesign   │───→│   Component      │───→│    resolveTokenRef  │
│   (Context)     │    │   Re-renders     │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                           │
                                ▼                           ▼
                    ┌──────────────────┐    ┌─────────────────────┐
                    │   style={{       │    │ "tokens.colors.primary" │
                    │  backgroundColor │    │         ↓               │
                    │  }}              │    │    "#eab308"            │
                    └──────────────────┘    └─────────────────────┘
```

**Key Points:**
- `resolveTokenRef` bridges token strings to actual CSS values
- Without `resolveTokenRef`, components receive invalid CSS like `"tokens.colors.primary"`
- With `resolveTokenRef`, components get resolved values like `"#eab308"` or `undefined`


## Core State (EditorOverlayContext)
- `enabled`: whether design mode is on.
- `selectedElement`: the currently selected DOM element.
- `activeElement`: metadata about the selection ({ label, sectionId, tokenMatches }).
- `overlayRect`: { top, left, width, height } used by `SelectionOverlay`.
- `viewport`: 'desktop' | 'mobile'.
- `scrollContainer`: the scrolling node used to scope scroll listeners.
- Panel UI: `activePanelId`, `panelCorner`, and toggles (`togglePanelHorizontal`, `togglePanelVertical`).


## Responsibilities by File
- `src/App.tsx`
  - Parses `design` flag.
  - Mounts `SelectionOverlay`, `EditorPanelsWrapper` only in design mode.
  - In design mode, routes are rendered inside `ViewportToggleOverlay`.
- `src/components/ViewportToggleOverlay.tsx`
  - Renders a fixed, centered container with `class="@container"` and animated width (desktop/mobile).
  - Registers this container as `scrollContainer` via `useEditorOverlay().setScrollContainer`.
  - Portals route content into this container.
- `src/contexts/EditorOverlayContext.tsx`
  - Manages state, event listeners, and gating.
  - Handles hover and click selection; computes `tokenMatches` (`takeComputedSnapshot` + `resolveGlobalTokens`).
  - Syncs `overlayRect` on scroll/resize; updates matches when design tokens change.
- `src/components/ui/card.tsx`
  - Adds `data-card` to the card root and renders the selection handle (`div[data-card-selector]`).
  - Visual hover overlay (non-interactive) when in design mode.
- `src/components/SelectionOverlay.tsx`
  - Draws the purple selection rectangle and label from `overlayRect` and `activeElement`.
  - Marked `data-overlay-ui="1"` and `pointer-events: none`.
- `src/components/EditorPanelsWrapper.tsx`
  - Renders AI, Inspector, and Navigator panels; manages docking (`panelCorner`).
- `src/components/DesignInspectorContent.tsx`
  - Uses `activeElement.tokenMatches` + `DesignContext` to show and edit tokens for the selection.
- `src/components/ui/Section.tsx`
  - Renders `section[data-section-id]` with a child `.inner-section` that enables CSS container queries via `container-type: inline-size`.


## Event Gating and Targets
The context’s listeners apply strict gating to avoid false activations:
```txt
- Ignore if the event target is inside editor UI:
  target.closest('[data-overlay-ui="1"]') → return

- Ignore if the target is not inside the viewport container:
  !target.closest('[class~="@container"]') → return
```
Target resolution order (summary):
- If the event hits the handle: `[data-card-selector], [data-card-selector] *` → select `closest('[data-card]')`.
- Otherwise, choose a meaningful element (typography, heading, paragraph, anchor/button, etc.), falling back to the raw target.


## Click Selection Logic (Summary)
On click, the context computes selection data and updates state:
- Determine `el`: either the card (via `data-card-selector`) or the resolved meaningful element.
- Compute `sectionId` from `el.closest('[data-section-id]')`.
- Snapshot + token matching:
  - `snap = takeComputedSnapshot(el)`
  - `tokenMatches = resolveGlobalTokens(snap, sectionId, designRef.current, el)`
- Compute label: `card · <sectionId>` or `<tag> · <sectionId>`.
- `overlayRect` from `el.getBoundingClientRect()`.
- Update state: `selectedElement`, `activeElement`, `overlayRect`, and set `activePanelId = 'inspector'`.
- For card-handle clicks, prevent default and stop propagation so the selection is deterministic.


## Hover Behavior
- When nothing is selected, moving the mouse highlights the current candidate and updates `overlayRect` for visual feedback.
- Once an element is selected, hover does not replace the selection; the overlay remains locked to `selectedElement` until another click occurs.


## Scroll/Resize and Token Sync
- The provider registers scroll/resize listeners on `scrollContainer` (and window) to recompute `overlayRect` for `selectedElement` via `requestAnimationFrame`.
- When the `design` tokens change, token matches are recomputed for the current `selectedElement` so the Inspector stays accurate.


## Section Structure and Container Queries
- `Section` renders `section[data-section-id] > .inner-section`.
- `.inner-section` sets `container-type: inline-size` and responsive paddings.
- Editor event gating uses the `@container` class on the viewport wrapper (set by `App` and `ViewportToggleOverlay`), not the CSS container type.


## Quick Test Flow
1. Open the app with `?design=1`.
2. Hover a card rendered via `Card` → see the faint blue hover overlay.
3. Click the top-right badge (handle) → purple selection overlay locks to the card, Inspector opens.
4. Click a heading or button → selection changes to that element; label shows `<tag> · <sectionId>`.
5. Toggle desktop/mobile via the top-center toolbar → overlay remains aligned; Inspector keys reflect viewport.


## Common Pitfalls
- Missing `?design=1|true`: the editor UI won’t mount.
- Outside of `@container`: elements won’t be considered by selection.
- Clicking inside editor UI: events are ignored due to `data-overlay-ui="1"`.
- Expecting card selection without using the handle: clicks usually resolve to the most specific meaningful element; use the handle to select the whole card.
- Overlay not moving after selection: by design, hover is suppressed while something is selected.


## Extending
- To add new selectable element types, adjust the target-resolution logic in `EditorOverlayContext`.
- To change default panel focus on selection, update `activePanelId` handling.
- To add more token categories to the Inspector, extend `DesignInspectorContent` and the token resolver pipeline.


## Key Contexts and activeElement (Important)

### EditorOverlayContext
- Owns global hover/click listeners in design mode (`?design=1`).
- Computes and updates selection state: `selectedElement`, `activeElement`, and `overlayRect`.
- Produces token matches via `takeComputedSnapshot(el)` + `resolveGlobalTokens(snap, sectionId, design, el)`.
- Gates events to avoid editor UI and out-of-viewport content.

### DesignInspectorContent
- Renders the inspector based on `activeElement.tokenMatches` and selection metadata.
- Shows the proper control groups (typography, component tokens, section tokens) derived from `tokenPath`.

### activeElement shape
```
type ActiveElementInfo = {
  label: string;             // e.g., 'card · services', or 'p · hero'
  sectionId: string | null;  // e.g., 'services'
  tokenMatches: TokenMatch[];// resolved tokens for inspector
  // Planned: cardType?: 'serviceCard' | 'testimonialCard' | 'travelPackageCard' | 'whyFeatureCard'
  // Planned: cardVariant?: string
}
```
- Tip: relying on `label` for card routing is brittle. Prefer `activeElement.cardType`/`cardVariant`.


## Card Type Identification and Inspector Switching

### Current behavior
- Clicking a card handle (`[data-card-selector]`) selects the root `card` and sets `activeElement.label = 'card · <sectionId>'`.
- The inspector then decides what to show based on `activeElement`.

### Problem observed
- Card-type specific panels (Service/Testimonial/TravelPackage/WhyFeature) depend on knowing the card type.
- Since the label is just `card`, the inspector cannot route to the correct panel.

### Required additions
1) On handle click:
   - Read `cardType = card.getAttribute('data-card-type')` and `cardVariant = card.getAttribute('data-card-variant')`.
   - Include these in `activeElement` (preferred), or normalize `label` from `cardType`.
2) On non-handle clicks inside a card:
   - Derive `cardType` via `target.closest('[data-card-type]')` and propagate the same way.
3) Inspector routing:
   - Use `activeElement.cardType` (and `cardVariant`) to render the proper card panel and variant controls.

### Component checklist (card roots)
- Must include: `data-card` on the card root (provided by `ui/card.tsx`).
- Must include: `data-card-type` with one of:
  - `travelPackageCard` (TravelPackageCard.tsx)
  - `serviceCard` (ServiceCard.tsx)
  - `testimonialCard` (TestimonialCard.tsx)
  - `whyFeatureCard` (WhyFeatureCards.tsx)
- Optional: `data-card-variant` (e.g., `standard`, `highlight`, `featured`).

Verified:
- TravelPackageCard.tsx → `data-card-type="travelPackageCard"`
- ServiceCard.tsx → `data-card-type="serviceCard"` (+ `data-card-variant` per variant)
- TestimonialCard.tsx → `data-card-type="testimonialCard"` (+ `data-card-variant="standard"`)
- WhyFeatureCards.tsx (inner cards) → `data-card-type="whyFeatureCard"` (+ `data-card-variant="standard"`)

Do not tag structural Cards (e.g., FAQ/Contact) as card types unless they are intended to be edited as such.


## dbV2 Token Coverage for Cards
- TravelPackageCard: component tokens + typography tokens present.
- ServiceCard: component tokens per variant present.
- TestimonialCard: component + typography tokens present.
- WhyFeatureCard: component + typography tokens present.

Conclusion: No dbV2 schema additions required for these four card types.


## Implementation Plan (Editor changes)
1) EditorOverlayContext
   - On `[data-card-selector]` click and on inside-card selection, set `activeElement.cardType` and `activeElement.cardVariant` from the closest card root.
   - Optionally normalize `label` to human-friendly names using `cardType`.
2) DesignInspectorContent
   - Switch routing from `label` string checks to `activeElement.cardType` (and `cardVariant`).
   - Keep existing token-based controls intact.

Request: approve implementation of the above plan to wire card type/variant into selection and inspector routing.

## Component structure requirements

Goal: Ensure inspector edits reflect immediately in the UI.

Baseline pipeline per element:
1) DOM hint: add `data-typography="<key>"` to the element.
2) Resolver mapping: map `<key>` to a token path under `tokens.typography.*`.
3) Component binding: in the React component, read styles from `design.tokens.typography.*` (matching the resolver path) and apply them via inline styles or CSS vars.

If step 3 is missing, the inspector will show controls but the element won’t update.

Examples:
```tsx
// Correct (custom token bound)
<h3 data-typography="testimonialCard.title" style={{
  fontFamily: design.tokens?.typography?.testimonialCardTitle?.fontFamily,
  fontSize: design.tokens?.typography?.testimonialCardTitle?.fontSize,
  fontWeight: design.tokens?.typography?.testimonialCardTitle?.fontWeight,
  color: design.tokens?.typography?.testimonialCardTitle?.color,
}} />

// Incorrect (no token binding; only classes)
<h3 data-typography="contactCard.title" className={design.components?.primaryCards?.title?.base} />
```

Custom vs global fallback:
- Preferred: Use a specific custom token (e.g., `tokens.typography.contactCardTitle`).
- Fallback: If no `data-typography` hint or mapping exists, the resolver may propose global `headings`/`body`. For card internals, we suppress globals when a specific hint is present to avoid misleading controls.

Actionable checklist per component:
- Add `data-typography` to each text element you want editable.
- Ensure corresponding keys exist in `public/dbV2.json` under `designV2.tokens.typography.*`.
- Bind JSX styles to those token paths (fontFamily, fontSize, lineHeight, fontWeight, color).
- For cards, also add `data-card-type` (and optional `data-card-variant`) on the root so the inspector routes to the correct panel when selecting the card.


## Token Resolution with `resolveTokenRef`

### What is `resolveTokenRef`?

`resolveTokenRef` is a helper function that safely resolves token reference strings (like `"tokens.colors.primary"`) to their actual values from the design system. It's critical for ensuring components can consume tokens properly without hardcoded fallbacks that cause disconnects.

### Why `resolveTokenRef` is needed

**The Problem**: Components often receive token values as strings like `"tokens.colors.primary"` instead of the actual hex value `"#eab308"`. When components use the logical OR operator (`||`) for fallbacks, these token strings are truthy and prevent proper fallback behavior:

```tsx
// ❌ WRONG: Token string "tokens.colors.primary" is truthy, so fallback never applies
backgroundColor: design.components?.card?.backgroundColor || '#ffffff'
// Result: Invalid CSS value "tokens.colors.primary"

// ✅ CORRECT: resolveTokenRef returns undefined on miss, ?? applies fallback  
backgroundColor: resolveTokenRef(design.components?.card?.backgroundColor) ?? '#ffffff'
// Result: Either "#eab308" (resolved) or "#ffffff" (fallback)
```

### How `resolveTokenRef` works

```tsx
const resolveTokenRef = (val: any): any => {
  if (typeof val !== 'string') return val;           // Pass through non-strings
  if (!val.startsWith('tokens.')) return val;       // Pass through non-token strings
  try {
    const path = val.replace(/^tokens\./, '');       // Remove 'tokens.' prefix
    const keys = path.split('.');                    // Split into path segments
    let cur: any = design?.tokens || {};             // Start from tokens root
    for (const k of keys) {                          // Walk the path
      if (cur && typeof cur === 'object' && k in cur) {
        cur = cur[k];
      } else {
        return undefined;                            // Return undefined on miss
      }
    }
    return cur ?? undefined;                         // Return undefined if null
  } catch { 
    return undefined;                                // Return undefined on error
  }
};
```

### Token Resolution Flow

```
Token String: "tokens.colors.primary"
      ↓
resolveTokenRef()
      ↓
1. Check if string starts with "tokens."
2. Remove "tokens." prefix → "colors.primary"  
3. Split path → ["colors", "primary"]
4. Walk design.tokens.colors.primary
5. Return actual value or undefined
      ↓
Actual Value: "#eab308" or undefined
      ↓
Component uses ?? for fallback:
backgroundColor: resolvedValue ?? 'transparent'
```

### Implementation Guidelines

**✅ DO: Use `resolveTokenRef` + nullish coalescing (`??`)**
```tsx
// Mandatory tokens (no fallback)
backgroundColor: resolveTokenRef(design.components?.card?.backgroundColor),

// Optional tokens (with fallback)
borderColor: resolveTokenRef(design.components?.card?.borderColor) ?? 'transparent',
```

**❌ DON'T: Use logical OR (`||`) with token values**
```tsx
// This breaks token resolution!
backgroundColor: design.components?.card?.backgroundColor || '#ffffff',
```

### Q&A

**Q: Why does the inspector show controls but the component doesn't update?**  
A: The component likely has `||` fallbacks instead of using `resolveTokenRef` + `??`. Token strings are truthy, so `||` never triggers the fallback and sends invalid CSS values to the browser.

**Q: When should I use `resolveTokenRef`?**  
A: Use it for ALL token consumption in components, especially when you've removed `||` fallbacks. Any value that might be a token reference string should go through `resolveTokenRef`.

**Q: What's the difference between `||` and `??`?**  
A: `||` checks truthiness (token strings are truthy), while `??` only checks for `null`/`undefined`. Since `resolveTokenRef` returns `undefined` on token resolution failure, `??` correctly applies fallbacks.

**Q: Can I still use fallbacks with mandatory tokens?**  
A: Yes, but be intentional. For truly mandatory tokens, omit the fallback to force proper token definition. For optional styling, use `?? 'fallback-value'`.

**Q: How do I debug token resolution issues?**  
A: Add temporary logging: `console.log('Token resolved:', val, '→', resolveTokenRef(val))` to see what values are being resolved or returning `undefined`.
