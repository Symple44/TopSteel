import React from 'react'

interface NavigationMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const NavigationMenu = React.forwardRef<HTMLDivElement, NavigationMenuProps>(
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

NavigationMenu.displayName = 'NavigationMenu'

// Export des sous-composants courants si nécessaire
export const NavigationMenuContent = NavigationMenu
export const NavigationMenuTrigger = NavigationMenu
export const NavigationMenuItem = NavigationMenu
export const NavigationMenuValue = NavigationMenu
export const NavigationMenuHeader = NavigationMenu
export const NavigationMenuTitle = NavigationMenu
export const NavigationMenuDescription = NavigationMenu
export const NavigationMenuFooter = NavigationMenu
export const NavigationMenuSeparator = NavigationMenu
export const NavigationMenuList = NavigationMenu
