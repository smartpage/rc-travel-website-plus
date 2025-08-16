import { useDesign } from '@/contexts/DesignContext';

/**
 * DESIGN TOKEN UTILITY HOOK
 * 
 * Provides clean access to design tokens with fallbacks and utilities
 * Eliminates ALL hardcoded values in components
 */

export const useDesignTokens = () => {
  const { design } = useDesign();

  // Safe token access with fallbacks
  const getToken = (path: string, fallback: string = ''): string => {
    try {
      const keys = path.split('.');
      let value: any = design;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return fallback;
        }
      }
      
      return typeof value === 'string' ? value : fallback;
    } catch {
      return fallback;
    }
  };

  // Color tokens
  const colors = {
    primary: getToken('colors.primary', 'yellow-500'),
    primaryHover: getToken('colors.primaryHover', 'yellow-600'),
    text: {
      primary: getToken('colors.text.primary', 'text-white'),
      secondary: getToken('colors.text.secondary', 'text-slate-300'),
      muted: getToken('colors.text.muted', 'text-slate-400'),
      heading: getToken('colors.text.heading', 'text-white'),
      body: getToken('colors.text.body', 'text-white'),
      card: getToken('colors.text.card', 'text-white/80'),
    },
    background: {
      primary: getToken('colors.background.primary', 'bg-black'),
      card: getToken('colors.background.card', 'bg-black/80'),
      surface: getToken('colors.background.surface', 'bg-white/5'),
      hover: getToken('colors.background.hover', 'bg-white/10'),
      transparent: getToken('colors.background.transparent', 'bg-transparent'),
    },
    border: {
      primary: getToken('colors.border.primary', 'border-yellow-500'),
      light: getToken('colors.border.light', 'border-white/20'),
      transparent: getToken('colors.border.transparent', 'border-transparent'),
    }
  };

  // Spacing tokens
  const spacing = {
    padding: {
      none: getToken('spacing.padding.none', 'p-0'),
      xs: getToken('spacing.padding.xs', 'p-2'),
      sm: getToken('spacing.padding.sm', 'p-4'),
      md: getToken('spacing.padding.md', 'p-6'),
      lg: getToken('spacing.padding.lg', 'p-8'),
      xl: getToken('spacing.padding.xl', 'p-12'),
      card: getToken('spacing.padding.card', 'p-6 @md:p-8'),
      section: getToken('spacing.padding.section', 'px-4 py-8 @md:px-8 @md:py-12 @lg:px-16 @lg:py-16'),
      container: getToken('spacing.padding.container', 'px-4 @md:px-6 @lg:px-8'),
    },
    margin: {
      none: getToken('spacing.margin.none', 'm-0'),
      auto: getToken('spacing.margin.auto', 'mx-auto'),
      bottom: {
        xs: getToken('spacing.margin.bottom.xs', 'mb-2'),
        sm: getToken('spacing.margin.bottom.sm', 'mb-4'),
        md: getToken('spacing.margin.bottom.md', 'mb-6'),
        lg: getToken('spacing.margin.bottom.lg', 'mb-8'),
        xl: getToken('spacing.margin.bottom.xl', 'mb-12'),
      },
      top: {
        xs: getToken('spacing.margin.top.xs', 'mt-2'),
        sm: getToken('spacing.margin.top.sm', 'mt-4'),
        md: getToken('spacing.margin.top.md', 'mt-6'),
        lg: getToken('spacing.margin.top.lg', 'mt-8'),
        xl: getToken('spacing.margin.top.xl', 'mt-12'),
      }
    },
    gap: {
      none: getToken('spacing.gap.none', 'gap-0'),
      xs: getToken('spacing.gap.xs', 'gap-2'),
      sm: getToken('spacing.gap.sm', 'gap-4'),
      md: getToken('spacing.gap.md', 'gap-6'),
      lg: getToken('spacing.gap.lg', 'gap-8'),
      xl: getToken('spacing.gap.xl', 'gap-12'),
    }
  };

  // Layout tokens  
  const layout = {
    containers: {
      xs: getToken('layout.containers.xs', 'max-w-sm mx-auto'),
      sm: getToken('layout.containers.sm', 'max-w-2xl mx-auto'),
      md: getToken('layout.containers.md', 'max-w-4xl mx-auto'),
      lg: getToken('layout.containers.lg', 'max-w-5xl mx-auto'),
      xl: getToken('layout.containers.xl', 'max-w-6xl mx-auto'),
      '2xl': getToken('layout.containers.2xl', 'max-w-7xl mx-auto'),
      full: getToken('layout.containers.full', 'w-full max-w-none'),
    },
    grids: {
      oneColumn: getToken('layout.grids.oneColumn', 'grid grid-cols-1'),
      twoColumn: getToken('layout.grids.twoColumn', 'grid grid-cols-1 @md:grid-cols-2'),
      threeColumn: getToken('layout.grids.threeColumn', 'grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3'),
      fourColumn: getToken('layout.grids.fourColumn', 'grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4'),
      responsive: {
        cards: getToken('layout.grids.responsive.cards', 'grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3'),
        testimonials: getToken('layout.grids.responsive.testimonials', 'grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4'),
        features: getToken('layout.grids.responsive.features', 'grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3'),
        contact: getToken('layout.grids.responsive.contact', 'grid grid-cols-1 @lg:grid-cols-2'),
      }
    },
    flex: {
      center: getToken('layout.flex.center', 'flex items-center justify-center'),
      between: getToken('layout.flex.between', 'flex items-center justify-between'),
      column: getToken('layout.flex.column', 'flex flex-col'),
      columnCenter: getToken('layout.flex.columnCenter', 'flex flex-col items-center justify-center'),
    },
    widths: {
      full: getToken('layout.widths.full', 'w-full'),
      auto: getToken('layout.widths.auto', 'w-auto'),
    },
    heights: {
      full: getToken('layout.heights.full', 'h-full'),
      screen: getToken('layout.heights.screen', 'h-screen'),
      viewport: getToken('layout.heights.viewport', 'min-h-screen'),
    }
  };

  // Typography tokens
  const typography = {
    fontSize: {
      xs: getToken('typography.fontSize.xs', 'text-xs'),
      sm: getToken('typography.fontSize.sm', 'text-sm'),
      base: getToken('typography.fontSize.base', 'text-base'),
      lg: getToken('typography.fontSize.lg', 'text-lg'),
      xl: getToken('typography.fontSize.xl', 'text-xl'),
      '2xl': getToken('typography.fontSize.2xl', 'text-2xl'),
      '3xl': getToken('typography.fontSize.3xl', 'text-3xl'),
      '4xl': getToken('typography.fontSize.4xl', 'text-4xl'),
      responsive: {
        heading: getToken('typography.fontSize.responsive.heading', 'text-4xl @md:text-6xl @lg:text-7xl'),
        heroHeading: getToken('typography.fontSize.responsive.heroHeading', 'text-5xl @md:text-7xl @lg:text-8xl'),
        subheading: getToken('typography.fontSize.responsive.subheading', 'text-lg @md:text-xl'),
        body: getToken('typography.fontSize.responsive.body', 'text-base @md:text-lg'),
      }
    },
    fontWeight: {
      light: getToken('typography.fontWeight.light', 'font-light'),
      normal: getToken('typography.fontWeight.normal', 'font-normal'),
      medium: getToken('typography.fontWeight.medium', 'font-medium'),
      semibold: getToken('typography.fontWeight.semibold', 'font-semibold'),
      bold: getToken('typography.fontWeight.bold', 'font-bold'),
    },
    textAlign: {
      left: getToken('typography.textAlign.left', 'text-left'),
      center: getToken('typography.textAlign.center', 'text-center'),
      right: getToken('typography.textAlign.right', 'text-right'),
    }
  };

  // Effects tokens
  const effects = {
    shadows: {
      none: getToken('effects.shadows.none', 'shadow-none'),
      sm: getToken('effects.shadows.sm', 'shadow-sm'),
      base: getToken('effects.shadows.base', 'shadow'),
      lg: getToken('effects.shadows.lg', 'shadow-lg'),
      xl: getToken('effects.shadows.xl', 'shadow-xl'),
      '2xl': getToken('effects.shadows.2xl', 'shadow-2xl'),
    },
    borders: {
      none: getToken('effects.borders.none', 'border-0'),
      thin: getToken('effects.borders.thin', 'border'),
      thick: getToken('effects.borders.thick', 'border-2'),
      radius: {
        none: getToken('effects.borders.radius.none', 'rounded-none'),
        base: getToken('effects.borders.radius.base', 'rounded'),
        lg: getToken('effects.borders.radius.lg', 'rounded-lg'),
        xl: getToken('effects.borders.radius.xl', 'rounded-xl'),
        '2xl': getToken('effects.borders.radius.2xl', 'rounded-2xl'),
        full: getToken('effects.borders.radius.full', 'rounded-full'),
      }
    },
    transitions: {
      all: getToken('effects.transitions.all', 'transition-all duration-300'),
      fast: getToken('effects.transitions.fast', 'transition-all duration-150'),
      colors: getToken('effects.transitions.colors', 'transition-colors duration-300'),
    },
    blur: {
      sm: getToken('effects.blur.sm', 'backdrop-blur-sm'),
      base: getToken('effects.blur.base', 'backdrop-blur'),
      lg: getToken('effects.blur.lg', 'backdrop-blur-lg'),
    }
  };

  // Component tokens
  const components = {
    card: {
      primary: getToken('components.card.primary', 'bg-black/80 backdrop-blur-lg border-2 border-yellow-500 rounded-2xl shadow-2xl transition-all duration-300'),
      secondary: getToken('components.card.secondary', 'bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg transition-all duration-300'),
      glass: getToken('components.card.glass', 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl'),
    },
    button: {
      primary: getToken('components.button.primary', 'bg-yellow-500 hover:bg-yellow-600 text-black font-normal px-6 py-4 @md:px-8 @md:py-6 rounded-xl border-2 border-yellow-500 hover:border-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'),
      secondary: getToken('components.button.secondary', 'bg-transparent hover:bg-white/10 text-white font-normal px-6 py-4 @md:px-8 @md:py-6 rounded-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300'),
      ghost: getToken('components.button.ghost', 'bg-transparent hover:bg-white/5 text-white px-4 py-2 rounded-lg transition-colors duration-200'),
    },
    input: {
      primary: getToken('components.input.primary', 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-yellow-500 focus:outline-none transition-colors duration-200'),
    },
    navigation: {
      menu: getToken('components.navigation.menu', 'hidden @md:flex items-center space-x-8'),
      hamburger: getToken('components.navigation.hamburger', 'block @md:hidden p-3 bg-white/10 backdrop-blur-sm rounded-full'),
    }
  };

  // Utility functions
  const cx = (...classes: (string | undefined | false | null)[]): string => {
    return classes.filter(Boolean).join(' ');
  };

  return {
    getToken,
    colors,
    spacing,
    layout,
    typography,
    effects,
    components,
    cx,
    // Raw design object access if needed
    design
  };
};

export default useDesignTokens;
