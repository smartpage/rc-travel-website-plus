# DbEditorConnector Heuristics Analysis

This document provides a comprehensive analysis of all heuristic logic and hard-coded cases in `DbEditorConnector.tsx` compared to the legacy `DesignInspectorContent.tsx` component.

## Table of Contents
1. [Control Type Inference Heuristics](#control-type-inference-heuristics)
2. [Hard-coded Enum Options](#hard-coded-enum-options)
3. [Unit Normalization Logic](#unit-normalization-logic)
4. [Token Path Resolution](#token-path-resolution)
5. [Hard-coded Component Panels](#hard-coded-component-panels)
6. [Field Organization Heuristics](#field-organization-heuristics)
7. [Responsive Field Handling](#responsive-field-handling)
8. [Panel Display Logic](#panel-display-logic)
9. [Feature Parity Analysis](#feature-parity-analysis)
10. [Missing or Divergent Behaviors](#missing-or-divergent-behaviors)

## Control Type Inference Heuristics

The `inferControl` function uses pattern matching to determine input control types:

### Color Detection
```typescript
// Detected as color if key contains:
- 'color'
- 'bg' 
- ends with 'bg'
- 'overlay'
- 'background' (but NOT 'backgroundimage' or 'backgroundurl')

// Or if value matches:
- Hex codes: #rgb or #rrggbb
- CSS functions: rgba(), rgb(), hsl()
- Keywords: transparent, inherit, initial, unset
- Named colors: black, white, red, green, blue, etc.
```

### Boolean Detection
```typescript
// Detected as boolean if:
- typeof value === 'boolean'
- Key starts with: 'is', 'has', 'use', 'show'
- Exception: 'rounded' is NOT boolean
```

### Number Detection
```typescript
// Detected as number if:
- typeof value === 'number'
```

### Length Detection
```typescript
// Detected as length if key ends with or contains:
- fontsize, lineheight, letterspacing
- padding, margin, width, height
- maxwidth, maxheight, minwidth, minheight
- borderwidth, borderradius, radius
- spacing, gap
```

### Text Detection
```typescript
// Detected as text if:
- Key ends with 'fontfamily'
- Default fallback for all other strings
```

## Hard-coded Enum Options

The `enumOptionsForKey` function provides dropdown options for specific CSS properties:

```typescript
const knownEnums = {
  position: ['relative', 'absolute', 'fixed', 'sticky', 'static'],
  display: ['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline', 'none'],
  flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
  alignItems: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
  justifyContent: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
  textAlign: ['left', 'center', 'right', 'justify'],
  borderStyle: ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'],
  cursor: ['auto', 'pointer', 'move', 'not-allowed', 'text', 'wait', 'help', 'crosshair'],
  overflow: ['visible', 'hidden', 'scroll', 'auto'],
  textTransform: ['none', 'uppercase', 'lowercase', 'capitalize'],
  fontWeight: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  fontStyle: ['normal', 'italic', 'oblique'],
  textDecoration: ['none', 'underline', 'overline', 'line-through']
}
```

## Unit Normalization Logic

The `normalizeUnit` function adds 'px' to unitless numbers for specific properties:

```typescript
const lengthProperties = [
  'fontSize', 'lineHeight', 'letterSpacing',
  'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderRadius', 'gap'
]
```

## Token Path Resolution

The `getTokenPathsFromElement` function reads design tokens from DOM attributes:

### Direct Attribute Reading
1. **Typography**: `data-typography` attribute
   - Splits by spaces or commas for multiple variants
   - Example: `data-typography="h1 body"` → `['h1', 'body']`

2. **Card Type**: `data-card-type` attribute
   - Single value for card component type
   - Example: `data-card-type="serviceCard"`

3. **Card Variant**: `data-card-variant` attribute  
   - Single value for card variant
   - Example: `data-card-variant="primary"`

4. **Section ID**: `data-section-id` attribute
   - Single value for section identifier
   - Example: `data-section-id="hero"`

### Ancestor Fallback
If attributes not found on element, searches closest ancestor:
```typescript
element.closest('[data-typography]')
element.closest('[data-card-type]')
// etc.
```

## Hard-coded Component Panels

DbEditorConnector includes hard-coded UI panels for specific components to maintain parity with the legacy inspector:

### 1. Button Panel (`renderButtonPanel`)
- Types: `primaryButton`, `secondaryButton`
- Fixed fields with defaults:
  ```
  - Background Color: tokens.colors.primary / tokens.colors.muted
  - Text Color: tokens.colors.background / tokens.colors.text
  - Border Color: tokens.colors.primary / tokens.colors.border
  - Padding: 12px 24px / 10px 20px
  - Border Radius: tokens.radii.medium / tokens.radii.small
  - Border Width: 2px / 1px
  - Font Size: 1rem / 0.875rem
  - Font Weight: 600 / 500
  ```

### 2. Tab Navigation Panel (`renderTabNavigationPanel`)
- Fixed fields:
  ```
  - Background Color: transparent
  - Active Tab Background: tokens.colors.primary
  - Active Tab Text: tokens.colors.background
  - Inactive Tab Background: transparent
  - Inactive Tab Text: tokens.colors.text
  - Border Color: tokens.colors.border
  - Border Radius: tokens.radii.medium
  - Padding: 8px 16px
  - Font Size: 0.875rem
  - Font Weight: 500
  ```

### 3. Service Card Panel (`renderServiceCardPanel`)
- Fixed fields:
  ```
  - Background Color: tokens.colors.card
  - Border Color: tokens.colors.border
  - Text Color: tokens.colors.text
  - Title Color: tokens.colors.primary
  - Border Radius: tokens.radii.large
  - Padding: 2rem
  - Title Font Size: 1.5rem
  - Title Font Weight: 600
  - Shadow: tokens.shadows.medium
  ```

### 4. Travel Package Card Panel (`renderTravelPackageCardPanel`)
- Fixed fields:
  ```
  - Background Color: tokens.colors.card
  - Border Color: tokens.colors.border
  - Price Color: tokens.colors.primary
  - Border Radius: tokens.radii.large
  - Padding: 1.5rem
  - Price Font Size: 2rem
  - Price Font Weight: 700
  - Image Height: 200px
  - Shadow: tokens.shadows.large
  ```

### 5. Testimonial Card Panel (`renderTestimonialCardPanel`)
- Fixed fields:
  ```
  - Background Color: tokens.colors.card
  - Border Color: tokens.colors.border
  - Quote Color: tokens.colors.text
  - Author Color: tokens.colors.muted
  - Border Radius: tokens.radii.medium
  - Padding: 2rem
  - Quote Font Size: 1.125rem
  - Author Font Size: 0.875rem
  - Max Width: 500px
  ```

### 6. Why Feature Card Panel (`renderWhyFeatureCardPanel`)
- Fixed fields:
  ```
  - Background Color: transparent
  - Text Color: tokens.colors.background
  - Border Color: transparent
  - Icon Color: rgba(0,0,0,1)
  - Icon Size: 4.25rem
  - Icon Inner Size: 2.5rem
  - Icon Spacing: 1.5rem
  - Description Padding: 2rem 2rem
  - Border Radius: tokens.radii.medium
  - Border Width: 2px
  ```

### 7. Contact Card Panel (`renderContactCardPanel`)
- Fixed fields:
  ```
  - Background Color: #1f2937
  - Border Color: #eab308
  - Border Width: 2px
  - Border Radius: 1rem
  - Shadow: 0 10px 20px rgba(0,0,0,.35)
  - Padding: 2rem
  ```

### 8. Footer Card Panel (`renderFooterCardPanel`)
- Fixed fields:
  ```
  - Background Color: #000000
  - Border Color: #000000
  - Border Radius: 0
  - Border Style: solid (dropdown)
  - Border Width: 1px
  - Height: 100%
  ```

## Field Organization Heuristics

### Group Assignment (`groupForPath`)
Fields are organized into groups based on their path structure:

1. **Special Layout Handling**: 
   - `layout.` prefix creates subgroups (e.g., `layout.padding` → "Padding" group)
   
2. **Standard Grouping**:
   - Groups by immediate parent key
   - Example: `components.card.title.fontSize` → "Title" group

3. **Fallback**:
   - Ungrouped fields go to "Misc" group

### Label Generation (`friendlyLabelForPath`)
Converts token paths to user-friendly labels:

1. Extracts last segment of path
2. Converts camelCase to Title Case
3. Special cases:
   - `backgroundColor` → "Background Color"
   - `fontSize` → "Font Size"
   - etc.

## Responsive Field Handling

The `filterByViewport` function implements intelligent responsive field filtering:

### Pattern Detection
1. **Object Suffix Pattern**: `path.mobile`, `path.tablet`, `path.desktop`
2. **Property Suffix Pattern**: `fontSizeLg`, `fontSizeMd`, `fontSizeSm`

### Viewport-based Selection
**Desktop Mode**:
- Priority: `.desktop` or `Lg` suffix
- Fallback: `Md` suffix → base field

**Mobile Mode**:
- Priority: base field (no suffix)
- Fallback: `.mobile` or `Sm` suffix
- Avoids: desktop variants

## Panel Display Logic

### Section Panel
Displays when:
- NOT inside a card component
- Direct section click OR section token matches exist
- Shows outer and inner layout fields separately

### Component Panel  
Displays when:
- Element has `data-element` (buttons)
- Element has `data-component-type` (tab navigation)
- Element has `data-card-type` (card components)
- Falls back to dynamic field rendering for unknown types

### Typography Panel
Displays when:
- Element has `data-typography` attribute
- Shows only matched variants
- Groups fields by sub-properties

## Feature Parity Analysis

### Maintained from Legacy Component
1. ✅ **Token Resolution**: Both use `resolveTokenRef` for safe CSS values
2. ✅ **Live Updates**: Both integrate with design context for immediate changes
3. ✅ **Component-specific Panels**: Hard-coded panels for key components
4. ✅ **Typography Support**: Multiple variant handling
5. ✅ **Responsive Design**: Viewport-aware field display

### New Features in DbEditorConnector
1. **Direct DOM Reading**: Reads data attributes directly vs relying on tokenMatches
2. **Heuristic Control Types**: Intelligent input type inference
3. **Field Grouping**: Automatic organization of related fields
4. **Enum Dropdowns**: Pre-defined options for CSS properties
5. **Unit Normalization**: Automatic px addition for unitless values
6. **Variant Support**: Dynamic variant switching for components

## Missing or Divergent Behaviors

### 1. Token Match Computation
**Old**: Relies on `tokenMatches` from EditorOverlayContext
**New**: Primarily uses direct DOM attribute reading with tokenMatches as fallback

### 2. Selection Priority
**Old**: Uses EditorOverlayContext selection logic
**New**: Direct element inspection, may bypass priority rules from `overlayeditor.md`:
```
Priority order (highest to lowest):
1. data-element attribute
2. Semantic HTML tags (button, a, input, etc.)  
3. CSS classes suggesting interactivity
4. Parent traversal up to 3 levels
```

### 3. Error Handling
**Old**: Has explicit error boundaries
**New**: Less robust error handling, could fail silently on malformed data

### 4. Performance Optimizations
**Old**: Implements memoization for token resolution
**New**: No visible performance optimizations, could re-compute on every render

### 5. Placeholder Values
**Old**: Uses actual token values as placeholders
**New**: Hard-coded placeholder strings in panel renderers

### 6. Dynamic Component Discovery
**Old**: Can handle any component type dynamically
**New**: Requires hard-coded panel for full features, falls back to basic rendering

## Recommendations

1. **Add Error Boundaries**: Wrap component in error boundary for robustness
2. **Implement Memoization**: Cache computed values to improve performance
3. **Unify Token Resolution**: Ensure consistent use of `resolveTokenRef`
4. **Document Heuristics**: Add inline documentation for all heuristic decisions
5. **Test Edge Cases**: Verify behavior with malformed or missing data
6. **Align Selection Priority**: Ensure DOM reading respects documented priority rules
