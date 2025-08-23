# EditorOverlayContext

Central controller for Design Mode interactions: selection, overlay rectangle, active panel, and editor UI behavior.

## Responsibilities
- Enable/disable editor via URL flag (`?design=1|true`).
- Attach global hover/click listeners with strict gating (ignore editor UI, only within `@container`).
- Compute selection metadata:
  - `selectedElement`: DOM node currently selected
  - `activeElement`: `{ label, sectionId, tokenMatches, cardType?, cardVariant? }`
  - `overlayRect`: `{ top, left, width, height }` used by the selection rectangle
- Update `tokenMatches` by resolving tokens from a computed CSS snapshot.
- Manage panel state (single-open accordion): `activePanelId` and toggles.
- Persist small UI preferences (panel corner, active panel, etc.).

## State (excerpt)
- `enabled: boolean`
- `selectedElement: Element | null`
- `activeElement: { label: string; sectionId: string | null; tokenMatches: TokenMatch[]; cardType?: string | null; cardVariant?: string | null } | null`
- `overlayRect: Rect | null`
- `viewport: 'desktop'|'mobile'`
- `scrollContainer: HTMLElement | null`
- `activePanelId: 'inspector'|'navigator'|'ai-enhance'|null`
- `panelCorner: 'top-right'|'top-left'|'bottom-right'|'bottom-left'`
- `autoOpen: boolean` (opens Design panel automatically on selection)

## API
- `togglePanel(panel)` / `setActivePanelId(panel|null)`
- `setSelectedElement(el)` / `setActiveElement(info)`
- `setOverlayRect(rect)`
- `setViewport(vp)`
- `setScrollContainer(el)`
- `setPanelCorner(corner)` / `togglePanelHorizontal()` / `togglePanelVertical()`
- `setAutoOpen(boolean)`

## Selection flow (simplified)
1. On click, choose target (handle → card; otherwise nearest meaningful element).
2. Compute snapshot + `tokenMatches` via `resolveGlobalTokens`.
3. Extract `cardType`/`cardVariant` from closest `[data-card-type]`.
4. Update context state.
5. If `autoOpen === true`, force `setActivePanelId('inspector')` so the Design panel opens and others collapse.

## Precedence rules (relevant)
- When an element provides a `data-typography` match, the inspector focuses typography controls (card panel is hidden for that selection).
- Global fallbacks (`headings/body`) are suppressed inside card contexts to avoid misleading controls.

## Persistence
- Small UI preferences (`active_panel`, `panel_corner`, `color_palette`, `auto_open`) are persisted in `localStorage`.
