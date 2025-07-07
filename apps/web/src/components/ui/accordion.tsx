import { cn } from "@/lib/utils"
import React from "react"

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
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

Accordion.displayName = "Accordion"

// Export des sous-composants courants si nécessaire
export const _AccordionContent = Accordion
export const _AccordionTrigger = Accordion  
export const _AccordionItem = Accordion
export const _AccordionValue = Accordion
export const _AccordionHeader = Accordion
export const _AccordionTitle = Accordion
export const _AccordionDescription = Accordion
export const _AccordionFooter = Accordion
export const _AccordionSeparator = Accordion
export const _AccordionList = Accordion


