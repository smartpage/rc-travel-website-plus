# Design Flow: DB → Page → Editor → DB

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
- `tokenResolver.ts` analyzes clicked element + `data-typography` hints
- **FAQ Question**: `data-typography="faq.question"` → returns `typography.faqQuestion` token
- **FAQ Answer**: `data-typography="faq.answer"` → returns `typography.faqAnswer` token
- **Service Cards**: `data-typography="serviceCard.title"` → returns `typography.serviceCardTitle`
- Design Inspector shows matching tokens for editing

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

## Data Attributes for Token Binding
- `data-typography="faq.question"` - FAQ question text
- `data-typography="faq.answer"` - FAQ answer container  
- `data-typography="serviceCard.title"` - Service card titles
- `data-element="faqItem"` - Component-level selection (returns multiple tokens)
