import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const containerVariants = cva(
  "mx-auto px-4",
  {
    variants: {
      size: {
        sm: "max-w-3xl",
        default: "max-w-6xl",
        lg: "max-w-7xl",
        xl: "max-w-screen-xl",
        full: "max-w-none",
      },
      padding: {
        none: "px-0",
        sm: "px-4",
        default: "px-6",
        lg: "px-8",
        xl: "px-12",
      },
    },
    defaultVariants: {
      size: "default",
      padding: "default",
    },
  }
)

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(containerVariants({ size, padding, className }))}
      {...props}
    />
  )
)
Container.displayName = "Container"

export { Container, containerVariants } 