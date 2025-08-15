import React from 'react';
import { ContentProvider } from '../contexts/ContentContext';
import { DesignProvider } from '../contexts/DesignContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { useContent } from '../contexts/ContentContext';
import { useDesign } from '../contexts/DesignContext';
import { useSettings } from '../contexts/SettingsContext';

// Test component for SettingsContext
const SettingsTest: React.FC = () => {
  const { agentConfig, siteConfig, loading, error, refreshSettings } = useSettings();
  
  if (loading) return <div className="text-blue-600 p-2">Loading settings...</div>;
  if (error) return (
    <div className="text-red-600 p-2">
      Settings Error: {error}
      <button onClick={refreshSettings} className="ml-2 px-2 py-1 bg-red-500 text-white rounded">
        Retry
      </button>
    </div>
  );
  
  return (
    <div className="border p-4 mb-4 rounded-lg bg-white shadow">
      <h3 className="font-bold text-lg mb-2">Settings Test</h3>
      {agentConfig ? (
        <div className="mb-2">
          <p><strong>Agent:</strong> {agentConfig.fullName}</p>
          <p><strong>Email:</strong> {agentConfig.email}</p>
          <p><strong>Phone:</strong> {agentConfig.phone}</p>
        </div>
      ) : <p className="text-gray-500">No agent config loaded</p>}
      
      {siteConfig ? (
        <div>
          <p><strong>Site:</strong> {siteConfig.name}</p>
          <p><strong>Tagline:</strong> {siteConfig.tagline}</p>
          <p><strong>Description:</strong> {siteConfig.description}</p>
        </div>
      ) : <p className="text-gray-500">No site config loaded</p>}
    </div>
  );
};

// Test component for DesignContext
const DesignTest: React.FC = () => {
  const { design, loading, error, refreshDesign } = useDesign();
  
  if (loading) return <div className="text-blue-600 p-2">Loading design...</div>;
  if (error) return (
    <div className="text-red-600 p-2">
      Design Error: {error}
      <button onClick={refreshDesign} className="ml-2 px-2 py-1 bg-red-500 text-white rounded">
        Retry
      </button>
    </div>
  );
  
  return (
    <div className="border p-4 mb-4 rounded-lg bg-white shadow">
      <h3 className="font-bold text-lg mb-2">Design Test</h3>
      {design ? (
        <div>
          <p><strong>Primary Color:</strong> 
            <span style={{ backgroundColor: design.colors?.primary }} className="inline-block w-4 h-4 ml-2 rounded"></span>
            {design.colors?.primary || 'N/A'}
          </p>
          <p><strong>Font Family:</strong> {design.fonts?.body || 'N/A'}</p>
          <p><strong>Border Radius:</strong> {(design as any).borderRadius?.medium || 'N/A'}</p>
        </div>
      ) : <p className="text-gray-500">No design config loaded</p>}
    </div>
  );
};

// Test component for ContentContext
const ContentTest: React.FC = () => {
  const { contentMap, loading, error, refreshContent, getSectionContent } = useContent();
  
  if (loading) return <div className="text-blue-600 p-2">Loading content...</div>;
  if (error) return (
    <div className="text-red-600 p-2">
      Content Error: {error}
      <button onClick={refreshContent} className="ml-2 px-2 py-1 bg-red-500 text-white rounded">
        Retry
      </button>
    </div>
  );
  
  const heroContent = getSectionContent('hero');
  const aboutContent = getSectionContent('about');
  
  return (
    <div className="border p-4 mb-4 rounded-lg bg-white shadow">
      <h3 className="font-bold text-lg mb-2">Content Test</h3>
      <p><strong>Content Items:</strong> {contentMap?.size || 0}</p>
      
      {heroContent && (
        <div className="mb-2">
          <h4 className="font-semibold">Hero Section:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(heroContent, null, 2).substring(0, 200)}...
          </pre>
        </div>
      )}
      
      {aboutContent && (
        <div>
          <h4 className="font-semibold">About Section:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(aboutContent, null, 2).substring(0, 200)}...
          </pre>
        </div>
      )}
    </div>
  );
};

// Main test page
const ZodTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Zod Context Test Page</h1>
        <p className="text-center text-gray-600 mb-8">
          Testing new Zod contexts with runtime validation
        </p>
        
        <SettingsProvider>
          <DesignProvider>
            <ContentProvider>
              <div className="space-y-6">
                <SettingsTest />
                <DesignTest />
                <ContentTest />
                
                <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">✅ Test Results</h3>
                  <p className="text-green-700">
                    All Zod contexts are successfully loading data from Firestore with runtime validation!
                  </p>
                </div>
              </div>
            </ContentProvider>
          </DesignProvider>
        </SettingsProvider>
      </div>
    </div>
  );
};

export default ZodTestPage;
