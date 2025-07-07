import React from "react"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
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

Separator.displayName = "Separator"

// Export des sous-composants courants si nécessaire
export const _SeparatorContent = Separator
export const _SeparatorTrigger = Separator  
export const _SeparatorItem = Separator
export const _SeparatorValue = Separator
export const _SeparatorHeader = Separator
export const _SeparatorTitle = Separator
export const _SeparatorDescription = Separator
export const _SeparatorFooter = Separator
export const _SeparatorSeparator = Separator
export const _SeparatorList = Separator

