import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import HamburgerIcon from "./HamburgerIcon";

const NavigationVariation = () => {
  const { design } = useDesign();
  const { siteConfig, agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const navigation = getContentForComponent<any>('NavigationVariation');

  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ID único para o logo responsivo
  const logoId = `logo-${Math.random().toString(36).substr(2, 9)}`;

  // Media queries para o logo, usando as configurações de design
  const logoMediaQueries = `
    #${logoId} {
      height: ${(design.components as any)?.logos?.main?.height};
      width: ${(design.components as any)?.logos?.main?.width};
      object-fit: ${(design.components as any)?.logos?.main?.objectFit};
    }
    @media (min-width: 768px) {
      #${logoId} {
        height: ${(design.components as any)?.logos?.main?.heightMd};
      }
    }
    @media (min-width: 1024px) {
      #${logoId} {
        height: ${(design.components as any)?.logos?.main?.heightLg};
      }
    }
  `;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 100); // Hide logo after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const menuItems = navigation?.mobileMenuItems || [];
  const logoUrl = siteConfig?.logoUrl || '';
  // NOTE: The reference project has an inverted logo concept. This one does not.
  // We will use the same logo regardless of the menu state.

  return (
    <>
      {/* Injetar CSS responsivo para o logo */}
      <style dangerouslySetInnerHTML={{ __html: logoMediaQueries }} />
      {/* Main Navigation Container */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between p-4 :p-6">
        {/* Logo with scroll animation */}
        <motion.div 
          initial={{ y: 0, opacity: 1 }}
          animate={{ 
            y: (isScrolled && !isOpen) ? -100 : 0,
            opacity: (isScrolled && !isOpen) ? 0 : 1
          }}
          transition={{ 
            duration: 0.4,
            ease: "easeInOut"
          }}
        >
          <a href="#" className="flex items-center">
            {loading ? (
              <Skeleton height={48} width={150} />
            ) : (
              <img 
                id={logoId}
                src={logoUrl} 
                alt={`${agentConfig?.fullName || 'Travel Agent'} - ${siteConfig?.tagline || 'Travel Designer'}`}
                className="transition-all duration-300"
              />
            )}
          </a>
        </motion.div>

        {/* Hamburger Button */}
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-3 :p-4 focus:outline-none bg-white/10 backdrop-blur-sm rounded-full shadow-lg"
            aria-label="Toggle menu"
          >
            <HamburgerIcon isOpen={isOpen} />
          </button>
        </div>
      </div>

      {/* Fullscreen Overlay Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg"
            style={{ backgroundColor: (design.components as any)?.navigation?.menuOverlay?.backgroundColor || (design.navigation as any)?.menuOverlay?.backgroundColor }}
            key="menu-overlay"
          >
            <nav className="text-center">
              <ul className="space-y-8">
                {menuItems.map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ 
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <button
                      onClick={() => handleLinkClick(item.href)}
                      className="text-5xl :text-6xl font-light transition-colors duration-300"
                      style={{ color: (design.components as any)?.navigation?.menuOverlay?.linkColor || (design.navigation as any)?.menuOverlay?.linkColor }}
                      onMouseEnter={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.color = (design.components as any)?.navigation?.menuOverlay?.linkHoverColor || (design.navigation as any)?.menuOverlay?.linkHoverColor;
                      }}
                      onMouseLeave={(e) => {
                        const target = e.target as HTMLElement;
                        target.style.color = (design.components as any)?.navigation?.menuOverlay?.linkColor || (design.navigation as any)?.menuOverlay?.linkColor;
                      }}
                    >
                      {item.label}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NavigationVariation;
