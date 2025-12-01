/**
 * Dialog Variants - TopSteel Design System
 * Variants CVA consolidés pour le composant Dialog (fusion de 2 versions)
 */

import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Variants pour l'overlay du dialog
 */
export const dialogOverlayVariants = cva(
  // Base styles
  [
    'fixed inset-0 z-50 bg-black/80',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  ],
  {
    variants: {
      variant: {
        default: 'bg-black/80',
        blur: 'bg-black/60 backdrop-blur-sm',
        dark: 'bg-black/90',
        light: 'bg-white/80 backdrop-blur-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

/**
 * Variants pour le contenu du dialog
 */
export const dialogContentVariants = cva(
  // Base styles
  [
    'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4',
    'border border-border/50 bg-background p-6 shadow-2xl shadow-black/10 dark:shadow-black/30',
    'rounded-2xl duration-300',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-5xl',
        full: 'max-w-[90vw] max-h-[90vh]',
        fullscreen: 'max-w-full w-full h-full rounded-none',
      },
      variant: {
        default: '',
        glass: 'bg-background/95 backdrop-blur-xl border-white/20',
        minimal: 'border-0 shadow-none bg-transparent',
        centered: 'items-center text-center',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

/**
 * Variants pour le header du dialog
 */
export const dialogHeaderVariants = cva(
  'flex flex-col space-y-1.5 text-center sm:text-left'
)

/**
 * Variants pour le footer du dialog
 */
export const dialogFooterVariants = cva(
  'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2'
)

/**
 * Variants pour le titre du dialog
 */
export const dialogTitleVariants = cva(
  'text-lg font-semibold leading-none tracking-tight'
)

/**
 * Variants pour la description du dialog
 */
export const dialogDescriptionVariants = cva('text-sm text-muted-foreground')

/**
 * Variants pour le bouton de fermeture
 */
export const dialogCloseVariants = cva(
  [
    'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background',
    'transition-opacity',
    'hover:opacity-100',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:pointer-events-none',
    'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
  ]
)

export type DialogOverlayVariants = VariantProps<typeof dialogOverlayVariants>
export type DialogContentVariants = VariantProps<typeof dialogContentVariants>

export type DialogSize = NonNullable<DialogContentVariants['size']>
export type DialogVariant = NonNullable<DialogContentVariants['variant']>
export type DialogOverlayVariant = NonNullable<DialogOverlayVariants['variant']>
