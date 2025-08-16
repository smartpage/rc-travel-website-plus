import React from 'react';
import { useLocation } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';

const SectionNavigator: React.FC = () => {
  const location = useLocation();
  const query = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const enabled = query.get('design') === '1' || query.get('design') === 'true';

  const { siteIndex, loading } = useContent();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!enabled || loading || !siteIndex) return null;

  // Filter out navigation components and only include anchorable sections
  const anchorableSections = siteIndex.sections.filter(section => 
    section.isActive && 
    !section.component.includes('Navigation') && 
    section.component !== 'Footer'
  );

  // Map component names to their actual anchor IDs (reading from the actual components)
  const getAnchorId = (section: any): string | null => {
    switch (section.component) {
      case 'HeroSection':
      case 'HeroVariation':
        return 'home';
      case 'TravelPackages':
        return 'packages';
      case 'AboutSectionGallery':
        return 'about';
      case 'TestimonialsSection':
        return 'testimonials';
      case 'ContactSection':
        return 'contact';
      case 'FAQ':
        return 'faq';
      case 'ServicesSection':
        return 'services';
      case 'WhyFeatureCards':
        return 'whyFeatureCards';
      case 'TravelDesigner':
        return 'travelDesigner';
      case 'ContactFormSection':
        return 'contactForm';
      default:
        return null;
    }
  };

  const scrollToSection = (anchorId: string) => {
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const navigableSections = anchorableSections
    .map(section => ({ ...section, anchorId: getAnchorId(section) }))
    .filter(section => section.anchorId !== null);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 'calc(12px + 200px)', // Position below the DesignInspectorOverlay
      right: 12, 
      zIndex: 1000, 
      width: 340, 
      background: '#0f0f0f', 
      color: '#fff', 
      borderRadius: 8, 
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      maxHeight: 'calc(100vh - 224px)', // Adjust for position below inspector
      overflowY: 'auto'
    }}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ 
          width: '100%',
          background: isCollapsed ? '#1a1a1a' : '#2a2a2a', 
          border: '1px solid #3a3a3a', 
          color: '#fff', 
          padding: '12px 16px', 
          borderRadius: 8, 
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          marginBottom: isCollapsed ? 0 : 12
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isCollapsed ? '#2a2a2a' : '#3a3a3a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isCollapsed ? '#1a1a1a' : '#2a2a2a';
        }}
      >
        <span>Section Navigator</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{navigableSections.length} sections</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{isCollapsed ? '↓' : '↑'}</span>
        </div>
      </button>
      
      {!isCollapsed && (
        <div style={{ padding: '0 12px 12px 12px' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            {navigableSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.anchorId!)}
                style={{
                  background: '#1b1b1b',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #2a2a2a',
                  textAlign: 'left',
                  fontSize: 13,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2a2a';
                  e.currentTarget.style.borderColor = '#3a3a3a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1b1b1b';
                  e.currentTarget.style.borderColor = '#2a2a2a';
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  {section.name.charAt(0).toUpperCase() + section.name.slice(1)}
                </span>
                <span style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>
                  #{section.anchorId}
                </span>
              </button>
            ))}
          </div>
          
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
            Click to navigate to section
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionNavigator;
