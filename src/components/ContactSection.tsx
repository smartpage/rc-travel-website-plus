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
        <Card className={`
          ${design.primaryCards.container.base}
          ${design.primaryCards.container.border}
          ${design.primaryCards.container.rounded}
          ${design.primaryCards.container.shadow}
          ${design.primaryCards.container.transition}
          ${design.primaryCards.container.padding}
          ${design.primaryCards.container.hover}
        `}>
          <CardHeader className={design.primaryCards.header.spacing}>
            <CardTitle className={`
              ${design.primaryCards.title.layout}
              ${design.primaryCards.title.base}
              ${design.primaryCards.title.fontSize}
              ${design.primaryCards.title.fontWeight}
            `}>
              <Phone className={`
                ${design.primaryCards.title.iconSize}
                ${design.primaryCards.title.iconColor}
              `} />
              {contact.whatsappCard.title}
            </CardTitle>
          </CardHeader>
          <CardContent className={design.primaryCards.content.spacing}>
            <p className={`
              ${design.primaryCards.description.color}
              ${design.primaryCards.description.fontSize}
              ${design.primaryCards.description.fontWeight}
              ${design.primaryCards.description.lineHeight}
              ${design.primaryCards.description.spacing}
            `}>
              {contact.whatsappCard.description}
            </p>
            <Button
              onClick={handleWhatsAppContact}
              data-element="primaryButton"
              className="w-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: design.buttons.primary.backgroundColor,
                color: design.buttons.primary.textColor,
                borderColor: design.buttons.primary.borderColor,
                fontFamily: design.buttons.primary.fontFamily,
                fontSize: design.buttons.primary.fontSize,
                fontWeight: design.buttons.primary.fontWeight,
                padding: design.buttons.primary.padding,
                borderRadius: design.buttons.primary.borderRadius,
                borderWidth: design.buttons.primary.borderWidth,
                borderStyle: 'solid'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = design.buttons.primary.backgroundColorHover;
                e.currentTarget.style.borderColor = design.buttons.primary.borderColorHover;
                e.currentTarget.style.color = design.buttons.primary.textColorHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = design.buttons.primary.backgroundColor;
                e.currentTarget.style.borderColor = design.buttons.primary.borderColor;
                e.currentTarget.style.color = design.buttons.primary.textColor;
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
        <Card className={`
          ${design.primaryCards.container.base}
          ${design.primaryCards.container.border}
          ${design.primaryCards.container.rounded}
          ${design.primaryCards.container.shadow}
          ${design.primaryCards.container.transition}
          ${design.primaryCards.container.padding}
          ${design.primaryCards.container.hover}
        `}>
          <CardHeader className={design.primaryCards.header.spacing}>
            <CardTitle className={`
              ${design.primaryCards.title.layout}
              ${design.primaryCards.title.base}
              ${design.primaryCards.title.fontSize}
              ${design.primaryCards.title.fontWeight}
            `}>
              <Mail className={`
                ${design.primaryCards.title.iconSize}
                ${design.primaryCards.title.iconColor}
              `} />
              {contact.emailCard.title}
            </CardTitle>
          </CardHeader>
          <CardContent className={design.primaryCards.content.spacing}>
            <p className={`
              ${design.primaryCards.description.color}
              ${design.primaryCards.description.fontSize}
              ${design.primaryCards.description.fontWeight}
              ${design.primaryCards.description.lineHeight}
              ${design.primaryCards.description.spacing}
            `}>
              {contact.emailCard.description}
            </p>
            <Button
              onClick={handleEmailContact}
              data-element="primaryButton"
              className="w-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: design.buttons.primary.backgroundColor,
                color: design.buttons.primary.textColor,
                borderColor: design.buttons.primary.borderColor,
                fontFamily: design.buttons.primary.fontFamily,
                fontSize: design.buttons.primary.fontSize,
                fontWeight: design.buttons.primary.fontWeight,
                padding: design.buttons.primary.padding,
                borderRadius: design.buttons.primary.borderRadius,
                borderWidth: design.buttons.primary.borderWidth,
                borderStyle: 'solid'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = design.buttons.primary.backgroundColorHover;
                e.currentTarget.style.borderColor = design.buttons.primary.borderColorHover;
                e.currentTarget.style.color = design.buttons.primary.textColorHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = design.buttons.primary.backgroundColor;
                e.currentTarget.style.borderColor = design.buttons.primary.borderColor;
                e.currentTarget.style.color = design.buttons.primary.textColor;
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
