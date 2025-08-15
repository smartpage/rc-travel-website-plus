# Logo System Implementation Guide

This document provides a comprehensive guide to the logo system implementation, including normal and inverted logos, smooth fade animations, and configuration structure.

## Overview

The logo system supports:
- **Normal logo**: Primary logo displayed by default
- **Inverted logo**: Alternative logo displayed when the mobile menu is open
- **Smooth fade animations**: Seamless transitions between logo states
- **Responsive sizing**: CSS custom properties for consistent sizing across breakpoints
- **Configuration-driven**: All logo settings managed through the design configuration

## Architecture

### 1. SiteConfig Integration

The logo URLs are stored in the `SiteConfig` interface and managed through the SettingsContext:

```typescript
// src/contexts/SettingsContext.tsx
interface SiteConfig {
  name: string;
  tagline: string;
  fullTitle: string;
  description: string;
  keywords: string;
  logoUrl: string;           // Normal logo URL
  invertedLogoUrl: string;   // Inverted logo URL (for menu overlay)
}
```

### 2. Design Configuration

Logo styling is managed in the design configuration (`src/config.ts`):

```typescript
// src/config.ts
logos: {
  main: {
    // Main logo configuration
    height: '10em',                    // Base: 48px (h-12)
    heightMd: '10em',                  // Medium: 64px (h-16) 
    heightLg: '10em',                  // Large: 80px (h-20)
    width: 'auto',                     // Maintain proportion
    objectFit: 'contain'               // object-contain
  },
  inverted: {
    // Inverted logo configuration (same as main for consistency)
    height: '10em',                    // Base: 48px (h-12)
    heightMd: '10em',                  // Medium: 64px (h-16) 
    heightLg: '10em',                  // Large: 80px (h-20)
    width: 'auto',                     // Maintain proportion
    objectFit: 'contain'               // object-contain
  }
}
```

### 3. CSS Custom Properties System

The logo sizing is managed through CSS custom properties for consistent responsive behavior:

```typescript
// Logo configuration selection based on menu state
const activeLogoConfig = (isOpen && design.logos.inverted) ? design.logos.inverted : design.logos.main;

// CSS custom properties generation
const logoStyles = {
  '--logo-height': activeLogoConfig.height,
  '--logo-height-md': activeLogoConfig.heightMd,
  '--logo-height-lg': activeLogoConfig.heightLg,
  '--logo-width': activeLogoConfig.width,
  '--logo-object-fit': activeLogoConfig.objectFit,
} as React.CSSProperties;
```

## Implementation Details

### Navigation Component (src/components/Navigation.tsx)

Complete implementation with fade animation:

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import HamburgerIcon from "./HamburgerIcon";

const Navigation = () => {
  const { design } = useDesign();
  const { siteConfig, agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const navigation = getContentForComponent<any>('Navigation');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Determine which logo configuration to use based on menu state
  const activeLogoConfig = (isOpen && design.logos.inverted) ? design.logos.inverted : design.logos.main;

  // Define CSS variables for the logo
  const logoStyles = {
    '--logo-height': activeLogoConfig.height,
    '--logo-height-md': activeLogoConfig.heightMd,
    '--logo-height-lg': activeLogoConfig.heightLg,
    '--logo-width': activeLogoConfig.width,
    '--logo-object-fit': activeLogoConfig.objectFit,
  } as React.CSSProperties;

  // Logo with fade animation implementation
  const renderLogo = () => (
    <a href="#" className="flex items-center py-3 sm:py-4" style={logoStyles}>
      {loading ? (
        <Skeleton height={56} width={120} className="sm:h-12" />
      ) : (
        <div className="relative">
          {/* Normal logo */}
          <motion.img 
            key="normal-logo"
            src={siteConfig?.logoUrl}
            alt={`${agentConfig?.fullName || ''} - ${siteConfig?.tagline || ''}`}
            className="logo-responsive"
            initial={{ opacity: 1 }}
            animate={{ opacity: isOpen ? 0 : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ position: isOpen ? 'absolute' : 'static', top: 0, left: 0 }}
          />
          {/* Inverted logo */}
          {siteConfig?.invertedLogoUrl && (
            <motion.img 
              key="inverted-logo"
              src={siteConfig?.invertedLogoUrl}
              alt={`${agentConfig?.fullName || ''} - ${siteConfig?.tagline || ''}`}
              className="logo-responsive"
              initial={{ opacity: 0 }}
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ position: isOpen ? 'static' : 'absolute', top: 0, left: 0 }}
            />
          )}
        </div>
      )}
    </a>
  );

  return (
    <>
      <nav className={`fixed top-0 w-full z-[60] transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-lg' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="flex justify-center w-full">
          <div className="w-full max-w-screen-xl flex items-center justify-between px-0 mx-auto">
            <div className="flex-1 flex items-center pl-4 sm:pl-6 md:pl-10">
              {renderLogo()}
            </div>
            {/* ... rest of navigation ... */}
          </div>
        </div>
      </nav>
      {/* ... menu overlay ... */}
    </>
  );
};
```

### NavigationVariation Component (src/components/NavigationVariation.tsx)

Similar implementation with additional scroll-based animations:

```tsx
const NavigationVariation = () => {
  const { design } = useDesign();
  const { siteConfig, agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const navigation = getContentForComponent<any>('NavigationVariation');

  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Logo configuration selection
  const activeLogoConfig = (isOpen && design.logos.inverted) ? design.logos.inverted : design.logos.main;

  // CSS custom properties
  const logoStyles = {
    '--logo-height': activeLogoConfig.height,
    '--logo-height-md': activeLogoConfig.heightMd,
    '--logo-height-lg': activeLogoConfig.heightLg,
    '--logo-width': activeLogoConfig.width,
    '--logo-object-fit': activeLogoConfig.objectFit,
  } as React.CSSProperties;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between p-4 sm:p-6">
        {/* Logo with scroll animation */}
        <motion.div 
          initial={{ y: 0, opacity: 1 }}
          animate={{ 
            y: (isScrolled && !isOpen) ? -100 : 0,
            opacity: (isScrolled && !isOpen) ? 0 : 1
          }}
          transition={{ 
            duration: 0.4,
            ease: "easeInOut"
          }}
        >
          <a href="#" className="flex items-center" style={logoStyles}>
            {loading ? (
              <Skeleton height={48} width={150} />
            ) : (
              <div className="relative">
                {/* Normal logo */}
                <motion.img 
                  key="normal-logo"
                  src={siteConfig?.logoUrl}
                  alt={`${agentConfig?.fullName || 'Travel Agent'} - ${siteConfig?.tagline || 'Travel Designer'}`}
                  className="logo-responsive"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: isOpen ? 0 : 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ position: isOpen ? 'absolute' : 'static', top: 0, left: 0 }}
                />
                {/* Inverted logo */}
                {siteConfig?.invertedLogoUrl && (
                  <motion.img 
                    key="inverted-logo"
                    src={siteConfig?.invertedLogoUrl}
                    alt={`${agentConfig?.fullName || 'Travel Agent'} - ${siteConfig?.tagline || 'Travel Designer'}`}
                    className="logo-responsive"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ position: isOpen ? 'static' : 'absolute', top: 0, left: 0 }}
                  />
                )}
              </div>
            )}
          </a>
        </motion.div>
        {/* ... hamburger button ... */}
      </div>
      {/* ... rest of component ... */}
    </>
  );
};
```

## Animation System

### Fade Transition Logic

The logo fade animation system works as follows:

1. **Container Structure**: A relative container holds both logo versions
2. **Position Management**: Dynamic position switching based on menu state
3. **Opacity Animation**: Framer Motion controls opacity transitions
4. **Timing**: 0.3s duration with easeInOut easing for smooth transitions

#### Animation States

| Menu State | Normal Logo | Inverted Logo |
|------------|-------------|---------------|
| **Closed** | `opacity: 1`, `position: static` | `opacity: 0`, `position: absolute` |
| **Open** | `opacity: 0`, `position: absolute` | `opacity: 1`, `position: static` |

#### Key Animation Properties

```tsx
// Normal logo animation
<motion.img 
  initial={{ opacity: 1 }}
  animate={{ opacity: isOpen ? 0 : 1 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
  style={{ position: isOpen ? 'absolute' : 'static', top: 0, left: 0 }}
/>

// Inverted logo animation
<motion.img 
  initial={{ opacity: 0 }}
  animate={{ opacity: isOpen ? 1 : 0 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
  style={{ position: isOpen ? 'static' : 'absolute', top: 0, left: 0 }}
/>
```

## CSS Classes and Styling

### Core CSS Classes

```css
/* Logo responsive class - defined in global styles */
.logo-responsive {
  height: var(--logo-height);
  width: var(--logo-width);
  object-fit: var(--logo-object-fit);
}

@media (min-width: 768px) {
  .logo-responsive {
    height: var(--logo-height-md);
  }
}

@media (min-width: 1024px) {
  .logo-responsive {
    height: var(--logo-height-lg);
  }
}
```

### Container Styling

```tsx
// Relative container for logo positioning
<div className="relative">
  {/* Logo elements */}
</div>

// Navigation container styling
<div className="flex-1 flex items-center pl-4 sm:pl-6 md:pl-10">
  {/* Logo container */}
</div>
```

## Integration Points

### 1. Context Dependencies

- **DesignContext**: Provides logo configuration from `design.logos`
- **SettingsContext**: Provides logo URLs from `siteConfig`
- **ContentContext**: Provides loading states for skeleton animations

### 2. State Management

```tsx
const [isOpen, setIsOpen] = useState(false);  // Menu open/close state
const [isScrolled, setIsScrolled] = useState(false);  // Scroll state (NavigationVariation)
```

### 3. Configuration Selection Logic

```tsx
// Dynamic configuration selection based on menu state
const activeLogoConfig = (isOpen && design.logos.inverted) 
  ? design.logos.inverted 
  : design.logos.main;
```

## Troubleshooting

### Common Issues

1. **No Fade Animation**: Ensure framer-motion is imported and both logo images exist
2. **Layout Jumping**: Verify relative container and proper position switching
3. **Sizing Issues**: Check CSS custom properties are properly applied
4. **Missing Inverted Logo**: Verify `siteConfig?.invertedLogoUrl` exists and is accessible

### Debug Checklist

- [ ] Both `logoUrl` and `invertedLogoUrl` are set in SiteConfig
- [ ] Framer Motion `<motion.img>` components are used
- [ ] Relative container wraps both logo images
- [ ] CSS custom properties are applied to logo container
- [ ] Animation transitions are defined with proper duration and easing
- [ ] Position switching logic is correctly implemented

## Best Practices

1. **Performance**: Use skeleton loading for better perceived performance
2. **Accessibility**: Provide meaningful alt text for both logo versions
3. **Fallbacks**: Handle cases where inverted logo might not exist
4. **Consistency**: Use same animation duration across all logo transitions
5. **Responsive Design**: Leverage CSS custom properties for consistent sizing

## Future Enhancements

1. **Logo Variants**: Support for additional logo variants (dark mode, seasonal)
2. **Custom Animations**: Configurable animation types and durations
3. **Lazy Loading**: Implement lazy loading for logo images
4. **Preloading**: Preload inverted logo for smoother transitions
5. **Animation Preferences**: Respect user's motion preferences

## Replication Guide

To replicate this logo system in a new project:

1. **Setup SiteConfig interface** with `logoUrl` and `invertedLogoUrl`
2. **Add logo configuration** to design config with sizing properties
3. **Implement CSS custom properties** system for responsive sizing
4. **Create logo components** with framer-motion fade animations
5. **Add skeleton loading** for better UX during loading states
6. **Test thoroughly** across different devices and menu states

This system provides a professional, smooth logo transition experience that enhances the overall user interface quality.
