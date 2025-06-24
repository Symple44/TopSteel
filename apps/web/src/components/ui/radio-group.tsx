import React from "react"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
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

RadioGroup.displayName = "RadioGroup"

// Export des sous-composants courants si nécessaire
export const RadioGroupContent = RadioGroup
export const RadioGroupTrigger = RadioGroup  
export const RadioGroupItem = RadioGroup
export const RadioGroupValue = RadioGroup
export const RadioGroupHeader = RadioGroup
export const RadioGroupTitle = RadioGroup
export const RadioGroupDescription = RadioGroup
export const RadioGroupFooter = RadioGroup
export const RadioGroupSeparator = RadioGroup
export const RadioGroupList = RadioGroup
