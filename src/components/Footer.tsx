import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import Section from '@/components/ui/Section';
import { Card } from '@/components/ui/card';

const Footer = () => {
  const { design, loading: designLoading } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const footer = getContentForComponent<any>('Footer');

  // Note: Footer reads direct values from dbV2 (no token resolver)


  if (loading || designLoading || !footer) {
    return (
      <Section sectionId="footer">
        <div className="text-center">
          <Skeleton height={16} width={200} className="mx-auto mb-2" />
          <Skeleton height={14} width={300} className="mx-auto" />
        </div>
      </Section>
    );
  }

  // Get footer card config directly from design
  const footerCard = design?.components?.footerCard || {};
  

  return (
    <Section sectionId="footer">
      <Card
        className="w-full border-none bg-transparent shadow-none"
        data-card-type="footerCard"
        data-card-variant="standard"
        style={{
          backgroundColor: footerCard.backgroundColor,
          borderColor: footerCard.borderColor,
          borderWidth: footerCard.borderWidth,
          borderStyle: footerCard.borderStyle,
          borderRadius: footerCard.borderRadius,
          padding: footerCard.padding,
        }}
      >
        <div className="w-full flex flex-col items-center">
          {/* Top bar */}
          <div
            aria-hidden
            style={{
              width: footerCard.barTop.width,
              height: footerCard.barTop.height,
              backgroundColor: footerCard.barTop.color,
              marginBottom: footerCard.gap,
            }}
          />

          {/* Content */}
          <div className="w-full text-center space-y-1">
            <p
              data-typography="footerCard.primary"
              style={{
                fontFamily: footerCard.text.fontFamily,
                fontSize: footerCard.text.fontSize,
                fontWeight: footerCard.text.fontWeight,
                lineHeight: footerCard.text.lineHeight,
                color: footerCard.text.color,
              }}
            >
              {footer?.rnavt}
            </p>
            <p
              data-typography="footerCard.secondary"
              style={{
                fontFamily: footerCard.text.fontFamily,
                fontSize: footerCard.text.fontSize,
                fontWeight: footerCard.text.fontWeight,
                lineHeight: footerCard.text.lineHeight,
                color: footerCard.text.color,
              }}
            >
              {footer?.copyright.replace('{year}', new Date().getFullYear().toString()).replace('{agentName}', agentConfig?.fullName || '')}
            </p>
          </div>

          {/* Bottom bar */}
          <div
            aria-hidden
            style={{
              width: footerCard.barBottom.width,
              height: footerCard.barBottom.height,
              backgroundColor: footerCard.barBottom.color,
              marginTop: footerCard.gap,
            }}
          />
        </div>
      </Card>
    </Section>
  );
};

export default Footer;
