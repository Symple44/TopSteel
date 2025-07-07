import React from "react"

interface MenubarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _Menubar = React.forwardRef<HTMLDivElement, MenubarProps>(
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

Menubar.displayName = "Menubar"

// Export des sous-composants courants si nécessaire
export const _MenubarContent = Menubar
export const _MenubarTrigger = Menubar  
export const _MenubarItem = Menubar
export const _MenubarValue = Menubar
export const _MenubarHeader = Menubar
export const _MenubarTitle = Menubar
export const _MenubarDescription = Menubar
export const _MenubarFooter = Menubar
export const _MenubarSeparator = Menubar
export const _MenubarList = Menubar

