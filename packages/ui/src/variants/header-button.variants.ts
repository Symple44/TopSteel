/**
 * HeaderButton Variants - TopSteel Design System
 * Variants pour les boutons du header
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const headerButtonVariants = cva(
  [
    'inline-flex items-center justify-center rounded-md',
    'text-muted-foreground hover:text-foreground',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-7 w-7',
        md: 'h-9 w-9',
        lg: 'h-11 w-11',
      },
      variant: {
        ghost: 'hover:bg-muted/50',
        subtle: 'bg-muted/30 hover:bg-muted/50',
        outline: 'border border-border hover:bg-muted/50',
      },
      withBadge: {
        true: 'relative',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'ghost',
      withBadge: false,
    },
  }
)

export type HeaderButtonVariants = VariantProps<typeof headerButtonVariants>

// Badge pour les notifications
export const headerBadgeVariants = cva(
  'absolute flex items-center justify-center rounded-full text-xs font-medium',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 -top-0.5 -right-0.5',
        md: 'h-5 w-5 -top-1 -right-1',
      },
      variant: {
        primary: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        warning: 'bg-warning text-warning-foreground',
      },
    },
    defaultVariants: {
      size: 'sm',
      variant: 'primary',
    },
  }
)

export type HeaderBadgeVariants = VariantProps<typeof headerBadgeVariants>
