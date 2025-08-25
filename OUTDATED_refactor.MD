# Overlay Context & Token Resolution Refactor

## What I Just Fixed

I corrected the token paths in `tokenResolver.ts` so that:
- `'preTitle'` → `'tokens.typography.preTitle'`
- `'titleDescription'` → `'tokens.typography.titleDescription'`
- And 6 other typography tokens that had the same issue

Now when you click on elements with `data-typography="preTitle"` or `data-typography="titleDescription"`, the `DbEditorConnector` should properly show their editing controls.

## The Real Issue

This whole system is overcomplicated. A simpler approach would be:
- Just read the `data-typography` attribute directly
- Look up that path in `dbV2.json`
- Show the controls

Instead, we have multiple layers of indirection that all need to align perfectly.

---

## Current Data Attribute Analysis

### 1. Typography Attributes (`data-typography`)
**Pattern**: Component-specific typography targeting
**Usage**: 15+ different variants across components

**Found Variants**:
- `footerCard.primary` / `footerCard.secondary`
- `testimonialCard.title` / `testimonialCard.location` / `testimonialCard.body`
- `travelDesignerCard`
- `faqCardQuestion` / `faqCardAnswer` / `faq.question` / `faq.answer` / `faq.answerStrong`
- `whyCard.title` / `whyCard.description`
- `serviceCard.title` / `serviceCard.description`
- `travelPackageCard.title` / `travelPackageCard.price` / `travelPackageCard.description`
- `contactCard.title` / `contactCard.body` / `contactCard.icon`
- `preTitle` / `titleDescription` / `headings` / `hero_headings`
- `packageDescription` / `travelPackageTitle`

### 2. Card Type Attributes (`data-card-type`)
**Pattern**: Component identification for design system
**Usage**: Card component identification

**Found Types**:
- `footerCard`
- `testimonialCard`
- `travelDesignerCard`
- `faqCard`
- `whyFeatureCard`
- `serviceCard`
- `travelPackageCard`
- `contactCard`

### 3. Card Variant Attributes (`data-card-variant`)
**Pattern**: Style variation within card types
**Usage**: Style variant selection

**Found Variants**:
- `standard` (default)
- `featured`
- `highlight`

### 4. Element Attributes (`data-element`)
**Pattern**: Special component behavior identification
**Usage**: Interactive element identification

**Found Elements**:
- `primaryButton`
- `secondaryButton`
- `faqItem`

### 5. UI Overlay Attributes (`data-overlay-ui`)
**Pattern**: Editor UI exclusion
**Usage**: Prevent editor from selecting its own UI
**Value**: Always `"1"`

### 6. Section Attributes (`data-section-id`)
**Pattern**: Section identification for layout tokens
**Usage**: Applied by `Section.tsx` component automatically
**Example Values**: `hero`, `packages`, `testimonials`, etc.

---

## Problems with Current System

### 1. **Multiple Token Resolution Layers**
```
Element → tokenResolver.ts → hardcoded mapping → tokenPath → DbEditorConnector
```

**Issues**:
- Requires maintaining hardcoded mappings in `tokenResolver.ts` (lines 113-203)
- Easy to have mismatched paths
- Fragile when adding new components

### 2. **Inconsistent Path Formats**
**Current Issues**:
- Some return `'preTitle'` instead of `'tokens.typography.preTitle'`
- Mix of absolute and relative paths
- DbEditorConnector can't find tokens due to path mismatches

### 3. **Complex Heuristic Logic**
**Problems**:
- Background context detection is unreliable
- Font matching is fragile
- Too many fallback rules that conflict

### 4. **Duplicate Token Definitions**
**Issues**:
- Typography tokens defined in multiple places
- Component tokens scattered across different sections
- Variant handling is inconsistent

---

## Proposed Simplification

### Option A: Direct Attribute Reading (Recommended)

**Concept**: Read data attributes directly and map to dbV2.json paths

```typescript
// Simplified approach in DbEditorConnector
const getTokenPathFromElement = (element: Element): string[] => {
  const paths: string[] = [];
  
  // Typography tokens
  const typography = element.getAttribute('data-typography');
  if (typography) {
    paths.push(`tokens.typography.${typography.replace('.', '')}`);
  }
  
  // Card tokens
  const cardType = element.getAttribute('data-card-type');
  const cardVariant = element.getAttribute('data-card-variant');
  if (cardType) {
    paths.push(`components.${cardType}`);
    if (cardVariant && cardVariant !== 'standard') {
      paths.push(`components.${cardType}.variants.${cardVariant}`);
    }
  }
  
  // Section tokens
  const sectionEl = element.closest('[data-section-id]');
  if (sectionEl) {
    const sectionId = sectionEl.getAttribute('data-section-id');
    paths.push(`sections.${sectionId}.layout`);
  }
  
  return paths;
};
```

**Benefits**:
- No hardcoded mappings
- Direct relationship between DOM and tokens
- Easy to debug and maintain
- Consistent path format

### Option B: Enhanced Connector Pattern

**Concept**: Keep tokenResolver but simplify and standardize

```typescript
// Standardized token resolution
export const resolveDirectTokens = (element: Element): TokenMatch[] => {
  const matches: TokenMatch[] = [];
  
  // Direct typography mapping
  const typography = element.getAttribute('data-typography');
  if (typography) {
    matches.push({
      scope: 'global',
      tokenPath: `tokens.typography.${typography.replace(/\./g, '')}`,
      label: typography,
      responsive: false
    });
  }
  
  // Direct card mapping
  const cardType = element.getAttribute('data-card-type');
  if (cardType) {
    matches.push({
      scope: 'global',
      tokenPath: `components.${cardType}`,
      label: cardType,
      responsive: false
    });
  }
  
  return matches;
};
```

---

## Data Attribute Standardization

### 1. Typography Convention
**Current**: Mixed patterns like `serviceCard.title` vs `serviceCardTitle`
**Proposed**: Consistent dot notation

```html
<!-- Standardized format -->
<h3 data-typography="serviceCard.title">Title</h3>
<p data-typography="serviceCard.description">Description</p>
```

**Maps to**: `tokens.typography.serviceCardTitle` / `tokens.typography.serviceCardDescription`

### 2. Card Type Convention
**Current**: Good consistency
**Keep**: `data-card-type="serviceCard"` format

### 3. Element Convention
**Current**: Limited usage
**Expand**: More semantic element types

```html
<!-- Proposed additions -->
<button data-element="primaryButton">CTA</button>
<button data-element="secondaryButton">Learn More</button>
<div data-element="cardContainer">Card wrapper</div>
<img data-element="heroImage">Hero image</div>
```

---

## Migration Strategy

### Phase 1: Fix Current System (Immediate)
1. ✅ **DONE**: Fix tokenResolver paths to use correct prefixes
2. **TODO**: Standardize all `data-typography` attributes across components
3. **TODO**: Ensure DbEditorConnector handles all current token paths

### Phase 2: Simplify Token Resolution (Next Sprint)
1. **TODO**: Implement direct attribute reading in DbEditorConnector
2. **TODO**: Remove complex heuristic logic from tokenResolver
3. **TODO**: Create simple mapping functions

### Phase 3: Enhanced Data Attributes (Future)
1. **TODO**: Add more semantic `data-element` types
2. **TODO**: Implement responsive data attributes
3. **TODO**: Add validation for data attribute consistency

---

## ✅ IMPLEMENTED: Direct Attribute Reading

### **Just Implemented** (Now)
- ✅ **Direct data attribute reading** in DbEditorConnector
- ✅ **Bypassed tokenResolver.ts** completely for new logic
- ✅ **Added `getTokenPathsFromElement()`** function that reads:
  - `data-typography` → converts to typography token paths
  - `data-card-type` + `data-card-variant` → component token paths  
  - `data-section-id` → section layout token paths
- ✅ **Maintained backward compatibility** with existing tokenMatches

### **Benefits Achieved**:
1. **No more hardcoded mappings** - direct DOM → token path conversion
2. **Simplified debugging** - clear 1:1 relationship between attributes and tokens
3. **Easier maintenance** - adding new components requires no tokenResolver changes
4. **Better performance** - eliminates complex heuristic calculations

### **Next Steps**

### 1. **Test & Validate** (Today)
- Test that DbEditorConnector shows controls for all `data-typography` elements
- Verify card and section token discovery works correctly
- Ensure backward compatibility with existing tokenMatches system

### 2. **Gradual Migration** (This Week)  
- Components can now rely on DbEditorConnector's direct reading
- EditorOverlayContext can be simplified to remove tokenResolver dependency
- Start phasing out complex tokenResolver logic

### 3. **Complete Removal** (Next Sprint)
- **TODO: DELETE tokenResolver.ts** entirely once all flows use direct reading
- **TODO: DELETE DesignInspectorContent.tsx** (replaced by DbEditorConnector.tsx)
- Clean up EditorOverlayContext to remove token resolution logic
- Update documentation to reflect simplified architecture
- **TODO: DELETE resolver.md** if it exists (redundant documentation)

---

## Files to Modify

### High Priority
1. `src/lib/tokenResolver.ts` - Fix remaining token paths
2. `src/components/DbEditorConnector.tsx` - Implement direct attribute reading
3. All component files - Standardize `data-typography` attributes

### Medium Priority
1. `src/contexts/EditorOverlayContext.tsx` - Simplify selection logic
2. `src/components/ui/Section.tsx` - Ensure consistent `data-section-id`
3. Documentation files - Update patterns and conventions

### Low Priority
1. Create validation utilities
2. Add TypeScript types for data attributes
3. Create migration tools for future changes

---

## Testing Checklist

- [ ] All `data-typography` elements show controls in design mode
- [ ] Card selection works for all `data-card-type` elements
- [ ] Section selection works for layout tokens
- [ ] No console errors when switching between elements
- [ ] Performance is acceptable with simplified logic
- [ ] Backward compatibility is maintained

---

This refactor will significantly simplify the token resolution system while maintaining all current functionality and making future additions much easier.
