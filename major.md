# Major Architecture Changes

## Container Query Consistency (2025-01-XX)
**Problem**: Normal mode vs Design mode (`?design=1`) had different responsive behavior
- Normal mode: Standard viewport breakpoints
- Design mode: Container queries with animated viewport wrapper

**Solution**: Added `@container` wrapper to normal mode
- Both modes now use identical container query context
- Consistent responsive breakpoints across all modes
- Design mode retains overlay panels + highlight functionality

**Files Changed**:
- `src/App.tsx`: Added `@container` wrapper to normal mode routing

---

## Dynamic Element Highlight & Token Resolver (2025-01-XX)
**Feature**: Click any element to dynamically identify and edit design tokens
- Global event listeners for element selection
- Heuristic token resolution (computed styles → design tokens)
- Real-time highlight with scroll sync
- Overlay UI exclusion via `data-overlay-ui` attributes

**Files Added**:
- `src/lib/tokenResolver.ts`: Heuristic token matching logic
- `src/components/SelectionOverlay.tsx`: Visual highlight rendering
- `src/contexts/EditorOverlayContext.tsx`: Selection state management

**Files Modified**:
- `src/components/EditorPanelsWrapper.tsx`: Event listeners + token resolution
- `src/components/DesignInspectorContent.tsx`: Dynamic token editing UI
- `src/components/ViewportToggleOverlay.tsx`: Scroll container registration

---

## Container Queries Migration (2025-01-XX)
**Migration**: Converted responsive classes from viewport to container-based
- `md:` → `@md:` for container-dependent breakpoints
- Enables responsive preview within animated viewport wrapper
- Maintains design token system compatibility

**Files Affected**: All component files with responsive classes

---

## Local Design System (2025-01-XX)
**Infrastructure**: Local-only design editing with `db.json` + json-server
- Design changes saved locally during development
- `?design=1` activation flag for overlay editor
- API endpoints via Vite proxy (`/design-api/design`)
- Future: Firebase integration for production persistence

**Files Added**:
- `db.json`: Local design token storage
- `src/contexts/DesignContext.tsx`: Local/remote design loading

---

## Unified Editor Panels (2025-01-XX)
**UI**: Consolidated overlay editor interface
- Reusable `EditorPanel` component with collapse states
- Design Inspector: Token editing with preview/save/revert
- Section Navigator: Click-to-scroll section management
- Fixed positioning with responsive design integration

**Files Added**:
- `src/components/EditorPanel.tsx`: Reusable panel wrapper
- `src/components/EditorPanelsWrapper.tsx`: Panel container + provider
