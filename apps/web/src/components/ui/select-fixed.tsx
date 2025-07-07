// Composant Select corrigé pour résoudre les erreurs TypeScript
import * as React from "react"
import { cn } from "@/lib/utils"

// Interface étendue pour Select
interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export const _Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, placeholder, value, onValueChange, ...props }, ref) => (
    <div ref={ref} className={cn("relative", className)} {...props}>
      {placeholder && !value && (
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
          {placeholder}
        </div>
      )}
      {children}
    </div>
  )
)
Select.displayName = "Select"

export const _SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <span className="ml-2">▼</span>
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

export const _SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block truncate", className)}
    {...props}
  >
    {children || placeholder}
  </span>
))
SelectValue.displayName = "SelectValue"

export const _SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectContent.displayName = "SelectContent"

export const _SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string }
>(({ className, children, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
      className
    )}
    data-value={value}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

