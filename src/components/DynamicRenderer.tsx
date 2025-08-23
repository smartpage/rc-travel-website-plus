import React, { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';

// Skeleton loader component
const SectionSkeleton = () => (
  <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg mb-8">
    <div className="p-8 space-y-4">
      <div className="h-8 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      <div className="h-10 bg-gray-300 rounded w-32"></div>
    </div>
  </div>
);

// Component to handle dynamic loading errors
const ErrorComponent = ({ componentName }: { componentName: string }) => (
  <div className="w-full max-w-7xl mx-auto px-4 py-8">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-600">
        Componente não encontrado: <code>{componentName}</code>
      </p>
    </div>
  </div>
);

// Cache for loaded components
const componentCache = new Map<string, React.ComponentType>();

const DynamicRenderer: React.FC = () => {
  const { siteIndex, loading, error } = useContent();

  console.log('DynamicRenderer - Loading:', loading);
  console.log('DynamicRenderer - Error:', error);
  console.log('DynamicRenderer - SiteIndex:', siteIndex);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {[...Array(5)].map((_, i) => (
            <SectionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading site content:', error);
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar conteúdo</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!siteIndex || !siteIndex.sections) {
    console.warn('No siteIndex available or no sections');
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Nenhum conteúdo disponível</h3>
          <p className="text-yellow-600">SiteIndex não encontrado ou sem secções</p>
        </div>
      </div>
    );
  }

  // Filter active sections and preserve original order from siteIndex
  const activeSections = siteIndex.sections.filter(section => section.isActive);
  
  console.log('Active sections:', activeSections.map(s => ({ name: s.name, component: s.component, active: s.isActive })));

  if (activeSections.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-800 font-semibold mb-2">Nenhuma secção ativa</h3>
          <p className="text-blue-600">Todas as secções estão desativadas no siteIndex</p>
        </div>
      </div>
    );
  }

  // State for loaded components
  const [loadedComponents, setLoadedComponents] = useState<Map<string, React.ComponentType>>(new Map());
  const [isLoadingComponents, setIsLoadingComponents] = useState(true);
  const [loadErrors, setLoadErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const loadComponents = async () => {
      if (!activeSections.length) return;

      setIsLoadingComponents(true);
      const newComponents = new Map<string, React.ComponentType>();
      const newErrors = new Map<string, string>();

      // Load all components in parallel
      const loadPromises = activeSections.map(async (section) => {
        // Skip if already cached
        if (componentCache.has(section.component)) {
          newComponents.set(section.component, componentCache.get(section.component)!);
          return;
        }

        try {
          const module = await import(`../components/${section.component}.tsx`);
          const Component = module.default;
          
          // Cache the component
          componentCache.set(section.component, Component);
          newComponents.set(section.component, Component);
        } catch (error) {
          console.error(`Failed to load component: ${section.component}`, error);
          newErrors.set(section.component, `Failed to load ${section.component}`);
        }
      });

      await Promise.all(loadPromises);
      
      setLoadedComponents(newComponents);
      setLoadErrors(newErrors);
      setIsLoadingComponents(false);
    };

    loadComponents();
  }, [activeSections.map(s => s.component).join(',')]); // Only re-run if component list changes

  if (isLoadingComponents) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {[...Array(activeSections.length)].map((_, i) => (
            <SectionSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-site-root>
      {activeSections.map((section) => {
        const Component = loadedComponents.get(section.component);
        const error = loadErrors.get(section.component);

        if (error) {
          return <ErrorComponent key={section.id} componentName={section.component} />;
        }

        if (!Component) {
          return <ErrorComponent key={section.id} componentName={section.component} />;
        }

        return <Component key={section.id} />;
      })}
    </div>
  );
};

export default DynamicRenderer;
