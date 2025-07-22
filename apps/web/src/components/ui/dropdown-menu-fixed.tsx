'use client'

import * as React from 'react'
import { DropdownFixed } from './dropdown-fixed'
import { cn } from '@/lib/utils'

interface DropdownMenuContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined)

const useDropdownMenuContext = () => {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('Dropdown menu components must be used within DropdownMenu')
  }
  return context
}

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DropdownMenu = ({ children, open, onOpenChange }: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, asChild = false, className, ...props }, ref) => {
  const { open, setOpen } = useDropdownMenuContext()
  
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => setOpen(!open),
      ref,
      ...props
    })
  }
  
  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  alignOffset?: number
  className?: string
}

const DropdownMenuContent = ({
  children,
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  alignOffset = 0,
  className
}: DropdownMenuContentProps) => {
  const { open, setOpen } = useDropdownMenuContext()
  
  // Trouver le trigger dans les enfants du parent
  const [trigger, setTrigger] = React.useState<HTMLElement | null>(null)
  const [content, setContent] = React.useState<React.ReactNode>(null)
  
  React.useEffect(() => {
    // Ce composant sera rendu dans le contexte du DropdownMenu
    // Il faut qu'il trouve son trigger et affiche le contenu
    setContent(
      <div className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        className
      )}>
        {children}
      </div>
    )
  }, [children, className])
  
  // Ce composant ne rend rien directement, le rendu est géré par DropdownMenuRoot
  return null
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

const DropdownMenuItem = ({
  children,
  onClick,
  className,
  disabled = false
}: DropdownMenuItemProps) => {
  const { setOpen } = useDropdownMenuContext()
  
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
      setOpen(false)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {children}
    </div>
  )
}

const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn('-mx-1 my-1 h-px bg-muted', className)} />
)

// Composant principal qui gère le rendu avec DropdownFixed
const DropdownMenuRoot = ({ children }: { children: React.ReactNode }) => {
  const [triggerElement, setTriggerElement] = React.useState<React.ReactElement | null>(null)
  const [contentElement, setContentElement] = React.useState<React.ReactElement | null>(null)
  
  // Analyser les enfants pour séparer trigger et content
  React.useEffect(() => {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === DropdownMenuTrigger) {
          setTriggerElement(child)
        } else if (child.type === DropdownMenuContent) {
          setContentElement(child)
        }
      }
    })
  }, [children])
  
  const { open, setOpen } = useDropdownMenuContext()
  
  if (!triggerElement || !contentElement) {
    return <>{children}</>
  }
  
  return (
    <DropdownFixed
      open={open}
      onOpenChange={setOpen}
      align={contentElement.props.align}
      side={contentElement.props.side}
      sideOffset={contentElement.props.sideOffset}
      alignOffset={contentElement.props.alignOffset}
      content={
        <div className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          contentElement.props.className
        )}>
          {contentElement.props.children}
        </div>
      }
    >
      {triggerElement.props.children}
    </DropdownFixed>
  )
}

// Export d'un wrapper qui combine DropdownMenu et DropdownMenuRoot
const DropdownMenuFixed = ({ children, open, onOpenChange }: DropdownMenuProps) => {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuRoot>
        {children}
      </DropdownMenuRoot>
    </DropdownMenu>
  )
}

export {
  DropdownMenuFixed as DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
}