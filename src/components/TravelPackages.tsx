import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import SectionTitle from '@/components/ui/SectionTitle';
import Section from '@/components/ui/Section';
import TabGrid from './TabGrid';



const TravelPackages = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, siteIndex, loading, error } = useContent();
  const travelPackages = getContentForComponent<any>('TravelPackages');

  const handleWhatsAppContact = (packageName: string) => {
    if (!agentConfig) {
      console.warn('AgentConfig not loaded yet');
      return;
    }
    if (!travelPackages?.contactMessageTemplate) return;
    const message = travelPackages.contactMessageTemplate.replace('{agentFirstName}', agentConfig.firstName).replace('{packageName}', packageName);
    const whatsappUrl = `https://wa.me/${agentConfig.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Get siteIndex section for TravelPackages to access internalComponents
  const travelPackagesSection = siteIndex?.sections.find(section => section.component === 'TravelPackages');
  
  console.log('🎯 TravelPackages DEBUG:');
  console.log('  - loading:', loading);
  console.log('  - error:', error);
  console.log('  - travelPackages content:', travelPackages);
  console.log('  - siteIndex:', siteIndex);
  console.log('  - siteIndex.sections:', siteIndex?.sections);
  console.log('  - travelPackagesSection:', travelPackagesSection);
  console.log('  - internalComponents:', travelPackagesSection?.internalComponents);
  
  if (!travelPackagesSection) {
    console.error('❌ TravelPackages: travelPackagesSection not found in siteIndex!');
  }
  
  if (!travelPackagesSection?.internalComponents) {
    console.error('❌ TravelPackages: internalComponents missing from travelPackagesSection!');
  }

  if (loading || !travelPackages) {
    return (
      <Section sectionId="travelPackages" id="packages">
        <div className="text-center mb-16">
          <Skeleton height={48} width={400} className="mx-auto mb-4" />
          <Skeleton height={20} width={600} className="mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <Skeleton height={200} className="rounded-none" />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton height={24} width={200} />
                  <Skeleton height={20} width={80} />
                </div>
                
                <Skeleton height={16} count={3} className="mb-4" />
                
                <div className="flex items-center justify-between mb-4">
                  <Skeleton height={20} width={120} />
                  <Skeleton height={20} width={60} />
                </div>
                
                <div className="flex flex-col gap-2 mb-6">
                  <Skeleton height={16} width="100%" />
                  <Skeleton height={16} width="90%" />
                  <Skeleton height={16} width="80%" />
                </div>
                
                <Skeleton height={40} width="100%" className="rounded" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section sectionId="travelPackages" id="packages">
        <div className="text-center py-20">
          <p className="text-lg text-red-600">Erro ao carregar pacotes: {error}</p>
        </div>
      </Section>
    );
  }

  if (!travelPackages) {
    return null; // Content is not available for this section
  }

  return (
    <Section sectionId="travelPackages" id="packages">
      <SectionTitle 
        subtitle={travelPackages.preTitle}
        title={travelPackages.title}
        description={travelPackages.description}
        centerAlign={true}
      />

      {travelPackagesSection?.internalComponents?.map((component, index) => {
        if (component.type === 'TabGrid') {
          return (
            <TabGrid
              key={`${component.name}-${index}`}
              contentFile={component.contentFile}
              showTabsNavigation={component.showTabsNavigation}
              gridLayout={component.gridLayout}
              useSlider={false}
              ctaText={travelPackages.ctaText}
              moreDetailsText={travelPackages.moreDetailsText}
              onWhatsAppContact={handleWhatsAppContact}
            />
          );
        }
        return null;
      })}
    </Section>
  );
};

export default TravelPackages;
