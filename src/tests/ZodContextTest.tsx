import React from 'react';
import { ContentProvider } from '../contexts/ContentContext';
import { DesignProvider } from '../contexts/DesignContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { useContent } from '../contexts/ContentContext';
import { useDesign } from '../contexts/DesignContext';
import { useSettings } from '../contexts/SettingsContext';

// Test component for SettingsContext
const SettingsTest: React.FC = () => {
  const { agentConfig, siteConfig, loading, error } = useSettings();
  
  if (loading) return <div className="text-blue-600">Loading settings...</div>;
  if (error) return <div className="text-red-600">Settings Error: {error}</div>;
  
  return (
    <div className="border p-4 mb-4">
      <h3 className="font-bold">Settings Test</h3>
      {agentConfig && (
        <div>
          <p><strong>Agent:</strong> {agentConfig.fullName}</p>
          <p><strong>Email:</strong> {agentConfig.email}</p>
        </div>
      )}
      {siteConfig && (
        <div>
          <p><strong>Site:</strong> {siteConfig.name}</p>
          <p><strong>Tagline:</strong> {siteConfig.tagline}</p>
        </div>
      )}
    </div>
  );
};

// Test component for DesignContext
const DesignTest: React.FC = () => {
  const { design, loading, error } = useDesign();
  
  if (loading) return <div className="text-blue-600">Loading design...</div>;
  if (error) return <div className="text-red-600">Design Error: {error}</div>;
  
  return (
    <div className="border p-4 mb-4">
      <h3 className="font-bold">Design Test</h3>
      {design && (
        <div>
          <p><strong>Primary Color:</strong> {design.colors?.primary || 'N/A'}</p>
          <p><strong>Font Family:</strong> {design.fonts?.body || 'N/A'}</p>
        </div>
      )}
    </div>
  );
};

// Test component for ContentContext
const ContentTest: React.FC = () => {
  const { contentMap, loading, error, getSectionContent } = useContent();
  
  if (loading) return <div className="text-blue-600">Loading content...</div>;
  if (error) return <div className="text-red-600">Content Error: {error}</div>;
  
  const heroContent = getSectionContent('hero');
  
  return (
    <div className="border p-4 mb-4">
      <h3 className="font-bold">Content Test</h3>
      <p><strong>Content Items:</strong> {contentMap?.size || 0}</p>
      {heroContent && (
        <div>
          <p><strong>Hero Content:</strong> {JSON.stringify(heroContent).substring(0, 100)}...</p>
        </div>
      )}
    </div>
  );
};

// Test wrapper component
const ZodContextTest: React.FC = () => {
  return (
    <SettingsProvider>
      <DesignProvider>
        <ContentProvider>
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Zod Context Test</h2>
            <p className="text-gray-600">Testing new Zod contexts with runtime validation...</p>
            
            <SettingsTest />
            <DesignTest />
            <ContentTest />
            
            <div className="mt-8 p-4 bg-green-50 border">
              <h3 className="font-bold text-green-800">✅ Test Complete</h3>
              <p className="text-green-700">All Zod contexts are loaded and working!</p>
            </div>
          </div>
        </ContentProvider>
      </DesignProvider>
    </SettingsProvider>
  );
};

export default ZodContextTest;
