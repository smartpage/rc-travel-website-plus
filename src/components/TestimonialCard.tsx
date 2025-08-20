import { useDesign } from "@/contexts/DesignContext";
import { Card, CardContent, CardHeader } from "./ui/card";

interface TestimonialCardProps {
  testimonial: {
    id: string;
    name: string;
    location: string;
    text: string;
    rating: number;
    image: string;
    categoryIds: string[];
  };
}

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  const { design } = useDesign();

  return (
    <Card className={`
      ${design.components?.primaryCards?.container?.base || ''}
      ${design.components?.primaryCards?.container?.border || ''}
      ${design.components?.primaryCards?.container?.rounded || ''}
      ${design.components?.primaryCards?.container?.shadow || ''}
      ${design.components?.primaryCards?.container?.transition || ''}
      ${design.components?.primaryCards?.container?.hover || ''}
      h-full flex flex-col p-3 @md:p-6
    `}>
      <CardHeader className="text-center pb-4 flex-shrink-0">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-${design.tokens?.colors?.primary}/20`}>
          <img
            src={testimonial.image}
            alt={testimonial.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/branding/identity.png";
            }}
          />
        </div>
        <h3 
          className={`${design.components?.primaryCards?.title?.fontSize || ''} ${design.components?.primaryCards?.title?.fontWeight || ''} ${design.components?.primaryCards?.title?.base || ''}`}
          style={{ fontFamily: design.tokens?.typography?.headings?.fontFamily }}
        >
          {testimonial.name}
        </h3>
        <p className={`${design.components?.primaryCards?.description?.fontSize || ''} ${design.components?.primaryCards?.description?.color || ''} text-sm`}>
          {testimonial.location}
        </p>
        <div className="flex justify-center space-x-1 mt-2">
          {[...Array(testimonial.rating)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 text-${design.tokens?.colors?.primary} fill-current`} viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow flex items-center">
        <p 
          className={`text-center italic ${design.components?.primaryCards?.description?.lineHeight || ''} ${design.components?.primaryCards?.description?.color || ''} ${design.components?.primaryCards?.description?.fontSize || ''}`}
          style={{ fontFamily: design.tokens?.typography?.body?.fontFamily }}
        >
          "{testimonial.text.length > 150 ? testimonial.text.slice(0, 150) + '…' : testimonial.text}"
        </p>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
