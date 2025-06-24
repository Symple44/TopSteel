import React from "react"

interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
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

Select.displayName = "Select"

// Export des sous-composants courants si nécessaire
export const SelectContent = Select
export const SelectTrigger = Select  
export const SelectItem = Select
export const SelectValue = Select
export const SelectHeader = Select
export const SelectTitle = Select
export const SelectDescription = Select
export const SelectFooter = Select
export const SelectSeparator = Select
export const SelectList = Select
