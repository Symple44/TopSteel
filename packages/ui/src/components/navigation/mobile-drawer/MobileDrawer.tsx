'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface MobileDrawerProps {
  /** Whether the drawer is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Drawer content */
  children: React.ReactNode
  /** Position of the drawer */
  side?: 'left' | 'right'
  /** Custom class name for the content */
  className?: string
  /** Close button aria-label */
  closeLabel?: string
  /** Title for accessibility (screen readers) */
  title?: string
}

/**
 * MobileDrawer component for mobile navigation
 * Slides in from the side of the screen with backdrop
 */
export function MobileDrawer({
  open,
  onOpenChange,
  children,
  side = 'left',
  className,
  closeLabel = 'Fermer le menu',
  title = 'Menu de navigation',
}: MobileDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay/Backdrop */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* Drawer Content */}
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 h-full bg-background shadow-xl',
            'focus-visible:outline-none',
            // Animation based on side
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:duration-200 data-[state=open]:duration-300',
            side === 'left' && [
              'inset-y-0 left-0 w-[280px] max-w-[85vw]',
              'data-[state=closed]:slide-out-to-left',
              'data-[state=open]:slide-in-from-left',
            ],
            side === 'right' && [
              'inset-y-0 right-0 w-[280px] max-w-[85vw]',
              'data-[state=closed]:slide-out-to-right',
              'data-[state=open]:slide-in-from-right',
            ],
            className
          )}
        >
          {/* Screen reader title */}
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Navigation menu for mobile devices
          </DialogPrimitive.Description>

          {/* Close button */}
          <DialogPrimitive.Close
            className={cn(
              'absolute top-4 z-10',
              'inline-flex items-center justify-center rounded-md',
              'min-h-[44px] min-w-[44px]',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'transition-colors',
              side === 'left' ? 'right-2' : 'left-2'
            )}
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogPrimitive.Close>

          {/* Content */}
          <div className="h-full overflow-y-auto">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * MobileDrawerTrigger - Hamburger menu button to open drawer
 */
export interface MobileDrawerTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the drawer is currently open */
  isOpen?: boolean
  /** Label for accessibility */
  label?: string
}

export function MobileDrawerTrigger({
  isOpen,
  label = 'Ouvrir le menu',
  className,
  ...props
}: MobileDrawerTriggerProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={isOpen}
      className={cn(
        'inline-flex items-center justify-center',
        'min-h-[44px] min-w-[44px] p-2 rounded-md',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'transition-colors md:hidden', // Only visible on mobile
        className
      )}
      {...props}
    >
      {/* Hamburger icon */}
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={
            isOpen
              ? 'M6 18L18 6M6 6l12 12' // X icon when open
              : 'M4 6h16M4 12h16M4 18h16' // Hamburger when closed
          }
        />
      </svg>
    </button>
  )
}

export default MobileDrawer
