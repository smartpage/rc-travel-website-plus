import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { z } from 'zod';
import { SITE_ID, ORG_ID, API_BASE_URL } from '../../db_connect';
import { validateData } from '@/schemas/contextSchemas';

// Remove hard local siteIndex import; API is the source of truth
const localSiteIndex = undefined as unknown as any;

// --- Types ---
type InternalComponent = {
  type: string;
  name: string;
  contentFile: string;
  showTabsNavigation: boolean;
  cardType?: 'travel' | 'testimonial' | 'portfolio' | 'blog';
  useSlider?: boolean;
  gridLayout?: string;
};

type SiteIndex = {
  sections: Array<{ 
    id: string; 
    name: string; 
    component: string;
    isActive: boolean;
    internalComponents?: InternalComponent[];
  }>;
};

interface ContentContextType {
  contentMap: Map<string, any>;
  siteIndex: SiteIndex | null;
  loading: boolean;
  error: string | null;
  getSectionContent: <T>(sectionName: string) => T | null;
  getContentForComponent: <T>(componentName: string) => T | null;
  validateContent: <T extends z.ZodSchema>(data: unknown, schema: T) => z.infer<T> | null;
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

// --- Dynamic Content Loading ---
const loadContentSection = async (sectionName: string): Promise<any> => {
  try {
    // Dynamic import based on section name
    const contentModule = await import(`@/data/${sectionName}Content.json`);
    return contentModule.default;
  } catch (error) {
    console.warn(`Failed to load content for section: ${sectionName}`, error);
    return null;
  }
};

// Local manifest removed to enforce API-only loading

// --- Provider ---
export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contentMap, setContentMap] = useState<Map<string, any>>(new Map());
  const [siteIndex, setSiteIndex] = useState<SiteIndex | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use proxy in development, direct URL in production
      const isDev = import.meta.env.DEV;
      const API_URL = isDev 
        ? `/api/organizations/${ORG_ID}/sites/${SITE_ID}/content` // Development: use proxy
        : `${API_BASE_URL}/organizations/${ORG_ID}/sites/${SITE_ID}/content`; // Production: direct URL
      
      console.log('🔄 Fetching content from Firebase API...', { isDev, API_URL });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Endpoint não encontrado (404). Verifique se o servidor da API está configurado corretamente.`);
        } else if (response.status >= 500) {
          throw new Error(`Erro no servidor da API (${response.status}). Por favor, tente novamente mais tarde.`);
        } else {
          throw new Error(`Falha no pedido à API com código ${response.status}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.success || !data.content) {
        console.warn('⚠️ API response did not contain expected data structure:', data);
        throw new Error('A resposta da API não contém os dados esperados.');
      }

      const remoteContent = data.content;
      const remoteSiteIndex = remoteContent.siteIndex as SiteIndex;

      const newContentMap = new Map<string, any>();
      newContentMap.set('siteIndex', remoteSiteIndex);
      
      for (const [key, value] of Object.entries(remoteContent)) {
        if (key !== 'siteIndex') { 
          newContentMap.set(key, value);
          console.log(`✅ Loaded content: ${key}`);
        }
      }

      setSiteIndex(remoteSiteIndex);
      setContentMap(newContentMap);
      setError(null);
      console.log('✅ Content successfully loaded from Firebase API.');

    } catch (err) {
      console.error('❌ Firebase fetch failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao tentar carregar o conteúdo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const buildComponentToSectionMap = (siteIndex: SiteIndex): Map<string, string> => {
    const map = new Map<string, string>();
    siteIndex.sections.forEach(section => {
      if (section.isActive) {
        map.set(section.component, section.name);
      }
    });
    return map;
  };

  const componentToSectionMap = useMemo(
    () => siteIndex ? buildComponentToSectionMap(siteIndex) : new Map(),
    [siteIndex]
  );

  const validateContent = <T extends z.ZodSchema>(data: unknown, schema: T): z.infer<T> | null => {
    return validateData(data, schema, 'Content');
  };

  const value: ContentContextType = {
    contentMap,
    siteIndex,
    loading,
    error,
    getSectionContent: <T,>(sectionName: string): T | null => {
      return (contentMap.get(sectionName) as T) || null;
    },
    getContentForComponent: <T,>(componentName: string): T | null => {
      const sectionName = componentToSectionMap.get(componentName);
      if (!sectionName) {
        console.warn(`No section mapping found for component: ${componentName}`);
        return null;
      }
      
      return (contentMap.get(sectionName) as T) || null;
    },
    validateContent,
    refreshContent: async () => {
      console.log('🔄 Refreshing content...');
      await fetchContent();
    },
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

// --- Hook ---
export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};


