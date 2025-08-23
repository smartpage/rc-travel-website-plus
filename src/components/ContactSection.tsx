import Skeleton from 'react-loading-skeleton';
import { useDesign } from '@/contexts/DesignContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useContent } from '@/contexts/ContentContext';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Mail, Phone } from 'lucide-react';
import SectionTitle from './ui/SectionTitle';
import Section from './ui/Section';
import { motion } from 'framer-motion';

const ContactSection = () => {
  const { design } = useDesign();
  const { agentConfig } = useSettings();
  const { getContentForComponent, loading } = useContent();
  const contact = getContentForComponent<any>('ContactSection');

  const handleWhatsAppContact = () => {
    if (!agentConfig) {
      console.warn('AgentConfig not loaded yet');
      return;
    }
    const message = contact.whatsappMessageTemplate.replace('{agentFirstName}', agentConfig.firstName);
    const whatsappUrl = `https://wa.me/${agentConfig.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailContact = () => {
    if (!agentConfig) {
      console.warn('AgentConfig not loaded yet');
      return;
    }
    const body = contact.emailBodyTemplate.replace('{agentFirstName}', agentConfig.firstName);
    const mailtoUrl = `mailto:${agentConfig.email}?subject=${encodeURIComponent(contact.emailSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  if (loading || !contact) {
    return (
      <Section sectionId="contact" id="contact">
        <div className="text-center mb-16">
          <Skeleton height={48} width={300} className="mx-auto mb-4" />
          <Skeleton height={20} width={500} className="mx-auto" />
        </div>
        
        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-12">
          {/* Contact Info Card Skeleton */}
          <Card className="p-8">
            <CardHeader className="text-center">
              <CardTitle>
                <Skeleton height={32} width={200} className="mx-auto mb-4" />
              </CardTitle>
              <Skeleton height={16} count={2} className="mb-4" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Skeleton circle height={40} width={40} />
                <div className="flex-1">
                  <Skeleton height={16} width={100} className="mb-1" />
                  <Skeleton height={20} width={150} />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton circle height={40} width={40} />
                <div className="flex-1">
                  <Skeleton height={16} width={80} className="mb-1" />
                  <Skeleton height={20} width={200} />
                </div>
              </div>
              <div className="flex space-x-4 pt-4">
                <Skeleton height={40} width={120} />
                <Skeleton height={40} width={100} />
              </div>
            </CardContent>
          </Card>
          
          {/* Contact Form Card Skeleton */}
          <Card className="p-8">
            <CardHeader>
              <CardTitle>
                <Skeleton height={32} width={180} className="mb-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Skeleton height={16} width={80} className="mb-2" />
                <Skeleton height={40} width="100%" />
              </div>
              <div>
                <Skeleton height={16} width={60} className="mb-2" />
                <Skeleton height={40} width="100%" />
              </div>
              <div>
                <Skeleton height={16} width={100} className="mb-2" />
                <Skeleton height={120} width="100%" />
              </div>
              <Skeleton height={40} width="100%" className="mt-6" />
            </CardContent>
          </Card>
        </div>
      </Section>
    );
  }

  return (
    <Section sectionId="contact" id="contact">
      <div className="text-center mb-12 :mb-16">
        <SectionTitle
          subtitle={contact.preTitle}
          title={contact.title}
          description={contact.description}
          variant="headings"
        />
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 @lg:grid-cols-2 gap-8">
        {/* WhatsApp Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          whileHover={{ y: -5 }}
        >
        <Card data-card-type="contactCard" data-card-variant="standard" className={`
          ${design.components?.primaryCards?.container?.base || ''}
          ${design.components?.primaryCards?.container?.border || ''}
          ${design.components?.primaryCards?.container?.rounded || ''}
          ${design.components?.primaryCards?.container?.shadow || ''}
          ${design.components?.primaryCards?.container?.transition || ''}
          ${design.components?.primaryCards?.container?.padding || ''}
          ${design.components?.primaryCards?.container?.hover || ''}
        `}
        style={{
          backgroundColor: design.components?.contactCard?.backgroundColor || design.tokens?.colors?.cardBackground || '#1f2937',
          borderColor: design.components?.contactCard?.borderColor || design.tokens?.colors?.accent || '#eab308',
          borderWidth: design.components?.contactCard?.borderWidth || '2px',
          borderStyle: 'solid',
          borderRadius: design.components?.contactCard?.borderRadius || '1rem',
          boxShadow: design.components?.contactCard?.shadow || '0 10px 20px rgba(0,0,0,.35)',
          padding: design.components?.contactCard?.padding || '2rem',
          minHeight: design.components?.contactCard?.minHeight || 'auto'
        }}>
          <CardHeader className={design.components?.primaryCards?.header?.spacing || ''}>
            <CardTitle data-typography="contactCard.title" className={`
              ${design.components?.primaryCards?.title?.layout || ''}
              ${design.components?.primaryCards?.title?.base || ''}
              ${design.components?.primaryCards?.title?.fontSize || ''}
              ${design.components?.primaryCards?.title?.fontWeight || ''}
            `}
            style={{
              fontFamily: design.tokens?.typography?.contactCardTitle?.fontFamily || design.tokens?.typography?.headings?.fontFamily,
              fontSize: design.tokens?.typography?.contactCardTitle?.fontSize || '1.25rem',
              fontWeight: design.tokens?.typography?.contactCardTitle?.fontWeight || '600',
              lineHeight: design.tokens?.typography?.contactCardTitle?.lineHeight || '1.2',
              color: design.tokens?.typography?.contactCardTitle?.color || design.tokens?.colors?.text || 'white'
            }}>
              <Phone className={`
                ${design.components?.primaryCards?.title?.iconSize || ''}
                ${design.components?.primaryCards?.title?.iconColor || ''}
              `} />
              {contact.whatsappCard.title}
            </CardTitle>
          </CardHeader>
          <CardContent className={design.components?.primaryCards?.content?.spacing || ''}>
            <p data-typography="contactCard.body" className={`
              ${design.components?.primaryCards?.description?.color || ''}
              ${design.components?.primaryCards?.description?.fontSize || ''}
              ${design.components?.primaryCards?.description?.fontWeight || ''}
              ${design.components?.primaryCards?.description?.lineHeight || ''}
              ${design.components?.primaryCards?.description?.spacing || ''}
            `}
            style={{
              fontFamily: design.tokens?.typography?.contactCardBody?.fontFamily || design.tokens?.typography?.body?.fontFamily,
              fontSize: design.tokens?.typography?.contactCardBody?.fontSize || '1rem',
              fontWeight: design.tokens?.typography?.contactCardBody?.fontWeight || '400',
              lineHeight: design.tokens?.typography?.contactCardBody?.lineHeight || '1.6',
              color: design.tokens?.typography?.contactCardBody?.color || design.tokens?.colors?.text || '#cbd5e1'
            }}>
              {contact.whatsappCard.description}
            </p>
            <Button
              onClick={handleWhatsAppContact}
              data-element="primaryButton"
              className="w-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
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
              {contact.ctaWhatsApp}
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        {/* Email Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          whileHover={{ y: -5 }}
        >
        <Card data-card-type="contactCard" data-card-variant="standard" className={`
          ${design.components?.primaryCards?.container?.base || ''}
          ${design.components?.primaryCards?.container?.border || ''}
          ${design.components?.primaryCards?.container?.rounded || ''}
          ${design.components?.primaryCards?.container?.shadow || ''}
          ${design.components?.primaryCards?.container?.transition || ''}
          ${design.components?.primaryCards?.container?.padding || ''}
          ${design.components?.primaryCards?.container?.hover || ''}
        `}
        style={{
          backgroundColor: design.components?.contactCard?.backgroundColor || design.tokens?.colors?.cardBackground || '#1f2937',
          borderColor: design.components?.contactCard?.borderColor || design.tokens?.colors?.accent || '#eab308',
          borderWidth: design.components?.contactCard?.borderWidth || '2px',
          borderStyle: 'solid',
          borderRadius: design.components?.contactCard?.borderRadius || '1rem',
          boxShadow: design.components?.contactCard?.shadow || '0 10px 20px rgba(0,0,0,.35)',
          padding: design.components?.contactCard?.padding || '2rem',
          minHeight: design.components?.contactCard?.minHeight || 'auto'
        }}>
          <CardHeader className={design.components?.primaryCards?.header?.spacing || ''}>
            <CardTitle data-typography="contactCard.title" className={`
              ${design.components?.primaryCards?.title?.layout || ''}
              ${design.components?.primaryCards?.title?.base || ''}
              ${design.components?.primaryCards?.title?.fontSize || ''}
              ${design.components?.primaryCards?.title?.fontWeight || ''}
            `}
            style={{
              fontFamily: design.tokens?.typography?.contactCardTitle?.fontFamily || design.tokens?.typography?.headings?.fontFamily,
              fontSize: design.tokens?.typography?.contactCardTitle?.fontSize || '1.25rem',
              fontWeight: design.tokens?.typography?.contactCardTitle?.fontWeight || '600',
              lineHeight: design.tokens?.typography?.contactCardTitle?.lineHeight || '1.2',
              color: design.tokens?.typography?.contactCardTitle?.color || design.tokens?.colors?.text || 'white'
            }}>
              <Mail className={`
                ${design.components?.primaryCards?.title?.iconSize || ''}
                ${design.components?.primaryCards?.title?.iconColor || ''}
              `} />
              {contact.emailCard.title}
            </CardTitle>
          </CardHeader>
          <CardContent className={design.components?.primaryCards?.content?.spacing || ''}>
            <p data-typography="contactCard.body" className={`
              ${design.components?.primaryCards?.description?.color || ''}
              ${design.components?.primaryCards?.description?.fontSize || ''}
              ${design.components?.primaryCards?.description?.fontWeight || ''}
              ${design.components?.primaryCards?.description?.lineHeight || ''}
              ${design.components?.primaryCards?.description?.spacing || ''}
            `}
            style={{
              fontFamily: design.tokens?.typography?.contactCardBody?.fontFamily || design.tokens?.typography?.body?.fontFamily,
              fontSize: design.tokens?.typography?.contactCardBody?.fontSize || '1rem',
              fontWeight: design.tokens?.typography?.contactCardBody?.fontWeight || '400',
              lineHeight: design.tokens?.typography?.contactCardBody?.lineHeight || '1.6',
              color: design.tokens?.typography?.contactCardBody?.color || design.tokens?.colors?.text || '#cbd5e1'
            }}>
              {contact.emailCard.description}
            </p>
            <Button
              onClick={handleEmailContact}
              data-element="primaryButton"
              className="w-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
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
              {contact.ctaEmail}
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </Section>
  );
};

export default ContactSection;
