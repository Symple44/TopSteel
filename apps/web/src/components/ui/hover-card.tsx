import React from 'react'

interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const HoverCard = React.forwardRef<HTMLDivElement, HoverCardProps>(
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

HoverCard.displayName = 'HoverCard'

// Export des sous-composants courants si nécessaire
export const HoverCardContent = HoverCard
export const HoverCardTrigger = HoverCard
export const HoverCardItem = HoverCard
export const HoverCardValue = HoverCard
export const HoverCardHeader = HoverCard
export const HoverCardTitle = HoverCard
export const HoverCardDescription = HoverCard
export const HoverCardFooter = HoverCard
export const HoverCardSeparator = HoverCard
export const HoverCardList = HoverCard
