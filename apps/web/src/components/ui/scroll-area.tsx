import React from "react"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
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

ScrollArea.displayName = "ScrollArea"

// Export des sous-composants courants si nécessaire
export const _ScrollAreaContent = ScrollArea
export const _ScrollAreaTrigger = ScrollArea  
export const _ScrollAreaItem = ScrollArea
export const _ScrollAreaValue = ScrollArea
export const _ScrollAreaHeader = ScrollArea
export const _ScrollAreaTitle = ScrollArea
export const _ScrollAreaDescription = ScrollArea
export const _ScrollAreaFooter = ScrollArea
export const _ScrollAreaSeparator = ScrollArea
export const _ScrollAreaList = ScrollArea

