import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { z } from 'zod';
import { SITE_ID, ORG_ID, API_BASE_URL } from '../../db_connect';
import { validateData } from '@/schemas/contextSchemas';

// --- Types ---
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

interface SiteConfig {
  name: string;
  tagline: string;
  fullTitle: string;
  description: string;
  keywords: string;
  logoUrl: string;
}

interface SettingsConfig {
  agentConfig: AgentConfig;
  siteConfig: SiteConfig;
}

interface SettingsContextType {
  agentConfig: AgentConfig | null;
  siteConfig: SiteConfig | null;
  loading: boolean;
  error: string | null;
  validateSettings: <T extends z.ZodSchema>(data: unknown, schema: T) => z.infer<T> | null;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// --- Provider ---
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use proxy in development, direct URL in production
      const isDev = import.meta.env.DEV;
      const API_URL = isDev
        ? `/api/organizations/${ORG_ID}/sites/${SITE_ID}/settings` // Development: use proxy
        : `${API_BASE_URL}/organizations/${ORG_ID}/sites/${SITE_ID}/settings`; // Production: direct URL

      console.log(' Fetching settings from Firebase API...', { isDev, API_URL });
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
        console.warn(`[SettingsContext] API respondeu ${response.status}. A usar fallback local.`);
        // Local fallback for development without API
        setAgentConfig({
          firstName: "Ricardo",
          fullName: "Ricardo Cruz",
          email: "etapacrucial@gmail.com",
          phone: "+351 934 766 042",
          whatsapp: "+351934766042",
          consultationFormUrl: "https://etapacrucial.wixsite.com/rctours",
          twitterHandle: "",
          instagramHandle: "@rc.tours",
          facebookHandle: "/RicardoCruz919",
          linkedinHandle: "",
          heroImageUrl: "/ricardo_cruz_hero.jpg",
          rnavt: "RNAVT n.º 3301",
          ownerCardDesign: "original"
        });
        setSiteConfig({
          name: "RCTRAVEL",
          tagline: "by Ricardo Cruz",
          fullTitle: "RCTRAVEL by Ricardo Cruz",
          description: "Turismo personalizado com 25 anos de experiência. Itinerários únicos e memoráveis em Portugal e Espanha, criados por Ricardo Cruz com foco em autenticidade, conforto e conexão local.",
          keywords: "turismo personalizado, tours Portugal, transfers, Ricardo Cruz, RCTRAVEL, experiências autênticas, guias turísticos, Portugal e Espanha, itinerários personalizados, 25 anos experiência",
          logoUrl: "/branding/RICARDO_CRUZ_LOGO.png"
        });
        setError(null);
        return;
      }

      const data = await response.json();

      if (!data.success || !data.settings) {
        console.warn(' API response did not contain expected settings structure:', data);
        throw new Error('API response does not contain expected settings data.');
      }

      const settingsData = data.settings;

      // Define Zod schemas for validation
      const agentConfigSchema = z.object({
        firstName: z.string(),
        fullName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        whatsapp: z.string(),
        consultationFormUrl: z.string().url(),
        twitterHandle: z.string(),
        instagramHandle: z.string(),
        facebookHandle: z.string(),
        linkedinHandle: z.string(),
        heroImageUrl: z.string(),
        rnavt: z.string(),
        ownerCardDesign: z.string(),
      });

      const siteConfigSchema = z.object({
        name: z.string(),
        tagline: z.string(),
        fullTitle: z.string(),
        description: z.string(),
        keywords: z.string(),
        logoUrl: z.string(),
      });

      // Extract settings data
      const remoteAgentConfig = settingsData.agentConfig as AgentConfig;
      const remoteSiteConfig = settingsData.siteConfig as SiteConfig;

      setAgentConfig(remoteAgentConfig);
      setSiteConfig(remoteSiteConfig);
      console.log('✅ Loaded settings from API');

      setError(null);
      console.log('✅ Settings successfully loaded from Firebase API.');

    } catch (err) {
      console.warn('❌ Settings fetch failed, using local fallback:', err);
      setAgentConfig({
        firstName: "Ricardo",
        fullName: "Ricardo Cruz",
        email: "etapacrucial@gmail.com",
        phone: "+351 934 766 042",
        whatsapp: "+351934766042",
        consultationFormUrl: "https://etapacrucial.wixsite.com/rctours",
        twitterHandle: "",
        instagramHandle: "@rc.tours",
        facebookHandle: "/RicardoCruz919",
        linkedinHandle: "",
        heroImageUrl: "/ricardo_cruz_hero.jpg",
        rnavt: "RNAVT n.º 3301",
        ownerCardDesign: "original"
      });
      
      setSiteConfig({
        name: "RCTRAVEL",
        tagline: "by Ricardo Cruz",
        fullTitle: "RCTRAVEL by Ricardo Cruz",
        description: "Turismo personalizado com 25 anos de experiência. Itinerários únicos e memoráveis em Portugal e Espanha, criados por Ricardo Cruz com foco em autenticidade, conforto e conexão local.",
        keywords: "turismo personalizado, tours Portugal, transfers, Ricardo Cruz, RCTRAVEL, experiências autênticas, guias turísticos, Portugal e Espanha, itinerários personalizados, 25 anos experiência",
        logoUrl: "/branding/RICARDO_CRUZ_LOGO.png"
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const validateSettings = <T extends z.ZodSchema>(data: unknown, schema: T): z.infer<T> | null => {
    return validateData(data, schema, 'Settings');
  };

  const refreshSettings = async () => {
    console.log('🔄 Refreshing settings...');
    await fetchSettings();
  };

  const value: SettingsContextType = {
    agentConfig,
    siteConfig,
    loading,
    error,
    validateSettings,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// --- Hook ---
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
