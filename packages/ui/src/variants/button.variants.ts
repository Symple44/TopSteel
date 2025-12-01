/**
 * Button Variants - TopSteel Design System
 * Variants CVA consolidés pour le composant Button
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground shadow-md',
          'hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-sm',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground shadow-md',
          'hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5',
          'active:translate-y-0',
        ],
        outline: [
          'border-2 border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground shadow-sm',
          'hover:bg-secondary/80 hover:shadow-md',
        ],
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
        success: [
          'bg-success text-success-foreground shadow-md',
          'hover:bg-success/90 hover:shadow-lg hover:-translate-y-0.5',
        ],
        warning: [
          'bg-warning text-warning-foreground shadow-md',
          'hover:bg-warning/90 hover:shadow-lg hover:-translate-y-0.5',
        ],
        subtle: [
          'bg-muted/60 text-muted-foreground',
          'hover:bg-muted hover:text-foreground',
        ],
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-8 rounded-lg px-4 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-12 w-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
export type ButtonVariant = NonNullable<ButtonVariants['variant']>
export type ButtonSize = NonNullable<ButtonVariants['size']>
