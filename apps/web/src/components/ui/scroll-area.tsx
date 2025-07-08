import React from 'react'

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
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

ScrollArea.displayName = 'ScrollArea'

// Export des sous-composants courants si nécessaire
export const ScrollAreaContent = ScrollArea
export const ScrollAreaTrigger = ScrollArea
export const ScrollAreaItem = ScrollArea
export const ScrollAreaValue = ScrollArea
export const ScrollAreaHeader = ScrollArea
export const ScrollAreaTitle = ScrollArea
export const ScrollAreaDescription = ScrollArea
export const ScrollAreaFooter = ScrollArea
export const ScrollAreaSeparator = ScrollArea
export const ScrollAreaList = ScrollArea




