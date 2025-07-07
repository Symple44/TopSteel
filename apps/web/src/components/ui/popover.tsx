import React from "react"

interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
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

Popover.displayName = "Popover"

// Export des sous-composants courants si nécessaire
export const _PopoverContent = Popover
export const _PopoverTrigger = Popover  
export const _PopoverItem = Popover
export const _PopoverValue = Popover
export const _PopoverHeader = Popover
export const _PopoverTitle = Popover
export const _PopoverDescription = Popover
export const _PopoverFooter = Popover
export const _PopoverSeparator = Popover
export const _PopoverList = Popover

