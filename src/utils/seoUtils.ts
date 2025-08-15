/**
 * SEO Utilities
 * Generate SEO metadata from SettingsContext data
 */

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

export interface SEOMetadata {
  // Basic site info
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  
  // Agent information
  agent: {
    fullName: string;
    email: string;
    phone: string;
    whatsapp: string;
    twitterHandle: string;
  };
  
  // SEO data
  seo: {
    title: string;
    description: string;
    keywords: string;
    author: string;
  };
  
  // Social media metadata
  social: {
    ogTitle: string;
    ogDescription: string;
    ogSiteName: string;
    twitterCard: string;
    twitterSite: string;
  };
  
  // Structured data for local business
  structuredData: object;
  
  // Cache info
  lastUpdated: string;
}

export function generateSEOMetadata(
  agentConfig: AgentConfig | null,
  siteConfig: SiteConfig | null
): SEOMetadata | null {
  if (!agentConfig || !siteConfig) {
    return null;
  }

  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  return {
    // Basic site info
    siteName: `${agentConfig.fullName} Travel Designer`,
    siteTitle: `${agentConfig.fullName} Travel Designer`,
    siteDescription: `${agentConfig.fullName} Travel Agent - ${siteConfig.tagline || siteConfig.description}`,
    siteUrl,
    
    // Agent information
    agent: {
      fullName: agentConfig.fullName,
      email: agentConfig.email,
      phone: agentConfig.phone,
      whatsapp: agentConfig.whatsapp,
      twitterHandle: agentConfig.twitterHandle
    },
    
    // SEO data
    seo: {
      title: siteConfig.fullTitle || `${agentConfig.fullName} Travel Designer`,
      description: siteConfig.description,
      keywords: siteConfig.keywords || 'travel, vacation, packages, agent, tourism',
      author: agentConfig.fullName
    },
    
    // Social media metadata
    social: {
      ogTitle: `${agentConfig.fullName} Travel Designer`,
      ogDescription: `${agentConfig.fullName} Travel Agent - ${siteConfig.tagline || siteConfig.description}`,
      ogSiteName: `${agentConfig.fullName} Travel`,
      twitterCard: 'summary_large_image',
      twitterSite: agentConfig.twitterHandle
    },
    
    // Structured data for local business
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      "name": `${agentConfig.fullName} Travel`,
      "description": `${agentConfig.fullName} Travel Agent - ${siteConfig.tagline || siteConfig.description}`,
      "url": siteUrl,
      "telephone": agentConfig.phone,
      "email": agentConfig.email,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": agentConfig.phone,
        "contactType": "customer service",
        "availableLanguage": ["Portuguese", "English"]
      }
    },
    
    // Cache info
    lastUpdated: new Date().toISOString()
  };
}
