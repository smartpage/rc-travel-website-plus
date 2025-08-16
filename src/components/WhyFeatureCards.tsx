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
                whileHover={design.cardDefaults.motionWhileHover}
              >
                <Card className={`${design.cardDefaults.className} bg-${design.colors.background} `}>
                  <div className={`text-center py-8 h-full ${design.primaryCards.container.border} ${design.primaryCards.container.rounded}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-6 mx-auto bg-${design.colors.primary} text-black`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <CardTitle className={`text-center ${design.primaryCards.title.fontSize} ${design.primaryCards.title.base} ${design.primaryCards.title.fontWeight} mb-4`} style={{ fontFamily: design.fonts.title }}>
                      {feature.title}
                    </CardTitle>
                    <CardContent className="px-6">
                      <CardDescription className={`${design.primaryCards.description.fontSize} ${design.primaryCards.description.color} leading-relaxed text-center`} style={{ fontFamily: design.fonts.body }}>
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
