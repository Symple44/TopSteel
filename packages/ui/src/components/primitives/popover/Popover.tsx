'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const Popover: React.FC<PopoverProps> = ({ open, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isOpen = open !== undefined ? open : internalOpen
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [open, onOpenChange]
  )

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { setOpen } = React.useContext(PopoverContext)

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(true)
      onClick?.(event)
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn('outline-none', className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, children, align = 'center', side = 'bottom', sideOffset = 4, ...props }, _ref) => {
    const { open, setOpen } = React.useContext(PopoverContext)
    const contentRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }

      if (open) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }

      // Return undefined cleanup function when open is false
      return undefined
    }, [open, setOpen])

    if (!open) return null

    const positionClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2',
    }

    const alignmentClasses = {
      start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
      center:
        side === 'top' || side === 'bottom'
          ? 'left-1/2 -translate-x-1/2'
          : 'top-1/2 -translate-y-1/2',
      end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
    }

    return (
      <div
        ref={contentRef}
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          positionClasses[side],
          alignmentClasses[align],
          className
        )}
        style={{
          marginTop: side === 'bottom' ? sideOffset : undefined,
          marginBottom: side === 'top' ? sideOffset : undefined,
          marginLeft: side === 'right' ? sideOffset : undefined,
          marginRight: side === 'left' ? sideOffset : undefined,
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Popover.displayName = 'Popover'
PopoverTrigger.displayName = 'PopoverTrigger'
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent }
