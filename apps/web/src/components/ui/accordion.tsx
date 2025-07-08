import React from 'react'
import { cn } from '@/lib/utils'

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
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

Accordion.displayName = 'Accordion'

// Export des sous-composants courants si nécessaire
export const AccordionContent = Accordion
export const AccordionTrigger = Accordion
export const AccordionItem = Accordion
export const AccordionValue = Accordion
export const AccordionHeader = Accordion
export const AccordionTitle = Accordion
export const AccordionDescription = Accordion
export const AccordionFooter = Accordion
export const AccordionSeparator = Accordion
export const AccordionList = Accordion
