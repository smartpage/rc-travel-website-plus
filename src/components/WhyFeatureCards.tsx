import React from 'react';
import Skeleton from 'react-loading-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDesign } from '@/contexts/DesignContext';
import { useContent } from '@/contexts/ContentContext';
import { Globe, ShieldCheck, Star, Users, Map, Coffee } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Section from '@/components/ui/Section';
import { motion } from 'framer-motion';

const WhyFeatureCards: React.FC = () => {
  const { design } = useDesign();
  const { getContentForComponent, loading } = useContent();
  const whySection = getContentForComponent<any>('WhyFeatureCards');

  const iconMap = {
    Star,
    Globe,
    Map,
    Users,
    ShieldCheck,
    Coffee
  };

  if (loading || !whySection) {
    return (
      <Section sectionId="whyFeatureCards">
        <div className="absolute inset-0 noise-overlay"></div>
        <div className="relative z-10">
          <div className="text-center mb-16">
            <Skeleton height={48} width={400} className="mx-auto mb-6" />
            <Skeleton height={20} width={600} className="mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Skeleton circle height={64} width={64} />
                  </div>
                  <CardTitle>
                    <Skeleton height={24} width={150} className="mx-auto mb-2" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton height={16} count={3} className="mb-1" />
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section sectionId="whyFeatureCards">
      <div className="absolute inset-0 noise-overlay"></div>
      <div className="relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <SectionTitle 
            subtitle={whySection.preTitle}
            title={whySection.title}
            description={whySection.description}
            centerAlign={true}
          />
        </div>

        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-8">
          {whySection.features.map((feature: any, index: number) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Star;
            // Resolve token reference strings like "tokens.colors.primary" to actual values (undefined on miss)
            const resolveTokenRef = (val: any): any => {
              if (typeof val !== 'string') return val;
              if (!val.startsWith('tokens.')) return val;
              try {
                const path = val.replace(/^tokens\./, '');
                const keys = path.split('.');
                let cur: any = design?.tokens || {};
                for (const k of keys) {
                  if (cur && typeof cur === 'object' && k in cur) cur = (cur as any)[k]; else return undefined;
                }
                return cur as any;
              } catch { return undefined; }
            };

            // Compute background overlay (supports gradients or token refs)
            const overlayColor = resolveTokenRef(design.components?.whyFeatureCard?.background?.overlay?.color);
            const rawOpacity = (design.components as any)?.whyFeatureCard?.background?.overlay?.opacity as any;
            const overlayOpacity = rawOpacity === undefined || rawOpacity === null ? 1 : Number(rawOpacity);

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={design.components?.cardDefaults?.motionWhileHover}
              >
                <Card
                  className={`${design.components?.cardDefaults?.className ?? ''} bg-${design.tokens?.colors?.background} `}
                  data-card-type="whyFeatureCard"
                  data-card-variant="standard"
                  style={{
                    backgroundColor: resolveTokenRef(design.components?.whyFeatureCard?.backgroundColor),
                    borderColor: resolveTokenRef(design.components?.whyFeatureCard?.borderColor),
                    borderWidth: resolveTokenRef(design.components?.whyFeatureCard?.borderWidth),
                    borderStyle: resolveTokenRef(design.components?.whyFeatureCard?.borderStyle),
                    borderRadius: resolveTokenRef(design.components?.whyFeatureCard?.borderRadius),
                    boxShadow: resolveTokenRef(design.components?.whyFeatureCard?.shadow),
                    padding: resolveTokenRef(design.components?.whyFeatureCard?.padding),
                    minHeight: resolveTokenRef(design.components?.whyFeatureCard?.minHeight),
                    color: resolveTokenRef(design.components?.whyFeatureCard?.textColor),
                    transition: design.components?.whyFeatureCard?.transition ?? undefined,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Background overlay for whyFeatureCard */}
                  {overlayColor && overlayOpacity > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: overlayColor as any,
                        opacity: overlayOpacity,
                        pointerEvents: 'none',
                        borderRadius: resolveTokenRef(design.components?.whyFeatureCard?.borderRadius),
                        zIndex: 0
                      }}
                    />
                  )}
                  <div
                    className="text-center h-full"
                    style={{
                      padding: design.components?.whyFeatureCard?.contentPadding ?? undefined,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: design.components?.whyFeatureCard?.contentAlignment ?? undefined,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{
                        width: design.components?.whyFeatureCard?.iconSize ?? undefined,
                        height: design.components?.whyFeatureCard?.iconSize ?? undefined,
                        backgroundColor: resolveTokenRef(design.components?.whyFeatureCard?.iconBackground) ?? design.tokens?.colors?.primary,
                        color: resolveTokenRef(design.components?.whyFeatureCard?.iconColor),
                        borderRadius: design.components?.whyFeatureCard?.iconBorderRadius ?? undefined,
                        marginBottom: design.components?.whyFeatureCard?.iconSpacing ?? undefined
                      }}
                    >
                      <IconComponent
                        style={{
                          width: design.components?.whyFeatureCard?.iconInnerSize ?? undefined,
                          height: design.components?.whyFeatureCard?.iconInnerSize ?? undefined
                        }}
                      />
                    </div>
                    <CardTitle
                      data-typography="whyCard.title"
                      className="text-center"
                      style={{
                        fontFamily: design.tokens?.typography?.whyCardTitle?.fontFamily ?? design.tokens?.typography?.headings?.fontFamily,
                        fontSize: design.tokens?.typography?.whyCardTitle?.fontSize ?? undefined,
                        fontWeight: design.tokens?.typography?.whyCardTitle?.fontWeight ?? undefined,
                        lineHeight: design.tokens?.typography?.whyCardTitle?.lineHeight ?? undefined,
                        letterSpacing: design.tokens?.typography?.whyCardTitle?.letterSpacing ?? undefined,
                        color: design.tokens?.typography?.whyCardTitle?.color ?? undefined,
                        marginBottom: design.components?.whyFeatureCard?.titleSpacing ?? undefined
                      }}
                    >
                      {feature.title}
                    </CardTitle>
                    <CardContent
                      style={{
                        padding: design.components?.whyFeatureCard?.descriptionPadding ?? undefined
                      }}
                    >
                      <CardDescription
                        data-typography="whyCard.description"
                        className="text-center"
                        style={{
                          fontFamily: design.tokens?.typography?.whyCardDescription?.fontFamily ?? design.tokens?.typography?.body?.fontFamily,
                          fontSize: design.tokens?.typography?.whyCardDescription?.fontSize ?? undefined,
                          fontWeight: design.tokens?.typography?.whyCardDescription?.fontWeight ?? undefined,
                          lineHeight: design.tokens?.typography?.whyCardDescription?.lineHeight ?? undefined,
                          letterSpacing: design.tokens?.typography?.whyCardDescription?.letterSpacing ?? undefined,
                          color: design.tokens?.typography?.whyCardDescription?.color ?? undefined
                        }}
                      >
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
};

export default WhyFeatureCards;
