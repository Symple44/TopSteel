import React from 'react'

interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
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

Popover.displayName = 'Popover'

// Export des sous-composants courants si nécessaire
export const PopoverContent = Popover
export const PopoverTrigger = Popover
export const PopoverItem = Popover
export const PopoverValue = Popover
export const PopoverHeader = Popover
export const PopoverTitle = Popover
export const PopoverDescription = Popover
export const PopoverFooter = Popover
export const PopoverSeparator = Popover
export const PopoverList = Popover
