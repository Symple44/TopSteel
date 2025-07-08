import { cn } from '@/lib/utils'
import React from 'react'

interface CheckboxProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
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

Checkbox.displayName = 'Checkbox'

// Export des sous-composants courants si nécessaire
export const CheckboxContent = Checkbox
export const CheckboxTrigger = Checkbox
export const CheckboxItem = Checkbox
export const CheckboxValue = Checkbox
export const CheckboxHeader = Checkbox
export const CheckboxTitle = Checkbox
export const CheckboxDescription = Checkbox
export const CheckboxFooter = Checkbox
export const CheckboxSeparator = Checkbox
export const CheckboxList = Checkbox




