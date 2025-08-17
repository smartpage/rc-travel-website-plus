import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Section from '@/components/ui/Section';

const TravelDesigner = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const travelDesigner = getContentForComponent<any>('TravelDesigner');

  if (loading || !travelDesigner) {
    return (
      <Section sectionId="travelDesigner">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-center">
            <Skeleton height={20} width={250} className="mx-auto mb-2" />
            <Skeleton height={60} width={400} className="mx-auto" />
          </div>
          
          <div className="mt-16 flex justify-center">
            <div className="w-full max-w-lg @md:max-w-xl bg-white rounded-2xl shadow-lg p-2">
              <Skeleton height={400} className="rounded-xl mb-4" />
              <div className="p-4">
                <Skeleton height={16} count={4} className="mb-2" />
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Skeleton height={32} width={200} className="mx-auto mb-6" />
            <div className="flex justify-center items-center gap-4">
              <Skeleton circle height={50} width={50} />
              <Skeleton circle height={50} width={50} />
              <Skeleton circle height={50} width={50} />
            </div>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section sectionId="travelDesigner">
      <div className="max-w-4xl mx-auto text-center">
        
        

        <div className="text-center">
          <SectionTitle 
            subtitle={travelDesigner.preTitle}
            title={travelDesigner.title}
            centerAlign={true}
          />
        </div>

        {agentConfig?.ownerCardDesign === 'original' && (
          /* Owner Card Version 1 - Original mais larga */
          <div className="mt-16 flex justify-center">
            <div className="w-[98%] max-w-lg :max-w-xl bg-white rounded-2xl shadow-lg p-2">
              <div className="relative h-[600px] w-full rounded-xl overflow-hidden">
                <img 
                  src={travelDesigner.imageUrl}
                  alt={travelDesigner.imageAlt}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="p-4 text-left">
                <div className="space-y-2">
                  {travelDesigner.originalCard.paragraphs.map((paragraph: string, index: number) => (
                    <p
                      key={index}
                      data-typography="travelDesignerCard"
                      style={{
                        fontFamily: design.typography?.travelDesignerCard?.fontFamily || design.fonts.body,
                        fontSize: design.typography?.travelDesignerCard?.fontSize || '1rem',
                        lineHeight: design.typography?.travelDesignerCard?.lineHeight || '1.6',
                        fontWeight: design.typography?.travelDesignerCard?.fontWeight || '400',
                        color: design.typography?.travelDesignerCard?.color || '#111827'
                      }}
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {agentConfig?.ownerCardDesign === 'overlay' && (
          /* Owner Card Version 2 - Nova com overlay */
          <div className="mt-16 flex justify-center">
            <div className="w-[98%] max-w-lg :max-w-xl bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative min-h-[100vh] :h-[500px] w-full">
                {/* Background image */}
                <img 
                  src={travelDesigner.imageUrl}
                  alt={travelDesigner.imageAlt}
                  className="w-full h-full object-cover object-center"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80"></div>
                
                {/* Content over image */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="text-white">
                    <h3 className="text-2xl font-semibold mb-3" style={{ fontFamily: design.fonts.title }}>
                      {travelDesigner.overlayCard.title}
                    </h3>
                    <p className="text-sm text-white/90 leading-relaxed" style={{ fontFamily: design.fonts.body }}>
                      {travelDesigner.overlayCard.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
            <h3 className="text-3xl font-semibold mb-6" style={{ fontFamily: design.fonts.title, color: design.colors.text }}>
            {travelDesigner.socialSection.title}
            </h3>
            <div className={`
              ${design.socialIcons.container.base}
              ${design.socialIcons.container.gap}
            `}>
                <a href={`https://instagram.com/${agentConfig?.instagramHandle?.replace('@', '') || ''}`} target="_blank" rel="noopener noreferrer" className={`
                  ${design.socialIcons.icon.base}
                  ${design.socialIcons.icon.hover}
                  ${design.socialIcons.icon.border}
                  ${design.socialIcons.icon.backdrop}
                  ${design.socialIcons.icon.transition}
                `}>
                    <Instagram className={design.socialIcons.icon.size} />
                </a>
                <a href={`https://facebook.com${agentConfig?.facebookHandle || ''}`} target="_blank" rel="noopener noreferrer" className={`
                  ${design.socialIcons.icon.base}
                  ${design.socialIcons.icon.hover}
                  ${design.socialIcons.icon.border}
                  ${design.socialIcons.icon.backdrop}
                  ${design.socialIcons.icon.transition}
                `}>
                    <Facebook className={design.socialIcons.icon.size} />
                </a>
                <a href={`https://linkedin.com${agentConfig?.linkedinHandle || ''}`} target="_blank" rel="noopener noreferrer" className={`
                  ${design.socialIcons.icon.base}
                  ${design.socialIcons.icon.hover}
                  ${design.socialIcons.icon.border}
                  ${design.socialIcons.icon.backdrop}
                  ${design.socialIcons.icon.transition}
                `}>
                    <Linkedin className={design.socialIcons.icon.size} />
                </a>
            </div>
        </div>

      </div>
    </Section>
  );
};

export default TravelDesigner;


