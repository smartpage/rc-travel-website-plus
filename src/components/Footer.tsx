// Force update - Footer should be visible
import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import Section from '@/components/ui/Section';

const Footer = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const footer = getContentForComponent<any>('Footer');

  if (loading || !footer) {
    return (
      <Section sectionId="footer">
        <div className="text-center">
          <Skeleton height={16} width={200} className="mx-auto mb-2" />
          <Skeleton height={14} width={300} className="mx-auto" />
        </div>
      </Section>
    );
  }

  return (
    <Section sectionId="footer">
      <div className="text-center">
        <p 
          className="text-sm" 
          style={{ 
            fontFamily: design.fonts.body,
            color: design.colors.textLight 
          }}
        >
          {footer?.rnavt}
        </p>
        <p 
          className="text-xs mt-1" 
          style={{ 
            fontFamily: design.fonts.body,
            color: design.colors.textLight 
          }}
        >
          {footer?.copyright.replace('{year}', new Date().getFullYear().toString()).replace('{agentName}', agentConfig?.fullName || '')}
        </p>
      </div>
    </Section>
  );
};

export default Footer;
