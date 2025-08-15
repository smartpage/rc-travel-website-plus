import React from 'react';
import { useDesign } from '@/contexts/DesignContext';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './card'; // Import base card components

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'inverted' | 'travel';
  hasBorder?: boolean;
  isRounded?: boolean;
  children: React.ReactNode;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ variant = 'primary', hasBorder = true, isRounded = true, className, children, ...props }, ref) => {
    const { design } = useDesign();
    const styles = design.cardStyles[variant];

    const cardClasses = cn(
      styles.base,
      isRounded && styles.rounded,
      hasBorder && styles.borderWidth,
      hasBorder && styles.borderColor,
      styles.shadow,
      className
    );

    return (
      <Card ref={ref} className={cardClasses} {...props}>
        {children}
      </Card>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';

export { FeatureCard, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };
