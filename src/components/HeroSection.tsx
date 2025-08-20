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
        <div className="text-center space-y-6 @md:space-y-8 max-w-4xl mx-auto">
          {/* Skeleton for Title */}
          <Skeleton height={60} width={400} className="mx-auto mb-4" />
          
          {/* Skeleton for Avatar */}
          <div className="hidden @md:flex relative justify-center mt-4 mb-6">
            <Skeleton circle height={112} width={112} />
          </div>

          {/* Skeleton for Description */}
          <Skeleton height={20} width={600} count={2} className="mx-auto mb-2" />

          {/* Skeleton for CTA Button */}
          <div className="flex justify-center mt-4 @md:mt-0">
            <Skeleton height={50} width={200} />
          </div>

          {/* Skeleton for Social Icons */}
          <div className="mt-6 @md:mt-8 flex justify-center items-center gap-4">
            <Skeleton circle height={40} width={40} />
            <Skeleton circle height={40} width={40} />
            <Skeleton circle height={40} width={40} />
          </div>

          {/* Skeleton for Floating Cards */}
          <div className="w-full mt-8 @md:mt-16 @lg:mt-24">
            <div className="grid grid-cols-1 @md:grid-cols-3 gap-4 @md:gap-6 max-w-5xl mx-auto px-4">
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
      <div className="text-center space-y-6 @md:space-y-8 max-w-5xl mx-auto">
        <SectionTitle 
          title={`${hero.title} ${hero.subtitle}`}
          variant="hero_headings"
          className="mt-2 @md:max-w-5xl @md:mx-auto"
        />
        <div className="flex flex-row items-center justify-start gap-4 @md:block mt-2 mb-4 @md:mb-0">
          {/* Profile photo - smaller on mobile and to the left of the subheadline */}
          {/* Avatar + Checkmark (mobile) */}
          <div className="relative block @md:hidden flex-shrink-0">
            <div className="relative w-16 h-16 @md:w-20 @md:h-20 rounded-full overflow-hidden">
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
            data-typography="titleDescription"
            className="@md:mx-auto leading-tight @md:leading-relaxed flex-1 text-left @md:text-center"
            style={{
              fontFamily: design.tokens?.typography?.titleDescription?.fontFamily || design.tokens?.typography?.description?.fontFamily,
              fontSize: design.tokens?.typography?.titleDescription?.fontSize || design.tokens?.typography?.description?.fontSize,
              fontWeight: design.tokens?.typography?.titleDescription?.fontWeight || design.tokens?.typography?.description?.fontWeight,
              color: design.tokens?.typography?.titleDescription?.color || design.tokens?.typography?.description?.color,
              lineHeight: design.tokens?.typography?.titleDescription?.lineHeight || design.tokens?.typography?.description?.lineHeight,
            }}
          >
            {hero.description}
          </p>
        </div>
        
        {/* Profile photo below headline - desktop only */}
        {/* Avatar + Checkmark (desktop) */}
        <div className="hidden @md:flex relative justify-center mt-4 mb-6">
          <div className="relative w-24 h-24 @md:w-28 @md:h-28">
            <img 
              src={hero.profileImageUrl} 
              alt="Hugo Ramos" 
              className="w-full h-full rounded-full border-3 border-white/30 shadow-xl object-cover transform hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute z-10 -bottom-2 -right-2 w-7 h-7 @md:w-8 @md:h-8 bg-cyan-700 rounded-full flex items-center justify-center shadow-2xl ring-2 ring-white border-2 border-white">
              <span className="text-white text-[18px] @md:text-lg font-bold leading-none">✓</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mt-4 @md:mt-0">
          <Button 
            onClick={scrollToPackages}
            data-element="primaryButton"
            className="transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: design.components?.button?.variants?.primary?.backgroundColor,
              color: design.components?.button?.variants?.primary?.textColor,
              borderColor: design.components?.button?.variants?.primary?.borderColor,
              fontFamily: design.components?.button?.variants?.primary?.fontFamily,
              fontSize: design.components?.button?.variants?.primary?.fontSize,
              fontWeight: design.components?.button?.variants?.primary?.fontWeight,
              padding: design.components?.button?.variants?.primary?.padding,
              borderRadius: design.components?.button?.variants?.primary?.borderRadius,
              borderWidth: design.components?.button?.variants?.primary?.borderWidth,
              borderStyle: 'solid'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColorHover || '';
              e.currentTarget.style.borderColor = design.components?.button?.variants?.primary?.borderColorHover || '';
              e.currentTarget.style.color = design.components?.button?.variants?.primary?.textColorHover || '';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = design.components?.button?.variants?.primary?.backgroundColor || '';
              e.currentTarget.style.borderColor = design.components?.button?.variants?.primary?.borderColor || '';
              e.currentTarget.style.color = design.components?.button?.variants?.primary?.textColor || '';
            }}
          >
            {hero.ctaText}
          </Button>
          <Button 
            onClick={scrollToContact}
            data-element="secondaryButton"
            className="transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: design.components?.button?.variants?.secondary?.backgroundColor,
              color: design.components?.button?.variants?.secondary?.textColor,
              borderColor: design.components?.button?.variants?.secondary?.borderColor,
              fontFamily: design.components?.button?.variants?.secondary?.fontFamily,
              fontSize: design.components?.button?.variants?.secondary?.fontSize,
              fontWeight: design.components?.button?.variants?.secondary?.fontWeight,
              padding: design.components?.button?.variants?.secondary?.padding,
              borderRadius: design.components?.button?.variants?.secondary?.borderRadius,
              borderWidth: design.components?.button?.variants?.secondary?.borderWidth,
              borderStyle: 'solid'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = design.components?.button?.variants?.secondary?.backgroundColorHover || '';
              e.currentTarget.style.borderColor = design.components?.button?.variants?.secondary?.borderColorHover || '';
              e.currentTarget.style.color = design.components?.button?.variants?.secondary?.textColorHover || '';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = design.components?.button?.variants?.secondary?.backgroundColor || '';
              e.currentTarget.style.borderColor = design.components?.button?.variants?.secondary?.borderColor || '';
              e.currentTarget.style.color = design.components?.button?.variants?.secondary?.textColor || '';
            }}
          >
            {hero.ctaSecondary}
          </Button>
        </div>

        {/* Social Media Icons */}
        <div className={`
          ${design.components?.socialIcons?.container?.base || 'flex justify-center items-center'}
          ${design.components?.socialIcons?.container?.gap || 'gap-4'}
          ${design.components?.socialIcons?.container?.spacing || 'mt-6 sm:mt-8'}
        `}>
          <a href={hero.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={`
            ${design.components?.socialIcons?.icon?.base || ''}
            ${design.components?.socialIcons?.icon?.hover || ''}
            ${design.components?.socialIcons?.icon?.border || ''}
            ${design.components?.socialIcons?.icon?.backdrop || ''}
            ${design.components?.socialIcons?.icon?.transition || ''}
          `}>
              <Instagram className={design.components?.socialIcons?.icon?.size || ''} />
          </a>
          <a href={hero.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className={`
            ${design.components?.socialIcons?.icon?.base || ''}
            ${design.components?.socialIcons?.icon?.hover || ''}
            ${design.components?.socialIcons?.icon?.border || ''}
            ${design.components?.socialIcons?.icon?.backdrop || ''}
            ${design.components?.socialIcons?.icon?.transition || ''}
          `}>
              <Facebook className={design.components?.socialIcons?.icon?.size || ''} />
          </a>
          <a href={hero.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={`
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


    </Section>
  );
};

export default HeroSection;
