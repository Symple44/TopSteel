/**
 * Badge Variants - TopSteel Design System
 * Variants CVA pour le composant Badge
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const badgeVariants = cva(
  [
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
    'transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-success text-success-foreground shadow hover:bg-success/90',
        warning: 'border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/90',
        info: 'border-transparent bg-info text-info-foreground shadow hover:bg-info/90',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
export type BadgeVariant = NonNullable<BadgeVariants['variant']>
export type BadgeSize = NonNullable<BadgeVariants['size']>
