import * as React from 'react'
import { type SidebarVariants, sidebarVariants } from '../../../lib/design-system'
import { cn } from '../../../lib/utils'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, SidebarVariants {
  children: React.ReactNode
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <aside
      ref={ref}
      className={cn(sidebarVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </aside>
  )
)
Sidebar.displayName = 'Sidebar'

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex h-16 items-center justify-between px-4 border-b', className)}
      {...props}
    />
  )
)
SidebarHeader.displayName = 'SidebarHeader'

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 overflow-y-auto p-4', className)}
      {...props}
    />
  )
)
SidebarContent.displayName = 'SidebarContent'

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-t p-4', className)}
      {...props}
    />
  )
)
SidebarFooter.displayName = 'SidebarFooter'

const SidebarNav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn('space-y-1', className)}
      {...props}
    />
  )
)
SidebarNav.displayName = 'SidebarNav'

interface SidebarNavItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  isActive?: boolean
  children: React.ReactNode
}

const SidebarNavItem = React.forwardRef<HTMLButtonElement, SidebarNavItemProps>(
  ({ className, icon, isActive, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isActive && 'bg-accent text-accent-foreground',
        className
      )}
      {...props}
    >
      {icon && <span className="flex h-4 w-4 items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  )
)
SidebarNavItem.displayName = 'SidebarNavItem'

const SidebarSection = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('space-y-2', className)}
      {...props}
    />
  )
)
SidebarSection.displayName = 'SidebarSection'

const SidebarSectionTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider', className)}
      {...props}
    />
  )
)
SidebarSectionTitle.displayName = 'SidebarSectionTitle'

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  SidebarSection,
  SidebarSectionTitle,
}