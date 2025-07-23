'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  className?: string
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  className?: string
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
}

interface DropdownMenuItemProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ asChild, className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext)

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ref,
        onClick: (e: React.MouseEvent) => {
          children.props.onClick?.(e)
          setOpen(!open)
        },
        'aria-expanded': open,
        'aria-haspopup': true,
      })
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup={true}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, align = 'center' }, ref) => {
    const { open, setOpen } = React.useContext(DropdownMenuContext)
    
    if (!open) return null

    return (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpen(false)}
        />
        <div
          ref={ref}
          className={cn(
            'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            align === 'end' && 'right-0',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            'top-full mt-1',
            className
          )}
        >
          {children}
        </div>
      </>
    )
  }
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, children, onClick, disabled, ...props }, ref) => {
    const { setOpen } = React.useContext(DropdownMenuContext)
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
          !disabled && 'hover:bg-accent hover:text-accent-foreground cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={(e) => {
          if (!disabled) {
            onClick?.()
            setOpen(false)
          }
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}