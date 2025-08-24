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

  // Helper function to resolve token references
  const resolveTokenRef = (val: any): any => {
    if (typeof val !== 'string') return val;
    if (!val.startsWith('tokens.')) return val;
    try {
      const path = val.replace(/^tokens\./, '');
      const keys = path.split('.');
      let cur: any = design?.tokens || {};
      for (const k of keys) {
        if (cur && typeof cur === 'object' && k in cur) cur = cur[k]; else return undefined;
      }
      return cur ?? undefined;
    } catch { return undefined; }
  };

  return (
    <Card
      className={`
        ${design.components?.primaryCards?.container?.base ?? ''}
        ${design.components?.primaryCards?.container?.border ?? ''}
        ${design.components?.primaryCards?.container?.rounded ?? ''}
        ${design.components?.primaryCards?.container?.shadow ?? ''}
        ${design.components?.primaryCards?.container?.transition ?? ''}
        ${design.components?.primaryCards?.container?.hover ?? ''}
        flex flex-col p-3 @md:p-6
      `}
      data-card-type="testimonialCard"
      data-card-variant="standard"
      style={{
        backgroundColor: design.components?.testimonialCard?.backgroundColor,
        borderColor: design.components?.testimonialCard?.borderColor,
        borderWidth: design.components?.testimonialCard?.borderWidth,
        borderStyle: design.components?.testimonialCard?.borderStyle ?? 'solid',
        borderRadius: design.components?.testimonialCard?.borderRadius,
        boxShadow: design.components?.testimonialCard?.shadow,
        padding: design.components?.testimonialCard?.padding,
        minHeight: design.components?.testimonialCard?.minHeight,
        maxHeight: design.components?.testimonialCard?.maxHeight,
        maxWidth: design.components?.testimonialCard?.maxWidth,
        color: design.components?.testimonialCard?.textColor,
        transition: design.components?.testimonialCard?.transition ?? 'all 0.3s ease',
        position: 'relative'
      }}
    >
      {design.components?.testimonialCard?.background?.overlay?.color && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: design.components?.testimonialCard?.background?.overlay?.color,
            opacity: design.components?.testimonialCard?.background?.overlay?.opacity ?? 1,
            pointerEvents: 'none',
            borderRadius: design.components?.testimonialCard?.borderRadius
          }}
        />
      )}
      <CardHeader
        className="text-center pb-4 flex-shrink-0"
        style={{
          paddingBottom: resolveTokenRef(design.components?.testimonialCard?.headerSpacing)
        }}
      >
        <div
          className="mx-auto mb-4 rounded-full overflow-hidden"
          style={{
            width: resolveTokenRef(design.components?.testimonialCard?.avatarSize),
            height: resolveTokenRef(design.components?.testimonialCard?.avatarSize),
            border: `2px solid ${resolveTokenRef(design.tokens?.colors?.primary) ?? '#eab308'}20`,
            marginBottom: resolveTokenRef(design.components?.testimonialCard?.avatarSpacing)
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
            fontFamily: resolveTokenRef(design.tokens?.typography?.testimonialCardTitle?.fontFamily),
            fontSize: resolveTokenRef(design.tokens?.typography?.testimonialCardTitle?.fontSize),
            fontWeight: resolveTokenRef(design.tokens?.typography?.testimonialCardTitle?.fontWeight),
            color: resolveTokenRef(design.tokens?.typography?.testimonialCardTitle?.color),
            marginBottom: resolveTokenRef(design.components?.testimonialCard?.nameSpacing)
          }}
        >
          {testimonial.name}
        </h3>
        <p
          data-typography="testimonialCard.location"
          className="text-sm mb-3"
          style={{
            fontFamily: resolveTokenRef(design.tokens?.typography?.testimonialCardLocation?.fontFamily),
            fontSize: resolveTokenRef(design.tokens?.typography?.testimonialCardLocation?.fontSize),
            color: resolveTokenRef(design.tokens?.typography?.testimonialCardLocation?.color),
            marginBottom: resolveTokenRef(design.components?.testimonialCard?.locationSpacing)
          }}
        >
          {testimonial.location}
        </p>
        <div
          className="flex justify-center space-x-1"
          style={{
            marginTop: resolveTokenRef(design.components?.testimonialCard?.ratingSpacing)
          }}
        >
          {[...Array(testimonial.rating)].map((_, i) => (
            <svg
              key={i}
              className="fill-current"
              viewBox="0 0 20 20"
              style={{
                width: resolveTokenRef(design.components?.testimonialCard?.starSize),
                height: resolveTokenRef(design.components?.testimonialCard?.starSize),
                color: resolveTokenRef(design.components?.testimonialCard?.starColor)
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
          padding: resolveTokenRef(design.components?.testimonialCard?.contentPadding),
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <p
          data-typography="testimonialCard.body"
          className="text-center"
          style={{
            fontFamily: resolveTokenRef(design.tokens?.typography?.testimonialCardBody?.fontFamily),
            fontSize: resolveTokenRef(design.tokens?.typography?.testimonialCardBody?.fontSize),
            fontWeight: resolveTokenRef(design.tokens?.typography?.testimonialCardBody?.fontWeight),
            lineHeight: resolveTokenRef(design.tokens?.typography?.testimonialCardBody?.lineHeight),
            color: resolveTokenRef(design.tokens?.typography?.testimonialCardBody?.color),
            fontStyle: resolveTokenRef(design.components?.testimonialCard?.textStyle),
            maxWidth: resolveTokenRef(design.components?.testimonialCard?.maxTextWidth)
          }}
        >
          "{testimonial.text.length > 150 ? testimonial.text.slice(0, 150) + '…' : testimonial.text}"
        </p>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;
