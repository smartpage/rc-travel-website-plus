import React from 'react';
import { Helmet } from 'react-helmet';
import { useSettings } from '@/contexts/SettingsContext';

const SiteMetadata: React.FC = () => {
  const { agentConfig, siteConfig } = useSettings();

  // Don't render helmet until we have the data
  if (!agentConfig || !siteConfig) {
    return null;
  }

  const siteTitle = siteConfig.fullTitle || `${siteConfig.name} ${siteConfig.tagline}`;
  const siteDescription = siteConfig.description || `${agentConfig.fullName} Travel Agent - ${siteConfig.tagline}`;
  const siteKeywords = Array.isArray(siteConfig.keywords) 
    ? siteConfig.keywords.join(', ') 
    : siteConfig.keywords || 'travel, vacation, packages, agent, tourism';

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />
      <meta name="author" content={agentConfig.fullName} />
      
      {/* Open Graph meta tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:site_name" content={siteConfig.name} />
      
      {/* Twitter meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      {agentConfig.twitterHandle && (
        <meta name="twitter:site" content={agentConfig.twitterHandle} />
      )}
      
      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Structured data for local business */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": siteConfig.name,
          "description": siteDescription,
          "url": typeof window !== 'undefined' ? window.location.origin : '',
          "telephone": agentConfig.phone,
          "email": agentConfig.email,
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": agentConfig.phone,
            "contactType": "customer service",
            "availableLanguage": ["Portuguese", "English"]
          }
        })}
      </script>
    </Helmet>
  );
};

export default SiteMetadata;
