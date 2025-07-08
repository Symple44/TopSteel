import React from 'react'

interface ContextMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const ContextMenu = React.forwardRef<HTMLDivElement, ContextMenuProps>(
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

ContextMenu.displayName = 'ContextMenu'

// Export des sous-composants courants si nécessaire
export const ContextMenuContent = ContextMenu
export const ContextMenuTrigger = ContextMenu
export const ContextMenuItem = ContextMenu
export const ContextMenuValue = ContextMenu
export const ContextMenuHeader = ContextMenu
export const ContextMenuTitle = ContextMenu
export const ContextMenuDescription = ContextMenu
export const ContextMenuFooter = ContextMenu
export const ContextMenuSeparator = ContextMenu
export const ContextMenuList = ContextMenu




