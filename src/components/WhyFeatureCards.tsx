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
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={design.components?.cardDefaults?.motionWhileHover}
              >
                <Card
                  className={`${design.components?.cardDefaults?.className || ''} bg-${design.tokens?.colors?.background} `}
                  data-card-type="whyFeatureCard"
                  data-card-variant="standard"
                  style={{
                    backgroundColor: design.components?.whyFeatureCard?.backgroundColor || design.tokens?.colors?.background,
                    borderColor: design.components?.whyFeatureCard?.borderColor || 'transparent',
                    borderWidth: design.components?.whyFeatureCard?.borderWidth || '1px',
                    borderRadius: design.components?.whyFeatureCard?.borderRadius || '0.5rem',
                    boxShadow: design.components?.whyFeatureCard?.shadow || 'none',
                    padding: design.components?.whyFeatureCard?.padding || '2rem',
                    minHeight: design.components?.whyFeatureCard?.minHeight || '300px',
                    transition: design.components?.whyFeatureCard?.transition || 'all 0.3s ease'
                  }}
                >
                  <div
                    className="text-center h-full"
                    style={{
                      padding: design.components?.whyFeatureCard?.contentPadding || '2rem 0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: design.components?.whyFeatureCard?.contentAlignment || 'center'
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{
                        width: design.components?.whyFeatureCard?.iconSize || '4rem',
                        height: design.components?.whyFeatureCard?.iconSize || '4rem',
                        backgroundColor: design.components?.whyFeatureCard?.iconBackground || design.tokens?.colors?.primary,
                        color: design.components?.whyFeatureCard?.iconColor || 'black',
                        borderRadius: design.components?.whyFeatureCard?.iconBorderRadius || '50%',
                        marginBottom: design.components?.whyFeatureCard?.iconSpacing || '1.5rem'
                      }}
                    >
                      <IconComponent
                        style={{
                          width: design.components?.whyFeatureCard?.iconInnerSize || '1.75rem',
                          height: design.components?.whyFeatureCard?.iconInnerSize || '1.75rem'
                        }}
                      />
                    </div>
                    <CardTitle
                      data-typography="whyCard.title"
                      className="text-center"
                      style={{
                        fontFamily: design.tokens?.typography?.whyCardTitle?.fontFamily || design.tokens?.typography?.headings?.fontFamily,
                        fontSize: design.tokens?.typography?.whyCardTitle?.fontSize || '1.5rem',
                        fontWeight: design.tokens?.typography?.whyCardTitle?.fontWeight || '400',
                        lineHeight: design.tokens?.typography?.whyCardTitle?.lineHeight || '1.2',
                        letterSpacing: design.tokens?.typography?.whyCardTitle?.letterSpacing,
                        color: design.tokens?.typography?.whyCardTitle?.color || 'white',
                        marginBottom: design.components?.whyFeatureCard?.titleSpacing || '1rem'
                      }}
                    >
                      {feature.title}
                    </CardTitle>
                    <CardContent
                      style={{
                        padding: design.components?.whyFeatureCard?.descriptionPadding || '0 1.5rem'
                      }}
                    >
                      <CardDescription
                        data-typography="whyCard.description"
                        className="text-center"
                        style={{
                          fontFamily: design.tokens?.typography?.whyCardDescription?.fontFamily || design.tokens?.typography?.body?.fontFamily,
                          fontSize: design.tokens?.typography?.whyCardDescription?.fontSize || '1rem',
                          fontWeight: design.tokens?.typography?.whyCardDescription?.fontWeight || '300',
                          lineHeight: design.tokens?.typography?.whyCardDescription?.lineHeight || '1.6',
                          letterSpacing: design.tokens?.typography?.whyCardDescription?.letterSpacing,
                          color: design.tokens?.typography?.whyCardDescription?.color || '#cbd5e1'
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
