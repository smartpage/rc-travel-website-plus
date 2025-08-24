import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { z } from 'zod';
import { SITE_ID, ORG_ID, API_BASE_URL } from '../../db_connect';
import { validateData } from '@/schemas/contextSchemas';

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
  saveDesignToDBV2: () => Promise<void>;
  // Templates
  applyTemplateById?: (templateId: string) => Promise<void>;
  // Smart save support
  isDirty?: boolean;
  saving?: boolean;
  lastSavedAt?: number | null;
  autoSave?: boolean;
  setAutoSave?: (v: boolean) => void;
  lastSaveOk?: boolean | null;
  lastSaveError?: string | null;
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
  const [design, setDesign] = useState<DesignV2>({} as DesignV2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteId, setSiteId] = useState(defaultSiteId);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try { return localStorage.getItem('design_auto_save') === '1'; } catch { return false; }
  });
  const [lastSaveOk, setLastSaveOk] = useState<boolean | null>(null);
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const savedSnapshotRef = useRef<string | null>(null);

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
        throw new Error(`Failed to load dbV2.json: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const next = (data?.designV2 || data) as DesignV2;
      setDesign(next);

    } catch (err) {
      console.error('[DesignContext] Error loading design config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load design config');
      // NO FALLBACK - let the app crash if dbV2.json doesn't load
      throw err;
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

  // Determine if design differs from last saved snapshot
  const computeIsDirty = useCallback((): boolean => {
    try {
      const current = JSON.stringify({ designV2: design });
      return current !== savedSnapshotRef.current;
    } catch {
      return true;
    }
  }, [design]);

  const saveDesignToDBV2 = async () => {
    try {
      setSaving(true);
      const designToSave = { designV2: design };
      const jsonString = JSON.stringify(designToSave, null, 2);
      
      // Call provisory local API server to handle file operations
      const response = await fetch('http://localhost:3001/api/save-dbv2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ designData: jsonString })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[DesignContext] designV2 saved with backup:', result);
      // Update baseline snapshot and timestamp
      try { savedSnapshotRef.current = JSON.stringify({ designV2: design }); } catch {}
      setLastSavedAt(Date.now());
      setLastSaveOk(true);
      setLastSaveError(null);
      
    } catch (e: any) {
      console.error('[DesignContext] saveDesignToDBV2 error:', e);
      setLastSaveOk(false);
      setLastSaveError(e?.message || 'Save failed');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // --- Templates: Apply remote template to local designV2 and persist ---
  const applyTemplateById = async (templateId: string) => {
    try {
      if (!templateId) throw new Error('Missing templateId');
      const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const TPL_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';
      const res = await fetch(`${TPL_API_BASE}/api/templates/get-template/${encodeURIComponent(templateId)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' } as any
      });
      if (!res.ok) throw new Error(`Failed to fetch template ${templateId} (HTTP ${res.status})`);
      const data = await res.json();
      const tpl = data?.template || data;
      const nextDesign = tpl?.designConfig?.designV2;
      if (!nextDesign) throw new Error('Template missing designConfig.designV2');

      setDesign(() => {
        let merged: DesignV2;
        try { merged = structuredClone(nextDesign); } catch { merged = JSON.parse(JSON.stringify(nextDesign)) as DesignV2; }
        const name = tpl?.name || String(templateId);
        const version = tpl?.version || undefined;
        const appliedAt = new Date().toISOString();
        const metaObj: any = (merged as any).meta || {};
        metaObj.template = { id: templateId, name, ...(version ? { version } : {}), appliedAt };
        (merged as any).meta = metaObj;
        return merged;
      });

      // Persist to dbV2.json via local provisory save endpoint
      await saveDesignToDBV2();
    } catch (err) {
      console.error('[DesignContext] applyTemplateById error:', err);
      throw err;
    }
  };

  // Initialize baseline snapshot when design first loads
  useEffect(() => {
    if (design && !savedSnapshotRef.current) {
      try { savedSnapshotRef.current = JSON.stringify({ designV2: design }); } catch {}
    }
  }, [design]);

  // Auto-save debounce
  useEffect(() => {
    if (!autoSave) return;
    const dirty = computeIsDirty();
    if (!dirty) return;
    const t = setTimeout(() => { saveDesignToDBV2().catch(() => {}); }, 1000);
    return () => clearTimeout(t);
  }, [autoSave, design, computeIsDirty]);

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
    saveDesignToDBV2,
    applyTemplateById,
    isDirty: computeIsDirty(),
    saving,
    lastSavedAt,
    autoSave,
    setAutoSave: (v: boolean) => {
      setAutoSave(v);
      try { localStorage.setItem('design_auto_save', v ? '1' : '0'); } catch {}
    },
    lastSaveOk,
    lastSaveError,
  };

  return (
    <DesignContext.Provider value={value}>
      {/* Smart contextual paragraph styling via design tokens (v2) */}
      <style>
        {design?.tokens?.typography && `
          /* Base paragraph styling scoped to site root */
          [data-site-root] p:not([data-typography]) {
            font-family: ${design.tokens.typography.body?.fontFamily || 'Inter, sans-serif'} !important;
            font-size: ${design.tokens.typography.body?.fontSize || '1rem'} !important;
            font-weight: ${design.tokens.typography.body?.fontWeight || '400'} !important;
            line-height: ${design.tokens.typography.body?.lineHeight || '1.75'} !important;
            color: ${design.tokens.typography.body?.color || 'white'};
          }
          
          /* Context-specific paragraph styling */
          [data-site-root] [data-section-id="hero"] p:not([data-typography]) {
            color: ${design.tokens.typography.body?.color || 'white'};
          }
          
          /* Card body text (lighter color) – apply full cardBody typography on light surfaces */
          [data-site-root] .bg-white p:not([data-typography]), [data-site-root] .bg-white\/80 p:not([data-typography]), [data-site-root] [class*="bg-white"] p:not([data-typography]) {
            font-family: ${design.tokens.typography.cardBody?.fontFamily || design.tokens.typography.body?.fontFamily || 'Inter, sans-serif'} !important;
            font-size: ${design.tokens.typography.cardBody?.fontSize || design.tokens.typography.body?.fontSize || '1rem'} !important;
            font-weight: ${design.tokens.typography.cardBody?.fontWeight || design.tokens.typography.body?.fontWeight || '400'} !important;
            line-height: ${design.tokens.typography.cardBody?.lineHeight || design.tokens.typography.body?.lineHeight || '1.75'} !important;
            color: ${design.tokens.typography.cardBody?.color || '#374151'} !important;
          }
          
          /* Dark background sections */
          [data-site-root] .bg-black p:not([data-typography]), [data-site-root] .bg-black\/80 p:not([data-typography]), [data-site-root] [class*="bg-black"] p:not([data-typography]) {
            color: ${design.tokens.typography.body?.color || 'white'};
          }
          
          /* Light background sections */
          [data-site-root] .bg-slate-100 p:not([data-typography]), [data-site-root] .bg-gray-100 p:not([data-typography]), [data-site-root] [class*="bg-slate-1"] p:not([data-typography]) {
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
