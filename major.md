# Major Architecture Changes

## FAQ Component Editor Integration Fix (2025-01-XX)
**Problem**: FAQ component had complex editor selection issues preventing proper tokenization
- Individual `<p>` paragraphs inside FAQ answers were being selected instead of the entire FAQ item
- Duplicate `data-element="faqItem"` attributes on nested divs caused confusion
- Editor overlay context prioritized semantic elements (p, h1-h6) over component-level wrappers
- FAQ question and answer content wasn't properly editable via design inspector

**Root Cause**: Editor selection logic checked semantic elements BEFORE checking for `data-element` attributes, causing individual paragraphs to be selected instead of the intended FAQ item wrapper.

**Solution**: Comprehensive FAQ component editor integration fixes
1. **Selection Priority Fix**: Modified `EditorOverlayContext.tsx` to prioritize `data-element="faqItem"` over semantic elements in both `onClick` and `onMove` handlers
2. **Clean Component Structure**: Removed duplicate `data-element` attributes from nested FAQ divs
3. **Proper Typography Tokenization**: Applied `data-typography="faq.answer"` to the answer container div instead of individual paragraphs
4. **Unified Styling**: Moved FAQ answer typography styles to the container level to prevent individual paragraph selection
5. **Token Resolver Enhancement**: Enhanced `tokenResolver.ts` to recognize FAQ-specific `data-typography` hints

**Files Modified**:
- `src/components/FAQ.tsx`: 
  - Removed duplicate `data-element="faqItem"` from inner motion.div
  - Applied `data-typography="faq.answer"` to answer container instead of individual paragraphs
  - Moved typography styles from `parseHtmlTags` function to container level
  - Removed `data-typography` attributes from individual `<p>` and `<strong>` elements to prevent individual selection
- `src/contexts/EditorOverlayContext.tsx`: 
  - Modified `onClick` and `onMove` handlers to check `data-element="faqItem"` BEFORE semantic elements (h1-h6, p, button/a)
  - This ensures entire FAQ items are selected instead of individual paragraphs
- `src/lib/tokenResolver.ts`: 
  - Added recognition for `data-typography="faq.question"`, `faq.answer`, `faq.answerStrong` hints
  - Added `data-element="faqItem"` detection to propose FAQ-level tokens

**Editor Selection Logic Flow**:
```
1. Check for data-element="faqItem" (FAQ wrapper)
2. Check for semantic elements (h1-h6, p, button/a)
3. Fallback to raw target element
```

**FAQ Component Structure**:
```jsx
<motion.div data-element="faqItem">
  <motion.div> // Question container (no data-element)
    <span data-typography="faq.question">Question text</span>
  </motion.div>
  <motion.div> // Answer container
    <div data-typography="faq.answer">
      {parseHtmlTags(answer)} // No data attributes on individual elements
    </div>
  </motion.div>
</motion.div>
```

---

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

## Provider-Only Architecture Refactor (2025-01-XX)
**Problem**: Business logic scattered across components, potential for duplicate event handling
- `EditorPanelsWrapper` handled both UI rendering AND event logic
- Provider was scoped only to design mode
- Risk of context errors and duplicate listeners

**Solution**: Centralized all overlay logic in `EditorOverlayProvider`
- All event handling (mousemove, click, scroll) moved to provider
- Components simplified to pure UI rendering
- Global provider available throughout app
- Better separation of concerns and testing

**Files Modified**:
- `src/contexts/EditorOverlayContext.tsx`: Added all event handling logic
- `src/components/EditorPanelsWrapper.tsx`: Simplified to pure UI
- `src/App.tsx`: Provider now wraps entire app globally

---

## UI Overlay Exclusion Fix (2025-01-XX)
**Problem**: Overlay UI elements (panels, highlight box, viewport toggle) could be selected by the highlighter
**Solution**: Added `data-overlay-ui="1"` to all overlay UI components
- `SelectionOverlay`: Excluded highlight box from being highlighted
- `ViewportToggleOverlay`: Excluded desktop/mobile toggle buttons
- `EditorPanelsWrapper`: Excluded inspector and navigator panels

**Files Modified**:
- `src/components/SelectionOverlay.tsx`: Added data-overlay-ui attribute
- `src/components/ViewportToggleOverlay.tsx`: Added data-overlay-ui attribute

---

## Smart Section-Specific Token Detection (2025-01-XX)
**Problem**: Token resolver was too simplistic - only detected global tokens, missing section-specific ones
- Hero H2 elements mapped to generic "headings" instead of "hero_headings"
- No context awareness based on sectionId
- Limited matching criteria (only basic font properties)

**Solution**: Enhanced token resolver with intelligent section-specific detection
- Prioritizes section-specific tokens over global ones (hero_headings > headings)
- Enhanced matching criteria: fontSize variants, color, improved font detection
- Added hero_headings editing UI with responsive fontSize controls
- Context-aware token resolution based on sectionId and element properties

**Files Modified**:
- `src/lib/tokenResolver.ts`: Enhanced resolution logic with section priority
- `src/components/DesignInspectorContent.tsx`: Added hero_headings editing UI, fixed Provider-Only usage

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

## Panel State Persistence (2025-01-XX)
**UX**: Panel states now persist across page refreshes
- Design Inspector opens by default (navigator closed by default)
- Panel collapse states saved to localStorage automatically
- Improved default user experience on first load

**Files Modified**:
- `src/contexts/EditorOverlayContext.tsx`: Added localStorage persistence for panel states

## Unified Editor Panels (2025-01-XX)
**UI**: Consolidated overlay editor interface
- Reusable `EditorPanel` component with collapse states
- Design Inspector: Token editing with preview/save/revert
- Section Navigator: Click-to-scroll section management
- Fixed positioning with responsive design integration

**Files Added**:
- `src/components/EditorPanel.tsx`: Reusable panel wrapper
- `src/components/EditorPanelsWrapper.tsx`: Panel container + provider
