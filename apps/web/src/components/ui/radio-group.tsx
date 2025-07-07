import React from "react"

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
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
export const _RadioGroupContent = RadioGroup
export const _RadioGroupTrigger = RadioGroup  
export const _RadioGroupItem = RadioGroup
export const _RadioGroupValue = RadioGroup
export const _RadioGroupHeader = RadioGroup
export const _RadioGroupTitle = RadioGroup
export const _RadioGroupDescription = RadioGroup
export const _RadioGroupFooter = RadioGroup
export const _RadioGroupSeparator = RadioGroup
export const _RadioGroupList = RadioGroup

