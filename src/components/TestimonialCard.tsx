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
    <Card
      className={`
        ${design.components?.primaryCards?.container?.base || ''}
        ${design.components?.primaryCards?.container?.border || ''}
        ${design.components?.primaryCards?.container?.rounded || ''}
        ${design.components?.primaryCards?.container?.shadow || ''}
        ${design.components?.primaryCards?.container?.transition || ''}
        ${design.components?.primaryCards?.container?.hover || ''}
        h-full flex flex-col p-3 @md:p-6
      `}
      data-card-type="testimonialCard"
      data-card-variant="standard"
      style={{
        backgroundColor: design.components?.testimonialCard?.backgroundColor || 'transparent',
        borderColor: design.components?.testimonialCard?.borderColor || 'transparent',
        borderWidth: design.components?.testimonialCard?.borderWidth || '1px',
        borderRadius: design.components?.testimonialCard?.borderRadius || '0.5rem',
        boxShadow: design.components?.testimonialCard?.shadow || 'none',
        padding: design.components?.testimonialCard?.padding || '1rem 1.5rem',
        minHeight: design.components?.testimonialCard?.minHeight || 'auto'
      }}
    >
      <CardHeader
        className="text-center pb-4 flex-shrink-0"
        style={{
          paddingBottom: design.components?.testimonialCard?.headerSpacing || '1rem'
        }}
      >
        <div
          className="mx-auto mb-4 rounded-full overflow-hidden"
          style={{
            width: design.components?.testimonialCard?.avatarSize || '5rem',
            height: design.components?.testimonialCard?.avatarSize || '5rem',
            border: `2px solid ${design.tokens?.colors?.primary}20`,
            marginBottom: design.components?.testimonialCard?.avatarSpacing || '1rem'
          }}
        >
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
          data-typography="testimonialCard.title"
          className="mb-2"
          style={{
            fontFamily: design.tokens?.typography?.testimonialCardTitle?.fontFamily || design.tokens?.typography?.headings?.fontFamily,
            fontSize: design.tokens?.typography?.testimonialCardTitle?.fontSize || '1.125rem',
            fontWeight: design.tokens?.typography?.testimonialCardTitle?.fontWeight || '600',
            color: design.tokens?.typography?.testimonialCardTitle?.color || design.tokens?.colors?.text || '#1f2937',
            marginBottom: design.components?.testimonialCard?.nameSpacing || '0.5rem'
          }}
        >
          {testimonial.name}
        </h3>
        <p
          data-typography="testimonialCard.location"
          className="text-sm mb-3"
          style={{
            fontFamily: design.tokens?.typography?.testimonialCardLocation?.fontFamily || design.tokens?.typography?.body?.fontFamily,
            fontSize: design.tokens?.typography?.testimonialCardLocation?.fontSize || '0.875rem',
            color: design.tokens?.typography?.testimonialCardLocation?.color || '#6b7280',
            marginBottom: design.components?.testimonialCard?.locationSpacing || '0.75rem'
          }}
        >
          {testimonial.location}
        </p>
        <div
          className="flex justify-center space-x-1"
          style={{
            marginTop: design.components?.testimonialCard?.ratingSpacing || '0.5rem'
          }}
        >
          {[...Array(testimonial.rating)].map((_, i) => (
            <svg
              key={i}
              className="fill-current"
              viewBox="0 0 20 20"
              style={{
                width: design.components?.testimonialCard?.starSize || '1rem',
                height: design.components?.testimonialCard?.starSize || '1rem',
                color: design.components?.testimonialCard?.starColor || design.tokens?.colors?.primary || '#fbbf24'
              }}
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
            </svg>
          ))}
        </div>
      </CardHeader>
      
      <CardContent
        className="flex-grow flex items-center"
        style={{
          padding: design.components?.testimonialCard?.contentPadding || '1rem',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <p
          data-typography="testimonialCard.body"
          className="text-center"
          style={{
            fontFamily: design.tokens?.typography?.testimonialCardBody?.fontFamily || design.tokens?.typography?.body?.fontFamily,
            fontSize: design.tokens?.typography?.testimonialCardBody?.fontSize || '1rem',
            fontWeight: design.tokens?.typography?.testimonialCardBody?.fontWeight || '400',
            lineHeight: design.tokens?.typography?.testimonialCardBody?.lineHeight || '1.6',
            color: design.tokens?.typography?.testimonialCardBody?.color || design.tokens?.colors?.text || '#374151',
            fontStyle: design.components?.testimonialCard?.textStyle || 'italic',
            maxWidth: design.components?.testimonialCard?.maxTextWidth || 'none'
          }}
        >
          "{testimonial.text.length > 150 ? testimonial.text.slice(0, 150) + '…' : testimonial.text}"
        </p>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
