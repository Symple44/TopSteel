"use client"

import * as React from "react"
import { cn } from "../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn("inline-flex items-center justify-center rounded-md font-medium", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
