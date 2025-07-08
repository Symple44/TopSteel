import React from 'react'

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = '', children, asChild, ...props }, ref) => {
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

Separator.displayName = 'Separator'

// Export des sous-composants courants si nécessaire
export const SeparatorContent = Separator
export const SeparatorTrigger = Separator
export const SeparatorItem = Separator
export const SeparatorValue = Separator
export const SeparatorHeader = Separator
export const SeparatorTitle = Separator
export const SeparatorDescription = Separator
export const SeparatorFooter = Separator
export const SeparatorSeparator = Separator
export const SeparatorList = Separator
