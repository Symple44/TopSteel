// packages/ui/src/components/tooltip.tsx
import * as React from 'react'
import { cn } from '../lib/utils'

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        {children}
      </div>
    )
  }
)

Tooltip.displayName = 'Tooltip'

const TooltipProvider = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
)

TooltipProvider.displayName = 'TooltipProvider'

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button ref={ref} className={cn('cursor-pointer', className)} {...props}>
    {children}
  </button>
))

TooltipTrigger.displayName = 'TooltipTrigger'

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: string }
>(({ className, side = 'top', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
      className
    )}
    data-side={side}
    {...props}
  />
))

TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent }
