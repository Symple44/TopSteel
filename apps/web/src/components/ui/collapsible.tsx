import React from 'react'
import { cn } from '@/lib/utils'

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ className = '', children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, {
        ...props,
        ref: (children as any).ref || ref,
        className: cn((children as any).props?.className, className),
      })
    }

    return (
      <div className={className} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Collapsible.displayName = 'Collapsible'

// Export des sous-composants courants si nécessaire
export const CollapsibleContent = Collapsible
export const CollapsibleTrigger = Collapsible
export const CollapsibleItem = Collapsible
export const CollapsibleValue = Collapsible
export const CollapsibleHeader = Collapsible
export const CollapsibleTitle = Collapsible
export const CollapsibleDescription = Collapsible
export const CollapsibleFooter = Collapsible
export const CollapsibleSeparator = Collapsible
export const CollapsibleList = Collapsible
