import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { z } from 'zod';
import { SITE_ID, ORG_ID, API_BASE_URL } from '../../db_connect';
import { validateData } from '@/schemas/contextSchemas';
import defaultDesign from '@/design-default.json';
import dbV2File from '../../dbV2.json';

// Types (v2)

// New Section Styling Configuration Types (kept for section layout editing)
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
  width?: string;
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
  margin?: string;
  overflow?: string;
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

// Minimal v2 design structure used by the app
export interface DesignV2 {
  tokens?: {
    colors?: Record<string, any>;
    typography?: Record<string, any>;
    [key: string]: any;
  };
  components?: Record<string, any>;
  sections: Record<string, SectionConfig>;
  classes?: Record<string, any>;
  bindings?: Record<string, any>;
  index?: Record<string, any>;
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
  design: DesignV2;
  loading: boolean;
  error: string | null;
  validateDesign: <T extends z.ZodSchema>(data: unknown, schema: T) => z.infer<T> | null;
  refreshDesign: () => Promise<void>;
  setSiteId: (id: string) => void;
  updateDesignLocal: (updater: (prev: DesignV2) => DesignV2) => void;
  saveDesignToAPI: () => Promise<void>;
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
  const [design, setDesign] = useState<DesignV2>((dbV2File as any)?.designV2 || (defaultDesign as unknown as DesignV2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteId, setSiteId] = useState(defaultSiteId);

  const loadDesignConfig = async (currentSiteId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Prefer dbV2.json (v2-only source)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`/dbV2.json?t=${Date.now()}`, { signal: controller.signal, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } as any, cache: 'no-store' as RequestCache });
      clearTimeout(timeout);

      if (!response.ok) {
        // Fallback to bundled file
        setDesign(((dbV2File as any)?.designV2 || (dbV2File as any)) as DesignV2);
        return;
      }

      const data = await response.json();
      const next = (data?.designV2 || data) as DesignV2;
      setDesign(next);

    } catch (err) {
      console.error('[DesignContext] Error loading design config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load design config');
      // Fallback to bundled v2 JSON for preview only
      setDesign(((dbV2File as any)?.designV2 || (dbV2File as any)) as DesignV2);
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

  const saveDesignToAPI = async () => {
    // TODO: Implement v2 persistence endpoint. For now, no-op to avoid corrupting v1 store.
    console.warn('[DesignContext] saveDesignToAPI (v2) is not implemented yet. Skipping persistence.');
  };

  const value: DesignContextType = {
    design,
    loading,
    error,
    validateDesign,
    refreshDesign: fetchDesign,
    setSiteId,
    updateDesignLocal: (updater) => {
      setDesign((prev) => {
        try {
          return updater(structuredClone(prev));
        } catch {
          return updater(JSON.parse(JSON.stringify(prev)) as DesignV2);
        }
      });
    },
    saveDesignToAPI,
  };

  return (
    <DesignContext.Provider value={value}>
      {/* Smart contextual paragraph styling via design tokens (v2) */}
      <style>
        {design?.tokens?.typography && `
          /* Base paragraph styling (exclude explicitly labeled typography nodes) */
          p:not([data-typography]) {
            font-family: ${design.tokens.typography.body?.fontFamily || 'Inter, sans-serif'} !important;
            font-size: ${design.tokens.typography.body?.fontSize || '1rem'} !important;
            font-weight: ${design.tokens.typography.body?.fontWeight || '400'} !important;
            line-height: ${design.tokens.typography.body?.lineHeight || '1.75'} !important;
            color: ${design.tokens.typography.body?.color || 'white'};
          }
          
          /* Context-specific paragraph styling */
          [data-section-id="hero"] p:not([data-typography]) {
            color: ${design.tokens.typography.body?.color || 'white'};
          }
          
          /* Card body text (lighter color) – apply full cardBody typography on light surfaces */
          .bg-white p:not([data-typography]), .bg-white\/80 p:not([data-typography]), [class*="bg-white"] p:not([data-typography]) {
            font-family: ${design.tokens.typography.cardBody?.fontFamily || design.tokens.typography.body?.fontFamily || 'Inter, sans-serif'} !important;
            font-size: ${design.tokens.typography.cardBody?.fontSize || design.tokens.typography.body?.fontSize || '1rem'} !important;
            font-weight: ${design.tokens.typography.cardBody?.fontWeight || design.tokens.typography.body?.fontWeight || '400'} !important;
            line-height: ${design.tokens.typography.cardBody?.lineHeight || design.tokens.typography.body?.lineHeight || '1.75'} !important;
            color: ${design.tokens.typography.cardBody?.color || '#374151'} !important;
          }
          
          /* Dark background sections */
          .bg-black p:not([data-typography]), .bg-black\/80 p:not([data-typography]), [class*="bg-black"] p:not([data-typography]) {
            color: ${design.tokens.typography.body?.color || 'white'};
          }
          
          /* Light background sections */
          .bg-slate-100 p:not([data-typography]), .bg-gray-100 p:not([data-typography]), [class*="bg-slate-1"] p:not([data-typography]) {
            color: ${design.tokens.typography.cardBody?.color || '#374151'};
          }
        `}
      </style>
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
