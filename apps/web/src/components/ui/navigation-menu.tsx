import React from "react"

interface NavigationMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _NavigationMenu = React.forwardRef<HTMLDivElement, NavigationMenuProps>(
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

NavigationMenu.displayName = "NavigationMenu"

// Export des sous-composants courants si nécessaire
export const _NavigationMenuContent = NavigationMenu
export const _NavigationMenuTrigger = NavigationMenu  
export const _NavigationMenuItem = NavigationMenu
export const _NavigationMenuValue = NavigationMenu
export const _NavigationMenuHeader = NavigationMenu
export const _NavigationMenuTitle = NavigationMenu
export const _NavigationMenuDescription = NavigationMenu
export const _NavigationMenuFooter = NavigationMenu
export const _NavigationMenuSeparator = NavigationMenu
export const _NavigationMenuList = NavigationMenu

