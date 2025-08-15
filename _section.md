# 📋 Section Component Standards

This document defines the standards for creating new section components in the RC Travel Website.

---

## 🎯 Overview

Section components are **purely presentational** components that receive their data as props. They are automatically loaded by the `DynamicRenderer` based on the `siteIndex` from Firestore.

---

## 📁 File Structure

```
src/components/sections/
├── HeroSection.tsx
├── TravelPackages.tsx
├── AboutSection.tsx
└── [YourSectionName]Section.tsx
```

---

## 🧩 Component Standards

### 1. **File Naming Convention**
- **Pattern**: `{SectionName}Section.tsx`
- **Examples**: `HeroSection.tsx`, `TravelPackagesSection.tsx`
- **Required**: Must end with "Section"

### 2. **Props Interface**

```tsx
interface SectionProps {
  content: any;           // Content data from Firestore (validated by Zod)
  design: DesignConfig;   // Design tokens from Firestore
  siteId?: string;        // Current site identifier
  sectionId?: string;     // Unique section identifier
}
```

### 3. **Basic Template**

```tsx
import React from 'react';
import { DesignConfig } from '@/contexts/DesignContext';

interface {SectionName}SectionProps {
  content: any;
  design: DesignConfig;
  siteId?: string;
  sectionId?: string;
}

const {SectionName}Section: React.FC<{SectionName}SectionProps> = ({
  content,
  design,
  siteId,
  sectionId
}) => {
  // Component logic here
  
  return (
    <section 
      id={sectionId}
      style={{
        backgroundColor: design.colors?.background,
        color: design.colors?.text,
        fontFamily: design.fonts?.body
      }}
    >
      {/* Your section content */}
    </section>
  );
};

export default {SectionName}Section;
```

### 4. **Content Data Access**

The component receives `content` prop which contains all data for this section from Firestore:

```tsx
// Example: HeroSection content structure
const heroContent = {
  title: "Welcome to Portugal",
  subtitle: "Discover amazing destinations",
  ctaText: "Book Now",
  backgroundImage: "https://...",
  // ... any additional fields
};
```

### 5. **Design Token Usage**

Always use design tokens from the `design` prop:

```tsx
// Colors
<div style={{ color: design.colors?.primary }}>

// Fonts
<h1 style={{ fontFamily: design.fonts?.title }}>

// Spacing
<div style={{ padding: design.spacing?.large }}>

// Border Radius
<button style={{ borderRadius: design.borderRadius?.medium }}>
```

---

## 🔧 Content Schema Guidelines

### 1. **Zod Schema Creation**

Create a Zod schema for your section's content structure:

```tsx
// src/schemas/sections/{SectionName}Schema.ts
import { z } from 'zod';

export const {SectionName}Schema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  // Add your specific fields
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional()
  })).optional()
}).passthrough(); // Allows unknown properties

export type {SectionName}Content = z.infer<typeof {SectionName}Schema>;
```

### 2. **Using Typed Content**

```tsx
import { {SectionName}Content } from '@/schemas/sections/{SectionName}Schema';

interface {SectionName}SectionProps {
  content: {SectionName}Content;
  design: DesignConfig;
  // ...
}
```

---

## 🚀 Adding New Sections

### **Step 1: Create Component**
```bash
# Create new section component
touch src/components/sections/{YourSectionName}Section.tsx
```

### **Step 2: Add to Firestore**
Add your section to the siteIndex:
```json
{
  "sections": [
    {
      "id": "your-section-unique-id",
      "name": "your-section-name",
      "component": "YourSectionNameSection",
      "isActive": true,
      "order": 3
    }
  ]
}
```

### **Step 3: Add Content**
Add your section's content to Firestore:
```json
{
  "your-section-name": {
    "title": "Your Section Title",
    "description": "Your section content...",
    // ... your specific fields
  }
}
```

**That's it!** No code changes needed in the app.

---

## 🧪 Testing Standards

### **1. Unit Testing**
```tsx
// Test with mock data
const mockContent = {
  title: "Test Title",
  description: "Test Description"
};

const mockDesign = {
  colors: { primary: "#007bff", text: "#333" },
  fonts: { title: "Inter", body: "Inter" }
};

// Render component with props
<YourSectionSection 
  content={mockContent} 
  design={mockDesign} 
/>
```

### **2. Storybook Ready**
Components should work in isolation:
```tsx
// .stories.tsx file
export default {
  title: 'Sections/YourSection',
  component: YourSectionSection,
};

export const Default = {
  args: {
    content: mockContent,
    design: mockDesign
  }
};
```

---

## 🎨 Design System Integration

### **Responsive Design**
Use design tokens for responsive values:

```tsx
// Responsive padding
<div style={{ 
  padding: design.spacing?.mobile, 
  '@media (min-width: 768px)': { padding: design.spacing?.tablet }
}}>
```

### **Dark Mode Support**
Use design tokens for theme switching:

```tsx
// Theme-aware colors
<div style={{ 
  backgroundColor: design.colors?.background,
  color: design.colors?.text 
}}>
```

---

## 📊 Common Patterns

### **1. Loading States**
Handled by the HOC wrapper, not the section component.

### **2. Error Handling**
Handled by the HOC wrapper, section receives validated data.

### **3. Empty States**
```tsx
if (!content?.items?.length) {
  return <div>No items to display</div>;
}
```

### **4. Image Handling**
```tsx
<img 
  src={content.imageUrl} 
  alt={content.imageAlt || ''}
  style={{ borderRadius: design.borderRadius?.medium }}
/>
```

---

## 🔍 Validation Checklist

Before deploying a new section:

- [ ] Component file ends with "Section.tsx"
- [ ] Props interface uses `SectionProps`
- [ ] Uses design tokens from `design` prop
- [ ] Handles empty states gracefully
- [ ] Uses Zod schema for type safety
- [ ] Works with mock data for testing
- [ ] Follows responsive design patterns
- [ ] No direct context usage (waits for HOC)

---

## 📝 Examples

### **Simple Section**
```tsx
const SimpleSection: React.FC<SectionProps> = ({ content, design }) => (
  <section style={{ padding: design.spacing?.large }}>
    <h1 style={{ fontFamily: design.fonts?.title }}>{content.title}</h1>
    <p>{content.description}</p>
  </section>
);
```

### **Complex Section**
```tsx
const ComplexSection: React.FC<SectionProps> = ({ content, design }) => (
  <section>
    <h2>{content.title}</h2>
    <div className="grid">
      {content.items?.map((item: any) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  </section>
);
```

---

**Next**: Implement HOC wrapper to inject these props automatically.
