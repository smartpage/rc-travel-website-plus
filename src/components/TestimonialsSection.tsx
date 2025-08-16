import { useDesign } from "@/contexts/DesignContext";
import { useContent } from "@/contexts/ContentContext";
import TabGrid from './TabGrid';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import SectionTitle from '@/components/ui/SectionTitle';
import Section from './ui/Section';

const TestimonialsSection = () => {
  const { design } = useDesign();
  const { getContentForComponent, siteIndex, loading, error } = useContent();
  const testimonials = getContentForComponent<any>('TestimonialsSection');

  const handleWhatsAppContact = (testimonialName: string) => {
    const message = encodeURIComponent(`Olá! Vi o testemunho de ${testimonialName} e gostaria de saber mais sobre os vossos serviços.`);
    window.open(`https://wa.me/351920201020?text=${message}`, '_blank');
  };

  // Get siteIndex section for Testimonials to access internalComponents
  const testimonialsSection = siteIndex?.sections.find(section => section.component === 'TestimonialsSection');

  if (loading || !testimonials) {
    return (
      <Section sectionId="testimonials" id="testimonials">
        <div className="text-center mb-16">
          <Skeleton height={20} width={250} className="mx-auto mb-2" />
          <Skeleton height={48} width={400} className="mx-auto mb-4" />
          <Skeleton height={20} width={600} className="mx-auto" />
        </div>
        <div className="grid grid-cols-1 @:grid-cols-2 @:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl border">
              <div className="text-center pb-4">
                <Skeleton circle height={80} width={80} className="mx-auto mb-4" />
                <Skeleton height={20} width={120} className="mx-auto mb-2" />
                <Skeleton height={16} width={80} className="mx-auto" />
              </div>
              <Skeleton height={16} count={3} className="mb-2" />
            </div>
          ))}
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section sectionId="testimonials" id="testimonials">
        <div className="text-center py-20">
          <p className="text-lg text-red-600">Erro ao carregar testemunhos: {error}</p>
        </div>
      </Section>
    );
  }

  if (!testimonials) {
    return null; // Content is not available for this section
  }

  return (
    <Section sectionId="testimonials" id="testimonials">
      <div className="text-center mb-16">
        <SectionTitle 
          subtitle={testimonials.preTitle}
          title={testimonials.title}
          description={testimonials.description}
          centerAlign={true}
        />
      </div>

      {/* Use modular TabGrid component */}
      {testimonialsSection?.internalComponents?.map((component, index) => {
        if (component.type === 'TabGrid') {
          return (
            <TabGrid
              key={`${component.name}-${index}`}
              contentFile={component.contentFile}
              showTabsNavigation={component.showTabsNavigation}
              cardType={component.cardType}
              useSlider={component.useSlider}
              gridLayout={component.gridLayout}
              onWhatsAppContact={handleWhatsAppContact}
            />
          );
        }
        return null;
      })}
    </Section>
  );
};

export default TestimonialsSection;
