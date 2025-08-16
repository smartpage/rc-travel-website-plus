import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import HamburgerIcon from "./HamburgerIcon";

const Navigation = () => {
  const { design } = useDesign();
  const { siteConfig, agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const { colors, spacing, layout, typography, effects, components, cx } = useDesignTokens();
  
  const navigation = getContentForComponent<any>('Navigation');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Unique ID for the responsive logo
  const logoId = `logo-${Math.random().toString(36).substr(2, 9)}`;

  // Container queries for the logo, using design configurations
  const logoContainerQueries = `
    #${logoId} {
      height: ${design.logos?.main?.height || '4.5rem'};
      width: ${design.logos?.main?.width || 'auto'};
      object-fit: ${design.logos?.main?.objectFit || 'contain'};
    }
    @container (min-width: 768px) {
      #${logoId} {
        height: ${design.logos?.main?.heightMd || '4.5rem'};
      }
    }
    @container (min-width: 1024px) {
      #${logoId} {
        height: ${design.logos?.main?.heightLg || '4.5rem'};
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
      <style dangerouslySetInnerHTML={{ __html: logoContainerQueries }} />
      <nav className={cx(
        'fixed top-0',
        layout.widths.full,
        'z-[60]',
        effects.transitions.all,
        isScrolled 
          ? cx(colors.background.surface, effects.blur.lg, effects.shadows.lg)
          : cx(colors.background.hover, effects.blur.sm)
      )}>
        <div className={layout.flex.center}>
          <div className={cx(
            layout.widths.full,
            layout.containers['2xl'],
            layout.flex.between,
            'px-0'
          )}>
            <motion.div 
              className={cx(
                'flex-1',
                layout.flex.center,
                spacing.padding.container.replace('py-8', '').replace('py-12', '').replace('py-16', '')
              )}
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
              <a href="#" className={cx(
                layout.flex.center,
                'py-3 @md:py-4'
              )}>
                {loading ? (
                  <Skeleton height={56} width={120} className="@md:h-12" />
                ) : (
                  <img 
                    id={logoId}
                    src={siteConfig?.logoUrl || ''} 
                    alt={`${agentConfig?.fullName || ''} - ${siteConfig?.tagline || ''}`}
                    className={effects.transitions.all}
                  />
                )}
              </a>
            </motion.div>
            
            <div className={cx(
              'flex-1',
              layout.flex.end,
              spacing.padding.container.replace('py-8', '').replace('py-12', '').replace('py-16', '')
            )}>
              {/* Desktop Menu */}
              <div className={cx(
                components.navigation.menu,
                spacing.gap.xl.replace('gap-', 'space-x-')
              )}>
                {desktopMenuItems.map((item) => (
                  <a 
                    key={item.label}
                    href={item.href} 
                    className={cx(
                      'text-gray-900',
                      typography.fontWeight.medium,
                      effects.transitions.colors,
                      'hover:text-cyan-700'
                    )}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              
              {/* Mobile Hamburger Button */}
              <div className={cx(
                '@md:hidden',
                layout.position.relative,
                'z-[60]'
              )}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={cx(
                    spacing.padding.xs,
                    'focus:outline-none',
                    layout.position.relative,
                    'z-[60]'
                  )}
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
            className={cx(
              layout.position.fixed,
              'inset-0',
              'bg-white',
              'z-40',
              layout.flex.center
            )}
          >
            <nav className={typography.textAlign.center}>
              <ul className={spacing.gap.lg.replace('gap-', 'space-y-')}>
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
                      className={cx(
                        'text-6xl @lg:text-8xl',
                        typography.fontWeight.light,
                        'text-black',
                        'hover:text-gray-700',
                        effects.transitions.colors
                      )}
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
