# Design Flow: DB → Page → Editor → DB

## 🚀 COMPLETE TODO: Making New Section/Element Fully Editable

### Required Files & Changes (in order):

1. **`db.json`** - Add design tokens for new element
   - Add to `typography` section: `"newElementTitle": { fontFamily, fontSize, fontWeight, lineHeight, color }`
   - Add to `colors` section if needed: `"newElementBg": "#ffffff"`
   - Add component-specific section if complex: `"newElement": { card: { backgroundColor, borderColor } }`

2. **`src/contexts/DesignContext.tsx`** - Update TypeScript interface
   - Add new tokens to `DesignConfig` interface (lines ~200-300)
   - Match exact structure from `db.json`

3. **`src/components/YourNewComponent.tsx`** - Implement component with tokens
   - Import `useDesign()` hook
   - Add `data-typography="newElement.title"` to text elements
   - Apply inline styles: `style={{ color: design.typography.newElementTitle?.color }}`
   - Add `data-element="newElementWrapper"` if needed for complex selection

4. **`src/lib/tokenResolver.ts`** - Map elements to tokens
   - Add case for `data-typography="newElement.title"` → returns `typography.newElementTitle`
   - Add `data-element="newElementWrapper"` logic if using component-level selection

5. **`src/contexts/EditorOverlayContext.tsx`** - Update selection priority
   - Add new `data-element` or `data-typography` patterns to selection logic if needed
   - Usually auto-works if using standard `data-typography` attributes



### 🔍 Testing Checklist:
- [ ] Element appears with correct styling from tokens
- [ ] Clicking element shows proper token in Design Inspector
- [ ] Input fields appear for editing (font, color, size, etc.)
- [ ] Changes apply instantly to element
- [ ] Changes persist after page refresh

## 1. Data Loading (DB → Page)
- `db.json` contains design tokens (`design.typography.faqQuestion`, `design.colors.primary`, etc.)
- `DesignContext` loads design data from local json-server (`/design-api/design`)
- Components like `FAQ.tsx` consume tokens via `useDesign()` hook
- Inline styles applied: `style={{ color: design.typography.faqQuestion.color }}`

## 2. Element Selection (Page → Editor)
- User adds `?design=1` to URL → activates editor overlay
- User clicks element → `EditorOverlayContext` captures click event
- **Selection Priority**: `data-element` → `h1-h6` → `p` → `button/a` → raw element
- `takeComputedSnapshot()` captures element's computed CSS styles

## 3. Token Resolution (Editor Intelligence)

### `tokenResolver.ts` - Element to Token Mapping
- **Purpose**: Maps clicked DOM element to specific design tokens for editing
- **Input**: DOM element + its `data-typography` attribute + computed styles
- **Output**: Array of token matches `{ scope, tokenPath, label, responsive }`

**Logic Flow**:
```javascript
// 1. Check data-typography hints (highest priority)
if (element.dataset.typography === 'faq.question') return 'typography.faqQuestion'
if (element.dataset.typography === 'serviceCard.title') return 'typography.serviceCardTitle'

// 2. Element type detection (headings, paragraphs, buttons)
if (element.tagName === 'H1') return 'typography.heading1'
if (element.tagName === 'P') return 'typography.body'

// 3. Background context detection (light vs dark)
detectBackgroundContext() // determines if element is on light/dark background
```

### `EditorOverlayContext.tsx` - Click Handling & Selection
- **Purpose**: Determines which element gets selected when user clicks
- **Selection Priority Order**:
  1. `[data-typography]` - Elements with explicit typography hints (HIGHEST)
  2. `h1-h6` - Semantic headings
  3. `p` - Paragraphs
  4. `button,a` - Interactive elements
  5. Raw clicked element (fallback)

**Key Functions**:
- `onClick()` - Handles element selection, prevents default during drag
- `onMove()` - Handles hover preview (same priority logic)  
- `takeComputedSnapshot()` - Captures element's computed CSS styles
- `resolveGlobalTokens()` - Calls tokenResolver to map element to tokens
- Updates `selectedElement` state with token matches for Design Inspector

### `DesignInspectorContent.tsx` - Editor UI Rendering
- **Purpose**: Renders UI controls for editing resolved tokens
- **Process**:
  1. Receives `activeElement.tokenMatches` array from EditorOverlayContext
  2. For each token match, calls `renderTokenEditor(tokenPath)`
  3. `resolveDesignPath()` maps token path to design object location
  4. `getValueByPath()` gets current token value from design
  5. Renders input controls (color picker, font selector, size slider)
  6. `updateDesignToken()` saves changes back to design object + json-server API

## 4. Live Updates (Editor → Page)
- User changes color/font in Design Inspector
- `DesignContext` updates design object in memory
- Components re-render with new token values
- Changes visible immediately (no page refresh)

## 5. Persistence (Editor → DB)
- User clicks "Save All Changes" in Design Inspector
- `PUT /design-api/design` request to json-server
- `db.json` file updated with new token values
- Changes persist across page refreshes

## Key Files
- `db.json` - Design token storage
- `src/contexts/DesignContext.tsx` - Token loading/distribution
- `src/contexts/EditorOverlayContext.tsx` - Click handling/selection
- `src/lib/tokenResolver.ts` - Element → token mapping
- `src/components/DesignInspectorContent.tsx` - Editor UI

## Security hardening (remote editor)
- Client-side gate is UX only; server must enforce writes.
- Server checks to enforce (tracked in Intuitiva docs):
  - verifySession on all mutating endpoints
  - Role check (now: super admin only)
  - Origin/Referer allowlist for write requests
  - Shorter session TTL with rotation, rate limiting, audit logs
  - TODO: Auto-build Origin allowlist from Firebase websites and block writes from non-authorized origins

## 📋 Real-World Examples from FAQ Component Fix

### The Problem We Solved:
- FAQ questions/answers weren't editable in Design Inspector
- Individual `<p>` paragraphs were being selected instead of FAQ containers
- "No global tokens detected" error due to missing tokens in `db.json`

### The Complete Fix Applied:
1. **Added missing tokens to `db.json`**:
```json
"typography": {
  "faqQuestion": { "fontFamily": "Inter", "fontSize": "1.125rem", "fontWeight": "600", "color": "white" },
  "faqAnswer": { "fontFamily": "Inter", "fontSize": "1rem", "fontWeight": "400", "color": "#cbd5e1" }
}
```

2. **Updated FAQ component with proper data attributes**:
```jsx
// Question area
<span data-typography="faq.question" style={{ color: design.typography?.faqQuestion?.color }}>
  {item.question}
</span>

// Answer container  
<div data-typography="faq.answer" style={{ color: design.typography?.faqAnswer?.color }}>
  {parseHtmlTags(item.answer)}
</div>
```

3. **Fixed EditorOverlayContext selection priority**:
```javascript
// OLD: semantic elements first (selected individual <p> tags)
const target = raw.closest('h1,h2,h3,h4,h5,h6') || raw.closest('p') || ...

// NEW: data-typography first (selects FAQ containers)
const target = raw.closest('[data-typography]') || raw.closest('h1,h2,h3,h4,h5,h6') || ...
```

4. **Updated tokenResolver.ts**:
```javascript
if (element.dataset.typography === 'faq.question') {
  return [{ scope: 'global', tokenPath: 'typography.faqQuestion', label: 'FAQ Question' }];
}
```

### Result: 
✅ Clicking FAQ question shows "FAQ Question" token with editable inputs  
✅ Clicking FAQ answer shows "FAQ Answer" token with editable inputs  
✅ No more individual paragraph selection  
✅ Changes apply instantly and persist
