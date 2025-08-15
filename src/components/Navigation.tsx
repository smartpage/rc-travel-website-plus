import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import HamburgerIcon from "./HamburgerIcon";

const Navigation = () => {
  const { design } = useDesign();
  const { siteConfig, agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const navigation = getContentForComponent<any>('Navigation');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Unique ID for the responsive logo
  const logoId = `logo-${Math.random().toString(36).substr(2, 9)}`;

  // Media queries for the logo, using design configurations
  const logoMediaQueries = `
    #${logoId} {
      height: ${design.logos.main.height};
      width: ${design.logos.main.width};
      object-fit: ${design.logos.main.objectFit};
    }
    @media (min-width: 768px) {
      #${logoId} {
        height: ${design.logos.main.heightMd};
      }
    }
    @media (min-width: 1024px) {
      #${logoId} {
        height: ${design.logos.main.heightLg};
      }
    }
  `;

  useEffect(() => {
  
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get menu items from content or fallback to default
  const desktopMenuItems = navigation?.desktopMenuItems || [];

  const mobileMenuItems = navigation?.mobileMenuItems || [];

  const handleLinkClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Inject responsive CSS for the logo */}
      <style dangerouslySetInnerHTML={{ __html: logoMediaQueries }} />
      <nav className={`fixed top-0 w-full z-[60] transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-lg' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="flex justify-center w-full">
          <div className="w-full max-w-screen-xl flex items-center justify-between px-0 mx-auto">
            <motion.div 
              className="flex-1 flex items-center pl-4 sm:pl-6 md:pl-10"
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
              <a href="#" className="flex items-center py-3 sm:py-4">
                {loading ? (
                  <Skeleton height={56} width={120} className="sm:h-12" />
                ) : (
                  <img 
                    id={logoId}
                    src={siteConfig?.logoUrl || ''} 
                    alt={`${agentConfig?.fullName || ''} - ${siteConfig?.tagline || ''}`}
                    className="transition-all duration-300"
                  />
                )}
              </a>
            </motion.div>
            
            <div className="flex-1 flex items-center justify-end pr-4 sm:pr-6 md:pr-10">
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-10">
                {desktopMenuItems.map((item) => (
                  <a 
                    key={item.label}
                    href={item.href} 
                    className="text-gray-900 font-medium transition-colors duration-300 hover:text-cyan-700"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              
              {/* Mobile Hamburger Button */}
              <div className="md:hidden relative z-[60]">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 focus:outline-none relative z-[60]"
                  aria-label="Toggle menu"
                >
                  <HamburgerIcon isOpen={isOpen} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>



      {/* Fullscreen Overlay Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-40 flex items-center justify-center"
          >

            <nav className="text-center">
              <ul className="space-y-8">
                {mobileMenuItems.map((item, index) => (
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
                      className="text-6xl lg:text-8xl font-light text-black hover:text-gray-700 transition-colors duration-300"
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

export default Navigation;
