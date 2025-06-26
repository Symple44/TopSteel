"use client"

import * as React from "react"
import { cn } from "./lib/utils"

interface SelectProps {
  children?: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative", className)} {...props}>
      {children}
    </div>
  )
)
Select.displayName = "Select"

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

export const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => (
  <span ref={ref} className={cn("block truncate", className)} {...props}>
    {children || placeholder}
  </span>
))
SelectValue.displayName = "SelectValue"

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1", className)}
    {...props}
  >
    {children}
  </div>
))
SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm", className)}
    data-value={value}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"
