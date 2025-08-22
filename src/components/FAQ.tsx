import { useState } from 'react';
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useDesign } from '@/contexts/DesignContext';
import Section from '@/components/ui/Section';
import SectionTitle from '@/components/ui/SectionTitle';

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
  // First handle <p> tags, then <strong> tags within them
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
        <p key={pIndex} style={{ marginBottom: '1rem', ...paragraphStyle }}>
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
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="rounded-xl overflow-hidden border-none transition-all duration-300 group"
                style={{
                  backgroundColor: (design.components as any)?.faq?.card?.backgroundColor || 'transparent',
                  transition: 'all 0.3s ease'
                }}
                whileHover={{ 
                  y: -5
                }}
              >
                <motion.div
                  onClick={() => toggleItem(index)}
                  className="p-6 :p-8 cursor-pointer flex justify-between items-center"
                  style={{
                    backgroundColor: (design.components as any)?.faq?.card?.backgroundColor || 'transparent',
                    borderBottom: openIndex === index ? `2px solid ${design.tokens?.colors?.primary || '#eab308'}` : 'none'
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <span
                    data-typography="faq.question"
                    className="flex-1 pr-4 text-left"
                    style={{
                      fontFamily: design.tokens?.typography?.faqQuestion?.fontFamily || 'inherit',
                      fontSize: design.tokens?.typography?.faqQuestion?.fontSize || '1.125rem',
                      fontWeight: design.tokens?.typography?.faqQuestion?.fontWeight || 600,
                      lineHeight: design.tokens?.typography?.faqQuestion?.lineHeight || '1.4',
                      letterSpacing: design.tokens?.typography?.faqQuestion?.letterSpacing,
                      color: design.tokens?.typography?.faqQuestion?.color || ((design.components as any)?.faq?.card?.questionColor || '#ffffff')
                    }}
                  >
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 ml-4"
                  >
                    <div 
                      data-element="faqArrow"
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: design.components?.faq?.arrow?.backgroundColor || '#eab308' }}
                    >
                      <ChevronDown 
                        className="w-5 h-5" 
                        style={{ color: design.components?.faq?.arrow?.iconColor || '#000000' }}
                      />
                    </div>
                  </motion.div>
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
                        className="px-6 :px-8 py-8 :py-10 text-left"
                        data-typography="faq.answer"
                        style={{
                          backgroundColor: (design.components as any)?.faq?.card?.backgroundColor || 'transparent',
                          fontFamily: design.tokens?.typography?.faqAnswer?.fontFamily || 'inherit',
                          fontSize: design.tokens?.typography?.faqAnswer?.fontSize || '1rem',
                          fontWeight: design.tokens?.typography?.faqAnswer?.fontWeight || 400,
                          lineHeight: design.tokens?.typography?.faqAnswer?.lineHeight || '1.6',
                          letterSpacing: design.tokens?.typography?.faqAnswer?.letterSpacing,
                          color: design.tokens?.typography?.faqAnswer?.color || ((design.components as any)?.faq?.card?.answerColor || '#cbd5e1'),
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
                          'faq.answer',
                          'faq.answerStrong'
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
};

export default FAQ;
