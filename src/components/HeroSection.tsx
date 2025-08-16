import Skeleton from 'react-loading-skeleton';
import { Button } from '@/components/ui/button';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import { Instagram, Facebook, Linkedin } from 'lucide-react';
import SectionTitle from '@/components/ui/SectionTitle';
import Section from '@/components/ui/Section'; // Import the new Section component
import '../styles/hero.css';

const HeroSection = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const hero = getContentForComponent<any>('HeroSection');

  const scrollToPackages = () => {
    const packagesSection = document.getElementById('packages');
    if (packagesSection) {
      packagesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading || !hero) {
    return (
      <Section sectionId="hero" id="home">
        <div className="text-center space-y-6 @:space-y-8 max-w-4xl mx-auto">
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

          {/* Skeleton for Floating Cards */}
          <div className="w-full mt-8 :mt-16 :mt-24">
            <div className="grid grid-cols-1 :grid-cols-3 gap-4 :gap-6 max-w-5xl mx-auto px-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <Skeleton height={24} width={150} className="mb-2" />
                  <Skeleton height={20} width={200} count={2} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section sectionId="hero" id="home" backgroundImageUrl={hero.backgroundImageUrl}>
      {/* Main content - Top aligned on mobile, centered on desktop */}
      <div className="text-center space-y-6 :space-y-8 max-w-5xl mx-auto">
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
          
          <p 
            className=":mx-auto leading-tight :leading-relaxed flex-1 text-left :text-center"
            style={{
              fontFamily: design.typography.subtitle.fontFamily,
              fontSize: design.typography.subtitle.fontSize,
              fontWeight: design.typography.subtitle.fontWeight,
              color: design.typography.subtitle.color,
              lineHeight: design.typography.subtitle.lineHeight,
            }}
          >
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
        
        <div className="flex justify-center gap-4 mt-4 :mt-0">
          <Button 
            onClick={scrollToPackages} 
            className={`
              ${design.buttonStyles.primary.base}
              ${design.buttonStyles.primary.hover}
              ${design.buttonStyles.primary.border}
              ${design.buttonStyles.primary.borderHover}
              ${design.buttonStyles.primary.rounded}
              ${design.buttonStyles.primary.padding}
              ${design.buttonStyles.primary.fontSize}
              ${design.buttonStyles.primary.transition}
              ${design.buttonStyles.primary.shadow}
            `}
          >
            {hero.ctaText}
          </Button>
          <Button 
            onClick={scrollToContact} 
            className={`
              ${design.buttonStyles.secondary.base}
              ${design.buttonStyles.secondary.hover}
              ${design.buttonStyles.secondary.border}
              ${design.buttonStyles.secondary.borderHover}
              ${design.buttonStyles.secondary.rounded}
              ${design.buttonStyles.secondary.padding}
              ${design.buttonStyles.secondary.fontSize}
              ${design.buttonStyles.secondary.transition}
              ${design.buttonStyles.secondary.shadow}
            `}
          >
            {hero.ctaSecondary}
          </Button>
        </div>

        {/* Social Media Icons */}
        <div className={`
          ${design.socialIcons.container.base}
          ${design.socialIcons.container.gap}
          ${design.socialIcons.container.spacing}
        `}>
          <a href={hero.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={`
            ${design.socialIcons.icon.base}
            ${design.socialIcons.icon.hover}
            ${design.socialIcons.icon.border}
            ${design.socialIcons.icon.backdrop}
            ${design.socialIcons.icon.transition}
          `}>
              <Instagram className={design.socialIcons.icon.size} />
          </a>
          <a href={hero.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={`
            ${design.socialIcons.icon.base}
            ${design.socialIcons.icon.hover}
            ${design.socialIcons.icon.border}
            ${design.socialIcons.icon.backdrop}
            ${design.socialIcons.icon.transition}
          `}>
              <Facebook className={design.socialIcons.icon.size} />
          </a>
          <a href={hero.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={`
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


    </Section>
  );
};

export default HeroSection;
