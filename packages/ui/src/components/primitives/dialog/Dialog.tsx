/**
 * 🎯 DIALOG UNIFIÉ - TOPSTEEL ERP
 * Composant Dialog robuste basé sur Radix UI avec variants du design system
 * Migration et amélioration de la version packages/ui/feedback
 */

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// ===== VARIANTS UNIFIÉS =====

/**
 * Variants pour Dialog Content
 */
const dialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] max-h-[95vh]',
      },
      variant: {
        default: 'border-border',
        elevated: 'border-border shadow-xl',
        centered: 'items-center justify-center',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

const dialogOverlayVariants = cva(
  'fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  {
    variants: {
      variant: {
        default: 'bg-black/80',
        blur: 'bg-black/50 backdrop-blur-sm',
        dark: 'bg-black/90',
        light: 'bg-white/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// ===== TYPES =====

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Masquer le bouton de fermeture
   * @default false
   */
  hideCloseButton?: boolean
  /**
   * Classe CSS pour le bouton de fermeture
   */
  closeButtonClassName?: string
}

export interface DialogOverlayProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>,
    VariantProps<typeof dialogOverlayVariants> {}

// ===== COMPOSANTS PRINCIPAUX =====

/**
 * Racine du Dialog - Radix UI Root
 */
const Dialog = DialogPrimitive.Root

/**
 * Trigger du Dialog - Radix UI Trigger
 */
const DialogTrigger = DialogPrimitive.Trigger

/**
 * Portal du Dialog - Radix UI Portal
 */
const DialogPortal = DialogPrimitive.Portal

/**
 * Bouton Close du Dialog - Radix UI Close
 */
const DialogClose = DialogPrimitive.Close

/**
 * Overlay du Dialog avec variants
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  DialogOverlayProps
>(({ className, variant, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(dialogOverlayVariants({ variant }), className)}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * Contenu du Dialog avec variants et tailles
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    { className, children, size, variant, hideCloseButton = false, closeButtonClassName, ...props },
    ref
  ) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ size, variant }), className)}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
              closeButtonClassName
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
)
DialogContent.displayName = DialogPrimitive.Content.displayName

// ===== COMPOSANTS DE LAYOUT =====

/**
 * Header du Dialog
 */
const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  )
)
DialogHeader.displayName = 'DialogHeader'

/**
 * Footer du Dialog
 */
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  )
)
DialogFooter.displayName = 'DialogFooter'

/**
 * Titre du Dialog - Radix UI Title avec styles
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * Description du Dialog - Radix UI Description avec styles
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// ===== EXPORTS =====

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogContentVariants,
  dialogOverlayVariants,
}

// Types déjà exportés avec les interfaces ci-dessus
