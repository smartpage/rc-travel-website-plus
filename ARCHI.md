# 🏗️ RC Travel Website Architecture

This document explains the high-level architecture of the RC Travel Website - how content flows from Firestore to the browser.

---

## 🎯 Architecture Overview

### High-Level Flow

1. **SiteIndex** drives dynamic component loading via manifest from Firestore
2. **Zod schemas** enable runtime validation and auto-generated types, solving context type rigidity
3. **Zod contexts** load data from Firestore and validate with Zod
4. **Components** use hooks to access validated data and render UI

### Migration Status
- ✅ **Zod schemas** implemented for all contexts
- ✅ **Zod contexts** deployed with full Firestore integration
- ✅ **API_BASE_URL** used consistently across all contexts
- ✅ **Migration complete** - all contexts now use Zod validation
- ✅ **Zero breaking changes** - components work identically

---

## 1. 📋 SiteIndex - The Master List

**What it is**: A Firestore document that acts like a **shopping list** telling the website which sections to display.

**Location**: `/organizations/{orgId}/sites/{siteId}/content/siteIndex`

**Structure**:
```json
{
  "sections": [
    {
      "id": "hero-1",
      "name": "hero",
      "component": "HeroSection",
      "isActive": true,
      "order": 1
    },
    {
      "id": "packages-1", 
      "name": "packages",
      "component": "TravelPackages",
      "isActive": true,
      "order": 2
    }
  ]
}
```

**How it works**:
- **DynamicRenderer** reads this list
- **Loads components** based on `component` field
- **Maintains order** from Firestore
- **No code changes** needed for new sections

---

## 2. 🔄 Auto-Generated Types - Smart Validation

**Problem solved**: Adding new fields in Firestore no longer requires TypeScript interface updates.

**How it works**:
1. **Define Zod schemas** for each component's expected data shape
2. **Runtime validation** ensures Firestore data matches expectations
3. **Auto-generated TypeScript types** from schemas
4. **New optional fields** work immediately without code changes

**Example**:
```tsx
// Define once - handles validation + types
const HeroSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  newField: z.string().optional() // ✅ No code change needed
})

type HeroContent = z.infer<typeof HeroSchema>
```

---

## 3. 📦 Contexts & Hooks - The Context Layer (Zod-enhanced)

#### ContentContext (`ZodContentContext.tsx`)
- **Purpose**: Manages all content loaded from Firestore
- **Features**: 
  - Runtime validation with Zod schemas
  - Component-to-section mapping
  - Refresh functionality
  - Error handling and fallbacks
  - API_BASE_URL integration (no hardcoded URLs)

#### DesignContext (`ZodDesignContext.tsx`)  
- **Purpose**: Manages design tokens and styling from Firestore
- **Features**:
  - Runtime validation of design tokens
  - Site-specific design loading
  - Fallback to local config
  - API_BASE_URL integration

#### SettingsContext (`ZodSettingsContext.tsx`)
- **Purpose**: Manages site settings and agent configuration
- **Features**:
  - Runtime validation of settings
  - Separate agent and site config handling
  - API_BASE_URL integration

### Migration Guide

#### Phase 1: Testing (Current)
- Test new Zod contexts alongside existing ones
- Validate Firestore data loading
- Check Zod validation works correctly

#### Phase 2: Component Migration
- Update components to use new Zod contexts
- Replace imports from `ContentContext` → `ZodContentContext`
- Update hook usage patterns

#### Phase 3: Cleanup
- Remove old context files
- Rename Zod contexts to original names
- Update all import paths

### Usage Pattern:
```tsx
// Components use these hooks to find their pieces
const { getSectionContent } = useContent()
const { design } = useDesign()
const { agentConfig } = useSettings()
```

---

## 4. 🧩 Components - The Toys That Find Their Pieces

**Current Pattern**: Components are **context-aware** - they know how to find their own pieces in the toy box.

**How a component works**:
1. **Loads via DynamicRenderer** (based on siteIndex)
2. **Uses hooks** to find its specific pieces
3. **Validates data** via Zod schemas
4. **Renders** with proper error handling

**Example Component Pattern**:
```tsx
const HeroSection = () => {
  // Find pieces in the toy box
  const { getContentForComponent } = useContent()
  const { design } = useDesign()
  
  // Validate the pieces match expectations
  const heroData = getContentForComponent('HeroSection', HeroSchema)
  
  // Use the pieces to build the toy
  return <div style={{color: design.colors.primary}}>{heroData.title}</div>
}
```

---

## 🚀 Benefits of This Architecture

1. **Truly Dynamic**: Add sections via Firestore without code changes
2. **Type Safe**: Runtime validation prevents Firestore schema mismatches
3. **Flexible**: New optional fields work immediately
4. **Site-Specific**: Each site can have different content/design
5. **Maintainable**: Clear separation between data (Firestore) and presentation (React)

---

## 🔄 Data Flow Summary

```
Firestore → Contexts → Hooks → Components → UI
    ↓         ↓        ↓        ↓        ↓
siteIndex → Contexts → Hooks → Validation → Render
```

**Key insight**: The website is **data-driven** - everything flows from Firestore, and the code adapts to the data rather than the other way around.
