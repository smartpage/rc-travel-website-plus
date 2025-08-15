import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { z } from 'zod';
import { SITE_ID, ORG_ID } from '../../db_connect';
import { validateData } from '@/schemas/contextSchemas';
import { fetchDesignFromLocalDB } from '@/adapters/designAdapter';
import defaultDesign from '@/design-default.json';

// Types

// New Section Styling Configuration Types
export interface SectionPadding {
  mobile: string;
  tablet: string;
  desktop: string;
}

export interface SectionBackground {
  type: 'color' | 'image';
  value: string;
  overlay?: {
    color: string;
    opacity: number;
  };
  styles?: {
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    minWidth?: string;
    minHeight?: string;
  };
}

export interface SectionInnerLayout {
  maxWidth: string;
  height?: string;
  display?: string;
  alignItems?: string;
  justifyContent?: string;
  margin: string;
  padding: SectionPadding;
  rounded: boolean;
  borderRadius?: string;
  backgroundColor?: string;
  overflow: 'hidden' | 'visible';
  background: SectionBackground;
}

export interface SectionLayout {
  maxWidth: string;
  width?: string;
  minHeight?: string;
  height?: string;
  display?: string;
  alignItems?: string;
  justifyContent?: string;
  backgroundColor?: string;
  padding: SectionPadding;
  inner: SectionInnerLayout;
}

export interface SectionConfig {
  layout: SectionLayout;
}

export interface TravelPackageCardConfig {
  minHeight: string;
  maxHeight: string;
  imageHeight: string;
  contentPadding: string;
}

interface DesignConfig {
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    text: string;
    textLight: string;
    background: string;
    cardBackground: string;
    pageBackground: string;   // Background da página principal
    accent: string;
    highlight: string;
    headingColor: string;
  };
  fonts: {
    title: string;
    body: string;
  };
  primaryCards: {
    container: {
      base: string;
      border: string;
      rounded: string;
      shadow: string;
      transition: string;
      padding: string;
      hover: string;
    };
    header: {
      spacing: string;
    };
    title: {
      layout: string;
      base: string;
      fontSize: string;
      fontWeight: string;
      iconColor: string;
      iconSize: string;
    };
    content: {
      spacing: string;
    };
    description: {
      color: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      spacing: string;
    };
  };
  typography: {
    body: {
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      color: string;
    };
    cardBody: {
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      color: string;
    };
    subtitle: {
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      color: string;
    };
    description: {
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      color: string;
    };
    small: {
      fontFamily: string;
      fontSize: string;
      fontWeight: string;
      lineHeight: string;
      color: string;
    };
  };
  travelPackageCard: TravelPackageCardConfig;
  cardDefaults: {
    className: string;
    motionWhileHover: { [key: string]: any };
  };
  hero_headings?: {
    fontFamily: string;
    fontSize: string;
    fontSizeMd: string;
    fontSizeLg: string;
    lineHeight: string;
    fontWeight: string;
    letterSpacing: string;
    color: string;
    marginBottom: string;
    textAlign: string;
  };
  preTitle?: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    marginBottom: string;
  };
  titleDescription?: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    color: string;
    lineHeight: string;
    marginTop: string;
  };
  headings: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    fontWeight: string;
    letterSpacing: string;
    color: string;
  };
  buttons: {
    primary: {
      text: string;
      bg: string;
      hover: string;
      textColor: string;
      fontWeight: string;
    };
    secondary: {
      text: string;
      bg: string;
      hover: string;
      textColor: string;
    };
    whatsapp: {
      text: string;
      bg: string;
      hover: string;
      textColor: string;
      fontWeight: string;
    };
  };
  sliderOptions: {
    loop: boolean;
    dots: boolean;
    autoplay: boolean;
    autoplayDelay: number;
    slidesToShow: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
    gap: number;
    dragFree: boolean;
    colors: {
      dotActive: string;
      dotInactive: string;
      arrows: string;
      arrowsHover: string;
    };
  };
  faq: {
    card: {
      backgroundColor: string;
      textColor: string;
      questionColor: string;
      answerColor: string;
    };
    arrow: {
      backgroundColor: string;
      iconColor: string;
    };
  };
  buttonStyles: {
    primary: {
      base: string;
      hover: string;
      border: string;
      borderHover: string;
      rounded: string;
      padding: string;
      fontSize: string;
      transition: string;
      shadow: string;
    };
    secondary: {
      base: string;
      hover: string;
      border: string;
      borderHover: string;
      rounded: string;
      padding: string;
      fontSize: string;
      transition: string;
      shadow: string;
    };
    tab: {
      regular: {
        normal: {
          backgroundColor: string;
          textColor: string;
          borderColor: string;
        };
        hover: {
          backgroundColor: string;
          textColor: string;
          borderColor: string;
        };
      };
      inverted: {
        normal: {
          backgroundColor: string;
          textColor: string;
          borderColor: string;
        };
        hover: {
          backgroundColor: string;
          textColor: string;
          borderColor: string;
        };
      };
      container: {
        backgroundColor: string;
      };
    };
  };
  sections: Record<string, SectionConfig>;
  logos: {
    main: {
      height: string;
      heightMd: string;
      heightLg: string;
      width: string;
      objectFit: string;
    };
    inverted: {
      height: string;
      heightMd: string;
      heightLg: string;
      width: string;
      objectFit: string;
    };
  };
  navigation: {
    menuOverlay: {
      backgroundColor: string;
      linkColor: string;
      linkHoverColor: string;
    };
    hamburger: {
      barColor: string;
      barThickness: string;
      barWidth: string;
      buttonBackground: string;
      buttonBackdrop: string;
    };
  };
  socialIcons: {
    container: {
      base: string;
      gap: string;
      spacing: string;
    };
    icon: {
      base: string;
      hover: string;
      border: string;
      backdrop: string;
      transition: string;
      size: string;
    };
  };
}

interface SiteConfig {
  name: string;
  tagline: string;
  fullTitle: string;
  description: string;
  keywords: string;
  sections: {
    hero: {
      title: string;
      subtitle: string;
      description: string;
      ctaButton: string;
      secondaryCta: string;
      services: {
        curadoria: {
          title: string;
          description: string;
        };
        planeamento: {
          title: string;
          description: string;
        };
        suporte: {
          title: string;
          description: string;
        };
      };
    };
    packages: {
      title: string;
      description: string;
    };
    whyTravel: {
      title: string;
      subtitle: string;
      features: Array<{
        title: string;
        description: string;
      }>;
    };
    testimonials: {
      title: string;
      subtitle: string;
      items: Array<{
        id: number;
        name: string;
        location: string;
        text: string;
        needsPhotoUpdate: boolean;
      }>;
    };
    about: {
      title: string;
      subtitle: string;
      bio: string;
      needsMorePhotos: boolean;
    };
    partner: {
      title: string;
      description: string;
      noChanges: boolean;
    };
    contact: {
      title: string;
      description: string;
      cta: {
        quickChat: string;
        detailedRequest: string;
      };
    };
  };
}

interface AgentConfig {
  firstName: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  consultationFormUrl: string;
  twitterHandle: string;
  instagramHandle: string;
  facebookHandle: string;
  linkedinHandle: string;
  heroImageUrl: string;
  rnavt: string;
  ownerCardDesign: string;
}

interface DesignContextType {
  design: DesignConfig;
  loading: boolean;
  error: string | null;
  validateDesign: <T extends z.ZodSchema>(data: unknown, schema: T) => z.infer<T> | null;
  refreshDesign: () => Promise<void>;
  setSiteId: (id: string) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

interface DesignProviderProps {
  children: ReactNode;
  defaultSiteId?: string;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ 
  children, 
  defaultSiteId = 'hugo-ramos-nomadwise' 
}) => {
  const [design, setDesign] = useState<DesignConfig>(defaultDesign as unknown as DesignConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteId, setSiteId] = useState(defaultSiteId);

  const loadDesignConfig = async (currentSiteId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Load from local json-server via adapter
      console.log('🔄 Fetching design from local JSON DB via adapter...');
      const data = await fetchDesignFromLocalDB('/design-api');
      setDesign(data as unknown as DesignConfig);
      console.log('✅ Design config loaded from local JSON DB');

    } catch (err) {
      console.error('[DesignContext] Error loading design config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load design config');
      // Fallback to default local JSON
      setDesign(defaultDesign as unknown as DesignConfig);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesign = async () => {
    await loadDesignConfig(siteId);
  };

  useEffect(() => {
    loadDesignConfig(siteId);
  }, [siteId]);

  const validateDesign = <T extends z.ZodSchema>(data: unknown, schema: T): z.infer<T> | null => {
    return validateData(data, schema, 'Design');
  };

  const value: DesignContextType = {
    design,
    loading,
    error,
    validateDesign,
    refreshDesign: fetchDesign,
    setSiteId,
  };

  return (
    <DesignContext.Provider value={value}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesign = (): DesignContextType => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
};
