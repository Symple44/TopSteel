import React from 'react'

interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(
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

Menubar.displayName = 'Menubar'

// Export des sous-composants courants si nécessaire
export const MenubarContent = Menubar
export const MenubarTrigger = Menubar
export const MenubarItem = Menubar
export const MenubarValue = Menubar
export const MenubarHeader = Menubar
export const MenubarTitle = Menubar
export const MenubarDescription = Menubar
export const MenubarFooter = Menubar
export const MenubarSeparator = Menubar
export const MenubarList = Menubar




