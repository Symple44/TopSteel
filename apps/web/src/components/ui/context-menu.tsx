import React from "react"

interface ContextMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: unknown
  onValueChange?: unknown
  asChild?: boolean
  variant?: string
  size?: string
}

export const _ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
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

ContextMenu.displayName = "ContextMenu"

// Export des sous-composants courants si nécessaire
export const _ContextMenuContent = ContextMenu
export const _ContextMenuTrigger = ContextMenu  
export const _ContextMenuItem = ContextMenu
export const _ContextMenuValue = ContextMenu
export const _ContextMenuHeader = ContextMenu
export const _ContextMenuTitle = ContextMenu
export const _ContextMenuDescription = ContextMenu
export const _ContextMenuFooter = ContextMenu
export const _ContextMenuSeparator = ContextMenu
export const _ContextMenuList = ContextMenu

