'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Dialog principal avec support open/onOpenChange
interface DialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  return (
    <div data-state={open ? 'open' : 'closed'} className="relative z-50">
      {children}
    </div>
  )
}

Dialog.displayName = 'Dialog'

// DialogTrigger avec asChild support CORRIGÉ
interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children?: React.ReactNode
  className?: string
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      // Correction pour éviter l'erreur de ref avec cloneElement (TypeScript safe)
      const childProps = (children as any).props || {}

      return React.cloneElement(children as any, {
        ...props,
        ref: (children as any).ref || ref,
        className: cn(childProps.className, className),
      })
    }

    return (
      <button
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

DialogTrigger.displayName = 'DialogTrigger'

// DialogContent avec overlay
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div
          ref={ref}
          className={cn(
            'relative bg-background rounded-lg shadow-lg p-6 w-full max-w-lg',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)

DialogContent.displayName = 'DialogContent'

// DialogHeader
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

DialogHeader.displayName = 'DialogHeader'

// DialogTitle
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string
  children?: React.ReactNode
}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </h2>
    )
  }
)

DialogTitle.displayName = 'DialogTitle'

// DialogDescription
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string
  children?: React.ReactNode
}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}>
        {children}
      </p>
    )
  }
)

DialogDescription.displayName = 'DialogDescription'

// DialogFooter
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

DialogFooter.displayName = 'DialogFooter'

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
