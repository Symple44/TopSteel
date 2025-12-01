/**
 * 🎯 DIALOG UNIFIÉ - TOPSTEEL ERP
 * Composant Dialog robuste basé sur Radix UI
 * Utilise les variants centralisés du design system
 */

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'
import {
  dialogOverlayVariants,
  dialogContentVariants,
  dialogHeaderVariants,
  dialogFooterVariants,
  dialogTitleVariants,
  dialogDescriptionVariants,
  dialogCloseVariants,
  type DialogSize,
  type DialogVariant,
  type DialogOverlayVariant,
} from '../../../variants'
import { cn } from '../../../lib/utils'

// ===== TYPES =====

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize
  variant?: DialogVariant
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
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  variant?: DialogOverlayVariant
}

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
 * Contenu du Dialog avec variants centralisés
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
          <DialogPrimitive.Close className={cn(dialogCloseVariants(), closeButtonClassName)}>
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
    <div ref={ref} className={cn(dialogHeaderVariants(), className)} {...props} />
  )
)
DialogHeader.displayName = 'DialogHeader'

/**
 * Footer du Dialog
 */
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(dialogFooterVariants(), className)} {...props} />
  )
)
DialogFooter.displayName = 'DialogFooter'

/**
 * Titre du Dialog
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn(dialogTitleVariants(), className)} {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/**
 * Description du Dialog
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(dialogDescriptionVariants(), className)}
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
