import React from "react"

interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
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

HoverCard.displayName = "HoverCard"

// Export des sous-composants courants si nécessaire
export const _HoverCardContent = HoverCard
export const _HoverCardTrigger = HoverCard  
export const _HoverCardItem = HoverCard
export const _HoverCardValue = HoverCard
export const _HoverCardHeader = HoverCard
export const _HoverCardTitle = HoverCard
export const _HoverCardDescription = HoverCard
export const _HoverCardFooter = HoverCard
export const _HoverCardSeparator = HoverCard
export const _HoverCardList = HoverCard

