import React from "react"

interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
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

DropdownMenu.displayName = "DropdownMenu"

// Export des sous-composants courants si nécessaire
export const DropdownMenuContent = DropdownMenu
export const DropdownMenuTrigger = DropdownMenu  
export const DropdownMenuItem = DropdownMenu
export const DropdownMenuValue = DropdownMenu
export const DropdownMenuHeader = DropdownMenu
export const DropdownMenuTitle = DropdownMenu
export const DropdownMenuDescription = DropdownMenu
export const DropdownMenuFooter = DropdownMenu
export const DropdownMenuSeparator = DropdownMenu
export const DropdownMenuList = DropdownMenu
