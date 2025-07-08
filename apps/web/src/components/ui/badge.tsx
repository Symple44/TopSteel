import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
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

Badge.displayName = 'Badge'

// Export des sous-composants courants si nécessaire
export const BadgeContent = Badge
export const BadgeTrigger = Badge
export const BadgeItem = Badge
export const BadgeValue = Badge
export const BadgeHeader = Badge
export const BadgeTitle = Badge
export const BadgeDescription = Badge
export const BadgeFooter = Badge
export const BadgeSeparator = Badge
export const BadgeList = Badge




