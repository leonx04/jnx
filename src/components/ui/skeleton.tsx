import { cn } from "@/lib/utils"
import * as React from "react"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "rounded" | "circular"
  width?: string | number
  height?: string | number
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "default", width, height, ...props }, ref) => {
    const variantClasses = {
      default: "rounded",
      rounded: "rounded-md",
      circular: "rounded-full",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-muted",
          variantClasses[variant],
          className
        )}
        style={{
          width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
          height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
        }}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }

