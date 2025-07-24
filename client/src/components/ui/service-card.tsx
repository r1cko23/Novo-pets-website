import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { cn } from "@/lib/utils"

const serviceCardVariants = cva(
  "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
  {
    variants: {
      variant: {
        default: "bg-card border-border",
        glass: "backdrop-blur-md bg-white/20 border-white/30 shadow-glass",
        brand: "bg-gradient-to-br from-brand-light/50 to-white border-brand-primary/20 shadow-brand",
        elevated: "shadow-lg hover:shadow-xl transition-shadow duration-300",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ServiceCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof serviceCardVariants> {
  title: string
  description: string
  price?: string
  duration?: string
  image?: string
  features?: string[]
  badge?: string
  ctaText?: string
  onCtaClick?: () => void
  popular?: boolean
}

const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    title, 
    description, 
    price, 
    duration, 
    image, 
    features = [], 
    badge, 
    ctaText = "Book Now", 
    onCtaClick,
    popular = false,
    ...props 
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.3 }}
        className={cn("relative", className)}
        {...props}
      >
        {popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <Badge variant="brand" className="px-3 py-1 text-xs">
              Most Popular
            </Badge>
          </div>
        )}
        
        <Card variant={variant} className={cn(serviceCardVariants({ variant, size }))}>
          {image && (
            <div className="relative h-48 overflow-hidden rounded-t-lg">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
          
          <CardHeader className={cn(image && "pt-6")}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold text-foreground">
                  {title}
                </CardTitle>
                {badge && (
                  <Badge variant="outline" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-muted-foreground leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {(price || duration) && (
              <div className="flex items-center justify-between text-sm">
                {price && (
                  <span className="font-semibold text-brand-primary text-lg">
                    {price}
                  </span>
                )}
                {duration && (
                  <span className="text-muted-foreground">
                    ⏱️ {duration}
                  </span>
                )}
              </div>
            )}
            
            {features.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Includes:</h4>
                <ul className="space-y-1">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-brand-primary rounded-full mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <Button 
              variant="brand" 
              size="sm" 
              className="w-full rounded-full"
              onClick={onCtaClick}
            >
              {ctaText}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }
)
ServiceCard.displayName = "ServiceCard"

export { ServiceCard, serviceCardVariants } 