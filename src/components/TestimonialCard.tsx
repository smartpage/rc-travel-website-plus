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
      ${design.primaryCards.container.base}
      ${design.primaryCards.container.border}
      ${design.primaryCards.container.rounded}
      ${design.primaryCards.container.shadow}
      ${design.primaryCards.container.transition}
      ${design.primaryCards.container.hover}
      h-full flex flex-col p-6
    `}>
      <CardHeader className="text-center pb-4 flex-shrink-0">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-${design.colors.primary}/20`}>
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
          className={`${design.primaryCards.title.fontSize} ${design.primaryCards.title.fontWeight} ${design.primaryCards.title.base}`}
          style={{ fontFamily: design.fonts.title }}
        >
          {testimonial.name}
        </h3>
        <p className={`${design.primaryCards.description.fontSize} ${design.primaryCards.description.color} text-sm`}>
          {testimonial.location}
        </p>
        <div className="flex justify-center space-x-1 mt-2">
          {[...Array(testimonial.rating)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 text-${design.colors.primary} fill-current`} viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow flex items-center">
        <p 
          className={`text-center italic ${design.primaryCards.description.lineHeight} ${design.primaryCards.description.color} ${design.primaryCards.description.fontSize}`}
          style={{ fontFamily: design.fonts.body }}
        >
          "{testimonial.text.length > 150 ? testimonial.text.slice(0, 150) + '…' : testimonial.text}"
        </p>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
