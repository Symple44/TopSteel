import React from "react"

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ className = "", children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, { ...props, ref })
    }
    
    return (
      <div className={className} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Tooltip.displayName = "Tooltip"

// Export des sous-composants courants si nécessaire
export const TooltipContent = Tooltip
export const TooltipTrigger = Tooltip  
export const TooltipItem = Tooltip
export const TooltipValue = Tooltip
export const TooltipHeader = Tooltip
export const TooltipTitle = Tooltip
export const TooltipDescription = Tooltip
export const TooltipFooter = Tooltip
export const TooltipSeparator = Tooltip
export const TooltipList = Tooltip
