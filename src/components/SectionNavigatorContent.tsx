import React from 'react';
import { useLocation } from 'react-router-dom';
import { useContent } from '@/contexts/ContentContext';

const SectionNavigatorContent: React.FC = () => {
  const location = useLocation();
  const query = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const enabled = query.get('design') === '1' || query.get('design') === 'true';

  const { siteIndex, loading } = useContent();

  if (!enabled || loading || !siteIndex) return null;

  const anchorableSections = siteIndex.sections.filter((section: any) =>
    section.isActive && !section.component.includes('Navigation') && section.component !== 'Footer'
  );

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
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigableSections = anchorableSections
    .map((section: any) => ({ ...section, anchorId: getAnchorId(section) }))
    .filter((section: any) => section.anchorId !== null);

  return (
    <>
      <div style={{ display: 'grid', gap: 6 }}>
        {navigableSections.map((section: any) => (
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
              (e.currentTarget as HTMLButtonElement).style.background = '#2a2a2a';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3a3a3a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#1b1b1b';
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a';
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {section.name.charAt(0).toUpperCase() + section.name.slice(1)}
            </span>
            <span style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>#{section.anchorId}</span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>Click to navigate to section</div>
    </>
  );
};

export default SectionNavigatorContent;


