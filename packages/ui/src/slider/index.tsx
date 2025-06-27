"use client"
import * as React from "react"
import { cn } from "../lib/utils"

export const Slider = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex w-full touch-none select-none items-center", className)} {...props} />
  )
)
Slider.displayName = "Slider"
