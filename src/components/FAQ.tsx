import { useState } from 'react';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useDesign } from '@/contexts/DesignContext';
import Section from '@/components/ui/Section';
import SectionTitle from '@/components/ui/SectionTitle';
import { Card } from '@/components/ui/card';

interface FAQItem {
  question: string;
  answer: string;
}

// Safe function to parse <strong> and <p> tags and apply tokenized styles
const parseHtmlTags = (
  text: string,
  paragraphStyle?: React.CSSProperties,
  strongStyle?: React.CSSProperties,
  paragraphDataAttr: string = 'faq.answer',
  strongDataAttr: string = 'faq.answerStrong'
): React.ReactNode[] => {
  // If no <p> tags are present, wrap the entire content in a single paragraph
  if (!/<\s*p\s*>/i.test(text)) {
    const strongParts = text.split(/(<strong>.*?<\/strong>)/g);
    const parsed = strongParts.map((strongPart, sIndex) => {
      if (strongPart.startsWith('<strong>') && strongPart.endsWith('</strong>')) {
        const strongContent = strongPart.replace(/<\/?strong>/g, '');
        return <strong key={`s-${sIndex}`} style={strongStyle} data-typography={strongDataAttr}>{strongContent}</strong>;
      }
      return strongPart;
    });
    return [
      <p key={0} data-typography={paragraphDataAttr} style={{ marginBottom: '1rem', ...paragraphStyle }}>
        {parsed}
      </p>
    ];
  }

  // Otherwise, handle existing <p> tags, then <strong> tags within them
  const paragraphParts = text.split(/(<p>.*?<\/p>)/gs);
  
  return paragraphParts.map((part, pIndex) => {
    if (part.startsWith('<p>') && part.endsWith('</p>')) {
      const pContent = part.replace(/<\/?p>/g, '');
      
      // Parse <strong> tags within the paragraph content
      const strongParts = pContent.split(/(<strong>.*?<\/strong>)/g);
      const parsedPContent = strongParts.map((strongPart, sIndex) => {
        if (strongPart.startsWith('<strong>') && strongPart.endsWith('</strong>')) {
          const strongContent = strongPart.replace(/<\/?strong>/g, '');
          return <strong key={sIndex} style={strongStyle}>{strongContent}</strong>;
        }
        return strongPart;
      });

      return (
        <p key={pIndex} data-typography={paragraphDataAttr} style={{ marginBottom: '1rem', ...paragraphStyle }}>
          {parsedPContent}
        </p>
      );
    } else {
      // Parse <strong> tags in non-paragraph content
      const strongParts = part.split(/(<strong>.*?<\/strong>)/g);
      return strongParts.map((strongPart, sIndex) => {
        if (strongPart.startsWith('<strong>') && strongPart.endsWith('</strong>')) {
          const strongContent = strongPart.replace(/<\/?strong>/g, '');
          return <strong key={`${pIndex}-${sIndex}`} style={strongStyle}>{strongContent}</strong>;
        }
        return strongPart;
      });
    }
  }).flat();
};

const FAQ = () => {
  const { design } = useDesign();
  const { getContentForComponent } = useContent();
  const faqContent = getContentForComponent<{
    title: string;
    description: string;
    items: FAQItem[];
  }>('FAQ');
  
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  // Função para renderizar o conteúdo HTML
  const renderTitle = (htmlContent: string) => {
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  if (!faqContent?.items) {
    return null;
  }

  return (
    <Section sectionId="faq">
      <div className="w-full max-w-5xl mx-auto h-full flex flex-col justify-center items-center text-center">
        {/* Header */}
        <div className="mb-12 :mb-16">
          {/* Force heading semantics for resolver */}
          <SectionTitle
            variant="headings"
            useHtmlRendering={true}
            title={faqContent?.title || "Perguntas Frequentes"}
            description={faqContent?.description || "Respostas para as dúvidas mais comuns sobre os nossos serviços."}
          />
        </div>
        
        {/* FAQ Cards */}
        <div className="w-[98%] :w-full max-w-4xl mx-auto space-y-6">
          {faqContent.items.map((item, index) => {
            return (
              <Card 
                key={index}
                className={design.components?.faqCard?.container?.className || "shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"}
                style={{
                  backgroundColor: design.components?.faqCard?.container?.backgroundColor,
                  borderColor: design.components?.faqCard?.container?.borderColor,
                  borderWidth: design.components?.faqCard?.container?.borderWidth,
                  borderRadius: design.components?.faqCard?.container?.borderRadius,
                  boxShadow: design.components?.faqCard?.container?.shadow,
                  transition: design.components?.faqCard?.container?.transition || 'all 0.3s ease'
                }}
                data-card-type="faqCard"
                data-card-variant="standard"
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ 
                    y: -5
                  }}
                >
                  <motion.div
                    onClick={() => toggleItem(index)}
                  className={design.components?.faqCard?.question?.className || "p-6 cursor-pointer flex justify-between items-center"}
                  style={{
                    backgroundColor: design.components?.faqCard?.question?.backgroundColor,
                    padding: design.components?.faqCard?.question?.padding,
                    borderBottom: openIndex === index ? `${design.components?.faqCard?.divider?.width || '2px'} ${design.components?.faqCard?.divider?.style || 'solid'} ${design.components?.faqCard?.divider?.color || design.tokens?.colors?.primary || '#FF69B4'}` : 'none'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <span
                    data-typography="faqCardQuestion"
                    className="flex-1 pr-4 text-left"
                    style={{
                      fontFamily: design.tokens?.typography?.faqCardQuestion?.fontFamily,
                      fontSize: design.tokens?.typography?.faqCardQuestion?.fontSize,
                      fontWeight: design.tokens?.typography?.faqCardQuestion?.fontWeight,
                      lineHeight: design.tokens?.typography?.faqCardQuestion?.lineHeight,
                      letterSpacing: design.tokens?.typography?.faqCardQuestion?.letterSpacing,
                      color: design.tokens?.typography?.faqCardQuestion?.color
                    }}
                  >
                    {item.question}
                  </span>
                                      <div className="flex-shrink-0">
                      <div
                      className={design.components?.faqCard?.chevron?.className || "w-10 h-10 rounded-full flex items-center justify-center ml-4"}
                      style={{ 
                        backgroundColor: design.components?.faqCard?.chevron?.backgroundColor || '#FF69B4',
                        width: design.components?.faqCard?.chevron?.size || '2.5rem',
                        height: design.components?.faqCard?.chevron?.size || '2.5rem'
                      }}
                    >
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown 
                          className={design.components?.faqCard?.chevron?.iconSize || "w-5 h-5"}
                          style={{ color: design.components?.faqCard?.chevron?.iconColor || '#000000' }}
                        />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div 
                        data-typography="faqCardAnswer"
                        className={design.components?.faqCard?.answer?.className || "p-6"}
                        style={{
                          backgroundColor: design.components?.faqCard?.answer?.backgroundColor,
                          padding: design.components?.faqCard?.answer?.padding,
                          textAlign: design.components?.faqCard?.answer?.textAlign || 'left',
                          fontFamily: design.tokens?.typography?.faqCardAnswer?.fontFamily || 'inherit',
                          fontSize: design.tokens?.typography?.faqCardAnswer?.fontSize || '1rem',
                          fontWeight: design.tokens?.typography?.faqCardAnswer?.fontWeight || 400,
                          lineHeight: design.tokens?.typography?.faqCardAnswer?.lineHeight || '1.6',
                          letterSpacing: design.tokens?.typography?.faqCardAnswer?.letterSpacing,
                          color: design.tokens?.typography?.faqCardAnswer?.color,
                        }}
                      >
                        {parseHtmlTags(
                          item.answer,
                          {
                            // Remove individual paragraph styling since it's now applied to the parent
                          },
                          {
                            fontFamily: design.typography?.faqAnswerStrong?.fontFamily || 'inherit',
                            fontSize: design.typography?.faqAnswerStrong?.fontSize,
                            fontWeight: design.typography?.faqAnswerStrong?.fontWeight || 700,
                            lineHeight: design.typography?.faqAnswerStrong?.lineHeight,
                            letterSpacing: design.typography?.faqAnswerStrong?.letterSpacing,
                            color: design.typography?.faqAnswerStrong?.color,
                          },
                          'faqCardAnswer',
                          'faq.answerStrong'
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </motion.div>
              </Card>
            );
          })}
        </div>
      </div>
    </Section>
  );
};

export default FAQ;
