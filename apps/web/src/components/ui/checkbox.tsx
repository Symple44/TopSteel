import { cn } from "@/lib/utils"
import React from "react"

interface CheckboxProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
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

Checkbox.displayName = "Checkbox"

// Export des sous-composants courants si nécessaire
export const _CheckboxContent = Checkbox
export const _CheckboxTrigger = Checkbox  
export const _CheckboxItem = Checkbox
export const _CheckboxValue = Checkbox
export const _CheckboxHeader = Checkbox
export const _CheckboxTitle = Checkbox
export const _CheckboxDescription = Checkbox
export const _CheckboxFooter = Checkbox
export const _CheckboxSeparator = Checkbox
export const _CheckboxList = Checkbox


