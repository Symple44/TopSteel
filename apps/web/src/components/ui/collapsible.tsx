import { cn } from "@/lib/utils"
import React from "react"

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ className = "", children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, { 
        ...props, 
        ref: (children as any).ref || ref,
        className: cn((children as any).props?.className, className)
      })
    }
    
    return (
      <div className={className} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Collapsible.displayName = "Collapsible"

// Export des sous-composants courants si nécessaire
export const _CollapsibleContent = Collapsible
export const _CollapsibleTrigger = Collapsible  
export const _CollapsibleItem = Collapsible
export const _CollapsibleValue = Collapsible
export const _CollapsibleHeader = Collapsible
export const _CollapsibleTitle = Collapsible
export const _CollapsibleDescription = Collapsible
export const _CollapsibleFooter = Collapsible
export const _CollapsibleSeparator = Collapsible
export const _CollapsibleList = Collapsible


