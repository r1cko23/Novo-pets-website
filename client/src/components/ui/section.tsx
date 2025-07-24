import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sectionVariants = cva(
  "w-full",
  {
    variants: {
      spacing: {
        none: "py-0",
        sm: "py-8",
        default: "py-16",
        lg: "py-24",
        xl: "py-32",
      },
      background: {
        default: "bg-background",
        muted: "bg-muted",
        brand: "bg-gradient-to-br from-brand-light/30 to-background",
        glass: "backdrop-blur-sm bg-white/10",
        dark: "bg-foreground text-background",
      },
    },
    defaultVariants: {
      spacing: "default",
      background: "default",
    },
  }
)

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: React.ElementType
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing, background, as: Component = "section", ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(sectionVariants({ spacing, background, className }))}
      {...props}
    />
  )
)
Section.displayName = "Section"

export { Section, sectionVariants } 