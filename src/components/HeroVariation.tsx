import Skeleton from 'react-loading-skeleton';
import { Button } from '@/components/ui/button';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Section from '@/components/ui/Section';
import '../styles/hero.css';

const HeroVariation = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const hero = getContentForComponent<any>('HeroVariation');

  const scrollToPackages = () => {
    const packagesSection = document.getElementById('packages');
    if (packagesSection) {
      packagesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading || !hero) {
    return (
      <Section sectionId="hero" id="home">
        <div className="text-center space-y-6 :space-y-8 max-w-4xl mx-auto">
          {/* Skeleton for Title */}
          <Skeleton height={60} width={400} className="mx-auto mb-4" />
          
          {/* Skeleton for Avatar */}
          <div className="hidden :flex relative justify-center mt-4 mb-6">
            <Skeleton circle height={112} width={112} />
          </div>

          {/* Skeleton for Description */}
          <Skeleton height={20} width={600} count={2} className="mx-auto mb-2" />

          {/* Skeleton for CTA Button */}
          <div className="flex justify-center mt-4 :mt-0">
            <Skeleton height={50} width={200} />
          </div>

          {/* Skeleton for Social Icons */}
          <div className="mt-6 :mt-8 flex justify-center items-center gap-4">
            <Skeleton circle height={40} width={40} />
            <Skeleton circle height={40} width={40} />
            <Skeleton circle height={40} width={40} />
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section sectionId="hero" id="home" backgroundImageUrl={hero.backgroundImageUrl}>
      {/* Main content - Top aligned on mobile, centered on desktop */}
      <div className="text-center space-y-6 :space-y-8 max-w-4xl mx-auto">
        <SectionTitle 
          title={`${hero.title} ${hero.subtitle}`}
          variant="hero_headings"
          className="mt-2 :max-w-5xl :mx-auto"
        />
        <div className="flex flex-row items-center justify-start gap-4 :block mt-2 mb-4 :mb-0">
          {/* Profile photo - smaller on mobile and to the left of the subheadline */}
          {/* Avatar + Checkmark (mobile) */}
          <div className="relative block :hidden flex-shrink-0">
            <div className="relative w-16 h-16 :w-20 :h-20 rounded-full overflow-hidden">
              <img 
                src={hero.profileImageUrl} 
                alt="Hugo Ramos" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute z-10 -bottom-1 -right-1 w-5 h-5 bg-cyan-700 rounded-full flex items-center justify-center shadow-xl ring-2 ring-white border border-white">
              <span className="text-white text-[13px] font-bold leading-none">✓</span>
            </div>
          </div>
          
          <p className="text-lg :text-xl text-white/90 :mx-auto leading-tight :leading-relaxed flex-1 text-left :text-center">
            {hero.description}
          </p>
        </div>
        
        {/* Profile photo below headline - desktop only */}
        {/* Avatar + Checkmark (desktop) */}
        <div className="hidden :flex relative justify-center mt-4 mb-6">
          <div className="relative w-24 h-24 :w-28 :h-28">
            <img 
              src={hero.profileImageUrl} 
              alt="Hugo Ramos" 
              className="w-full h-full rounded-full border-3 border-white/30 shadow-xl object-cover transform hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute z-10 -bottom-2 -right-2 w-7 h-7 :w-8 :h-8 bg-cyan-700 rounded-full flex items-center justify-center shadow-2xl ring-2 ring-white border-2 border-white">
              <span className="text-white text-[18px] :text-lg font-bold leading-none">✓</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-4 :mt-0">
          <Button 
            onClick={scrollToPackages} 
            className="bg-cyan-700 hover:bg-cyan-800 text-white px-6 :px-8 py-4 :py-6 text-base :text-lg font-normal rounded-xl transition-all duration-300 shadow-none"
          >
            {hero.ctaText}
          </Button>
        </div>

        {/* Social Media Icons */}
        <div className="mt-6 :mt-8 flex justify-center items-center gap-4">
          <a href={hero.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm border border-white/20">
              <Instagram className="h-5 w-5" />
          </a>
          <a href={hero.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm border border-white/20">
              <Facebook className="h-5 w-5" />
          </a>
          <a href={hero.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full p-3 transition-all duration-300 backdrop-blur-sm border border-white/20">
              <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </div>
    </Section>
  );
};

export default HeroVariation;
