import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Section from '@/components/ui/Section';
import { Card } from '@/components/ui/card';

const TravelDesigner = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const travelDesigner = getContentForComponent<any>('TravelDesigner');

  // Token resolver helper
  const resolveTokenRef = (val: any): any => {
    if (typeof val !== 'string') return val;
    if (!val.startsWith('tokens.')) return val;
    try {
      const path = val.replace(/^tokens\./, '');
      const keys = path.split('.');
      let cur: any = design?.tokens || {};
      for (const k of keys) {
        if (cur && typeof cur === 'object' && k in cur) cur = cur[k]; else return undefined;
      }
      return cur ?? undefined;
    } catch { return undefined; }
  };

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
            <Card
              className="overflow-hidden"
              data-card-type="travelDesignerCard"
              style={{
                backgroundColor: resolveTokenRef(design.components?.travelDesignerCard?.backgroundColor),
                borderColor: resolveTokenRef(design.components?.travelDesignerCard?.borderColor),
                borderWidth: resolveTokenRef(design.components?.travelDesignerCard?.borderWidth),
                borderStyle: resolveTokenRef(design.components?.travelDesignerCard?.borderStyle),
                borderRadius: resolveTokenRef(design.components?.travelDesignerCard?.borderRadius),
                padding: resolveTokenRef(design.components?.travelDesignerCard?.padding),
                boxShadow: resolveTokenRef(design.components?.travelDesignerCard?.shadow),
                maxWidth: resolveTokenRef(design.components?.travelDesignerCard?.maxWidth),
                maxHeight: resolveTokenRef(design.components?.travelDesignerCard?.maxHeight)
              }}
            >
              <div className="relative w-full rounded-xl overflow-hidden">
                <img 
                  src={travelDesigner.imageUrl}
                  alt={travelDesigner.imageAlt}
                  className="w-full object-cover object-center"
                  style={{ 
                    maxHeight: resolveTokenRef(design.components?.travelDesignerCard?.imageMaxHeight) ?? '500px',
                    height: 'auto'
                  }}
                />
              </div>
              <div className="text-left" style={{ padding: resolveTokenRef(design.components?.travelDesignerCard?.contentPadding) }}>
                <div className="space-y-2">
                  {travelDesigner.originalCard.paragraphs.map((paragraph: string, index: number) => (
                    <p
                      key={index}
                      data-typography="travelDesignerCard"
                      style={{
                        fontFamily: design.tokens?.typography?.travelDesignerCard?.fontFamily || design.tokens?.typography?.body?.fontFamily,
                        fontSize: design.tokens?.typography?.travelDesignerCard?.fontSize || '1rem',
                        lineHeight: design.tokens?.typography?.travelDesignerCard?.lineHeight || '1.6',
                        fontWeight: design.tokens?.typography?.travelDesignerCard?.fontWeight || '400',
                        color: design.tokens?.typography?.travelDesignerCard?.color || '#111827'
                      }}
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {agentConfig?.ownerCardDesign === 'overlay' && (
          /* Owner Card Version 2 - Nova com overlay */
          <div className="mt-16 flex justify-center">
            <Card
              className="overflow-hidden"
              data-card-type="travelDesignerCard"
              style={{
                backgroundColor: resolveTokenRef(design.components?.travelDesignerCard?.backgroundColor),
                borderColor: resolveTokenRef(design.components?.travelDesignerCard?.borderColor),
                borderWidth: resolveTokenRef(design.components?.travelDesignerCard?.borderWidth),
                borderStyle: resolveTokenRef(design.components?.travelDesignerCard?.borderStyle),
                borderRadius: resolveTokenRef(design.components?.travelDesignerCard?.borderRadius),
                padding: resolveTokenRef(design.components?.travelDesignerCard?.padding),
                boxShadow: resolveTokenRef(design.components?.travelDesignerCard?.shadow),
                maxWidth: resolveTokenRef(design.components?.travelDesignerCard?.maxWidth),
                maxHeight: resolveTokenRef(design.components?.travelDesignerCard?.maxHeight)
              }}
            >
              <div className="relative w-full" style={{ minHeight: '100vh', height: resolveTokenRef(design.components?.travelDesignerCard?.imageHeight) }}>
                {/* Background image */}
                <img 
                  src={travelDesigner.imageUrl}
                  alt={travelDesigner.imageAlt}
                  className="w-full h-full object-cover object-center"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/80"></div>
                
                {/* Content over image */}
                <div className="absolute inset-0 flex flex-col justify-end"
                     style={{ padding: resolveTokenRef(design.components?.travelDesignerCard?.contentPadding) }}>
                  <div className="text-white">
                    <h3 className="text-2xl font-semibold mb-3" style={{ fontFamily: design.tokens?.typography?.headings?.fontFamily }}>
                      {travelDesigner.overlayCard.title}
                    </h3>
                    <p className="text-sm text-white/90 leading-relaxed" style={{ fontFamily: design.tokens?.typography?.body?.fontFamily }}>
                      {travelDesigner.overlayCard.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-16 text-center">
            <h3 className="text-3xl font-semibold mb-6" style={{ fontFamily: design.tokens?.typography?.headings?.fontFamily, color: design.tokens?.colors?.text }}>
            {travelDesigner.socialSection.title}
            </h3>
            <div className={`
              ${design.components?.socialIcons?.container?.base || ''}
              ${design.components?.socialIcons?.container?.gap || ''}
            `}>
                <a href={`https://instagram.com/${agentConfig?.instagramHandle?.replace('@', '') || ''}`} target="_blank" rel="noopener noreferrer" className={`
                  ${design.components?.socialIcons?.icon?.base || ''}
                  ${design.components?.socialIcons?.icon?.hover || ''}
                  ${design.components?.socialIcons?.icon?.border || ''}
                  ${design.components?.socialIcons?.icon?.backdrop || ''}
                  ${design.components?.socialIcons?.icon?.transition || ''}
                `}>
                    <Instagram className={design.components?.socialIcons?.icon?.size || ''} />
                </a>
                <a href={`https://facebook.com${agentConfig?.facebookHandle || ''}`} target="_blank" rel="noopener noreferrer" className={`
                  ${design.components?.socialIcons?.icon?.base || ''}
                  ${design.components?.socialIcons?.icon?.hover || ''}
                  ${design.components?.socialIcons?.icon?.border || ''}
                  ${design.components?.socialIcons?.icon?.backdrop || ''}
                  ${design.components?.socialIcons?.icon?.transition || ''}
                `}>
                    <Facebook className={design.components?.socialIcons?.icon?.size || ''} />
                </a>
                <a href={`https://linkedin.com${agentConfig?.linkedinHandle || ''}`} target="_blank" rel="noopener noreferrer" className={`
                  ${design.components?.socialIcons?.icon?.base || ''}
                  ${design.components?.socialIcons?.icon?.hover || ''}
                  ${design.components?.socialIcons?.icon?.border || ''}
                  ${design.components?.socialIcons?.icon?.backdrop || ''}
                  ${design.components?.socialIcons?.icon?.transition || ''}
                `}>
                    <Linkedin className={design.components?.socialIcons?.icon?.size || ''} />
                </a>
            </div>
        </div>

      </div>
    </Section>
  );
};

export default TravelDesigner;


