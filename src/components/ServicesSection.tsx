import React from 'react';
import { Plane, Briefcase, Calendar, Map, Users, Package, Heart, Building, Trophy, Waves, MapPin, Church, Anchor, Navigation, MessageCircle } from "lucide-react";
import Section from '@/components/ui/Section';
import SectionTitle from '@/components/ui/SectionTitle';
import { useContent } from '@/contexts/ContentContext';
import { useDesign } from '@/contexts/DesignContext';
import ServiceCard from './ServiceCard';

// Icon mapping
const iconMap = {
  Plane,
  Briefcase,
  Calendar,
  Map,
  Users,
  Package,
  Heart,
  Building,
  Trophy,
  Waves,
  MapPin,
  Church,
  Anchor,
  Navigation,
  MessageCircle
};

const ServicesSection: React.FC = () => {
  const { getContentForComponent } = useContent();
  
  const content = getContentForComponent<any>('ServicesSection');

  if (!content) {
    return (
      <Section sectionId="services">
        <div className="w-[98%] max-w-7xl mx-auto">
          <div className="grid @md:grid-cols-2 @lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="min-h-[500px] bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </Section>
    );
  }

  const { services } = content;

  return (
    <Section sectionId="services">
      <div className="text-center mb-24">
        <SectionTitle 
          title={content.title}
          subtitle={content.subtitle}
          description={content.description}
        />
      </div>
      
      {/* Services Grid */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-8">
        {services.map((service: any, index: number) => (
          <ServiceCard 
            key={service.id || index}
            service={service}
            iconMap={iconMap}
          />
        ))}
      </div>
    </Section>
  );
};

export default ServicesSection;
