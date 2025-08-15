# 🔧 How to Add New Component Sections to RC Travel Website

This guide provides a **step-by-step process** for adding new component sections to the RC Travel Website. Follow these steps exactly to ensure proper integration with the site's dynamic architecture.

---

## 📋 Prerequisites

- Understanding of React/TypeScript
- Familiarity with the site's manifest-driven architecture
- Access to Firebase credentials (`.env` file configured)

---

## 🛠 Step-by-Step Guide

### **Step 1: Analyze Source Component (If Copying)**

If copying from another site (like jaimes-luxury-rides):

```bash
# 1. Locate the source component
cd /path/to/source-site/src/components/

# 2. Study the component structure
# - What props does it accept?
# - What styling approach does it use?
# - What external libraries does it depend on?
```

**Example from our services section work:**
- Source: `jaimes-luxury-rides/src/components/Services.tsx`  
- Dependencies: Lucide React icons, Framer Motion
- Styling: Tailwind CSS classes
- Data structure: Services array with icons, titles, descriptions

---

### **Step 2: Create Content JSON File**

Create the content file in `/src/data/` following the naming convention:

```bash
# Naming convention: {sectionName}Content.json
touch src/data/servicesContent.json
touch src/data/contactFormContent.json
```

**Content Structure Example:**
```json
{
  "title": "Nossos Serviços",
  "subtitle": "Experiências Personalizadas",
  "description": "Oferecemos uma gama completa de serviços...",
  "services": [
    {
      "id": "transfers",
      "icon": "Plane", 
      "title": "Transfers Aeroportuários",
      "description": "Transporte confortável e pontual...",
      "buttonText": "Saber Mais",
      "buttonLink": "https://wa.me/351912424269"
    }
  ]
}
```

**⚠️ Important Guidelines:**
- Use **Portuguese content** for RC Travel
- Include proper IDs for all items
- Follow consistent data structure
- Add `buttonText` and `buttonLink` for interactive elements

---

### **Step 3: Create React Component**

Create the component in `/src/components/`:

```bash
# Component naming: PascalCase ending with "Section"
touch src/components/ServicesSection.tsx
touch src/components/ContactFormSection.tsx
```

**Component Template:**
```tsx
import React from 'react';
import { useContent } from '@/contexts/ContentContext';
import { useDesign } from '@/contexts/DesignContext';
import Section from '@/components/ui/Section';
import SectionTitle from '@/components/ui/SectionTitle';

const YourSection: React.FC = () => {
  const { getContentForComponent } = useContent();
  const { design } = useDesign();
  
  // ✅ CRITICAL: Use getContentForComponent() - never hardcode section names
  const content = getContentForComponent<any>('YourSection');

  // Skeleton loading while content loads
  if (!content) {
    return (
      <Section sectionId="yourSection">
        <div className="max-w-7xl mx-auto px-4">
          {/* Add skeleton components */}
        </div>
      </Section>
    );
  }

  return (
    <Section sectionId="yourSection">
      <SectionTitle 
        title={content.title}
        subtitle={content.subtitle}
        description={content.description}
      />
      
      {/* Your section content here */}
      
    </Section>
  );
};

export default YourSection;
```

**🔑 Architecture Rules:**
- **Always** use `Section` component wrapper
- **Always** use `SectionTitle` for consistent titles  
- **Never** hardcode section names - use `getContentForComponent()`
- **Always** implement skeleton loading
- **Use** design tokens from `useDesign()` hook

---

### **Step 4: Register Component**

Add your component to `/src/utils/ComponentRegistry.tsx`:

```tsx
// 1. Import your component
import YourSection from '@/components/YourSection';

// 2. Add to componentRegistry object
export const componentRegistry: Record<string, React.ComponentType<any>> = {
  // ... existing components
  YourSection,
};
```

**⚠️ Critical:** The key in `componentRegistry` must **exactly match** the component name used in `siteIndex.json`.

---

### **Step 5: Update Site Index**

Add your section to `/src/data/siteIndex.json`:

```json
{
  "sections": [
    {
      "id": "your-section-id",
      "name": "yourSection",
      "component": "YourSection", 
      "isActive": true,
      "contentFile": "yourSectionContent"
    }
  ]
}
```

**Field Explanations:**
- `id`: Unique identifier for the section
- `name`: Used for content file mapping (`{name}Content.json`)
- `component`: Must match key in `ComponentRegistry.tsx`
- `isActive`: Set to `true` to display the section
- `contentFile`: Name without `.json` extension

---

### **Step 6: Add Design Configuration (Optional)**

If your section needs special styling, add to `/src/config.ts`:

```typescript
export const design = {
  // ... existing config
  sections: {
    // ... existing sections
    yourSection: {
      layout: {
        maxWidth: 'none',
        backgroundColor: null,
        padding: {
          mobile: '4rem 1rem',
          tablet: '6rem 2rem', 
          desktop: '6rem 2rem',
        },
        // ... more config
      },
    },
  },
} as const;
```

---

### **Step 7: Upload Content to Firebase**

Use the upload script to seed your content:

```bash
# Upload your specific content file
node scripts/upload-content-to-firebase.js yourSectionContent

# Upload content + update siteIndex (if you modified siteIndex.json)
node scripts/upload-content-to-firebase.js yourSectionContent --with-siteindex
```

**Script Process:**
1. Reads your JSON content file
2. Maps to correct Firebase document name
3. Uploads to: `organizations/{orgId}/websites/{siteId}/content/{documentName}`

---

### **Step 8: Test and Validate**

1. **Local Development:**
   ```bash
   npm run dev
   # Check that your section appears on the site
   ```

2. **Content Loading:**
   - Verify section content loads from Firebase
   - Check skeleton loading works properly
   - Test responsive design

3. **Interactive Elements:**
   - Test buttons and links
   - Verify external links open in new tabs
   - Check WhatsApp links work properly

---

## 🎯 Real Examples

### **Services Section Implementation**

**Files Created:**
- `/src/data/servicesContent.json` - Portuguese services content
- `/src/components/ServicesSection.tsx` - Main section component  
- `/src/components/ServiceCard.tsx` - Reusable card component

**siteIndex.json Entry:**
```json
{
  "id": "services-section",
  "name": "services", 
  "component": "ServicesSection",
  "isActive": true,
  "contentFile": "servicesContent"
}
```

**Key Features:**
- Grid layout with service cards
- Yellow WhatsApp card with special styling
- Working buttons that open WhatsApp
- Rounded corners matching site design

---

### **Contact Form Implementation**

**Files Created:**
- `/src/data/contactFormContent.json` - Form fields and labels
- `/src/components/ContactFormSection.tsx` - Form component

**Features:**
- Portuguese form labels and placeholders
- Responsive design
- Frontend-only (no backend submission yet)
- Validation and error states

---

## 🚨 Common Pitfalls to Avoid

### **❌ Don't Do This:**
```tsx
// Never hardcode section names
const content = getSectionContent('services'); // ❌ Wrong

// Never skip skeleton loading  
if (!content) return null; // ❌ Wrong

// Never hardcode styling without design tokens
className="bg-blue-500" // ❌ Wrong
```

### **✅ Do This Instead:**
```tsx
// Use dynamic component lookup
const content = getContentForComponent('ServicesSection'); // ✅ Right

// Always implement skeleton loading
if (!content) return <SkeletonComponent />; // ✅ Right

// Use design tokens
className={`bg-${design.colors.primary}`} // ✅ Right
```

---

## 🔧 Troubleshooting

### **Section Doesn't Appear**
- Check `ComponentRegistry.tsx` - is component registered?
- Check `siteIndex.json` - is `isActive: true`?
- Check console for errors

### **Content Not Loading**
- Verify content uploaded to Firebase
- Check network tab for API calls
- Verify content file naming matches `siteIndex.json`

### **Styling Issues**
- Check if design config exists for your section
- Verify Tailwind classes are valid
- Check responsive breakpoints

### **Button/Link Issues**
- Verify `buttonText` exists and is not empty
- Check `buttonLink` format (full URLs for external)
- Test both internal and external links

---

## 📚 Additional Resources

- **Architecture Documentation:** `/ARCHITECTURE.md`
- **Design System:** `/src/config.ts`  
- **Upload Script:** `/scripts/upload-content-to-firebase.js`
- **Firebase Console:** Check content in database

---

## ✅ Checklist

Before considering your section complete:

- [ ] Content JSON created with proper structure
- [ ] React component follows architecture rules
- [ ] Component registered in ComponentRegistry.tsx
- [ ] siteIndex.json updated
- [ ] Content uploaded to Firebase
- [ ] Section appears and loads correctly
- [ ] Interactive elements work
- [ ] Responsive design tested
- [ ] Skeleton loading implemented
- [ ] Design consistent with site theme

---

**🎉 Congratulations!** Your new section should now be live and fully integrated with the RC Travel Website's dynamic architecture.
