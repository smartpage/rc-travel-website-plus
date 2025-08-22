import * as React from "react"
import { Square } from "lucide-react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // Check if we're in design mode
  const isDesignMode = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('design') === '1' || urlParams.get('design') === 'true';
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm relative group",
        className
      )}
      data-card
      {...props}
    >
      {/* Card selection overlay - appears on hover in design mode */}
      {isDesignMode && (
        <div className="absolute inset-0 border-2 border-blue-500/30 bg-blue-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10" />
      )}
      
      {/* Card selection icon badge - only visible on hover in design mode */}
      {isDesignMode && (
        <div 
          className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer z-20 hover:bg-blue-600 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
          data-card-selector
          role="button"
          aria-label="Select card"
          tabIndex={0}
          title="Select card"
        >
          <Square className="w-3 h-3" strokeWidth={3} />
        </div>
      )}

      {/* Actual card content */}
      {props.children}
    </div>
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
