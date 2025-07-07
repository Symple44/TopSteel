import React from "react"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
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

Badge.displayName = "Badge"

// Export des sous-composants courants si nécessaire
export const _BadgeContent = Badge
export const _BadgeTrigger = Badge  
export const _BadgeItem = Badge
export const _BadgeValue = Badge
export const _BadgeHeader = Badge
export const _BadgeTitle = Badge
export const _BadgeDescription = Badge
export const _BadgeFooter = Badge
export const _BadgeSeparator = Badge
export const _BadgeList = Badge

