/**
 * Card Variants - TopSteel Design System
 * Variants CVA consolidés pour le composant Card
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const cardVariants = cva(
  // Base styles
  'rounded-xl border bg-card text-card-foreground transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        default: 'border-border/60 shadow-sm',
        elevated: [
          'border-transparent shadow-lg shadow-black/5',
          'dark:shadow-black/20 hover:shadow-xl',
        ],
        glass: [
          'border-white/20 bg-white/80 dark:bg-gray-900/80',
          'backdrop-blur-xl shadow-lg',
        ],
        ghost: 'border-transparent shadow-none bg-transparent',
        outline: 'border-2 border-border shadow-none',
        interactive: [
          'border-border/60 shadow-sm cursor-pointer',
          'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1',
          'active:translate-y-0',
        ],
        gradient: [
          'border-0 shadow-sm',
          'bg-gradient-to-br from-primary/5 via-transparent to-primary/10',
        ],
        success: [
          'border-emerald-200 dark:border-emerald-800/50',
          'bg-emerald-50 dark:bg-emerald-950/30',
          'shadow-sm shadow-emerald-500/10',
        ],
        warning: [
          'border-amber-200 dark:border-amber-800/50',
          'bg-amber-50 dark:bg-amber-950/30',
          'shadow-sm shadow-amber-500/10',
        ],
        error: [
          'border-destructive/30',
          'bg-destructive/5 dark:bg-destructive/10',
          'shadow-sm shadow-destructive/10',
        ],
        info: [
          'border-blue-200 dark:border-blue-800/50',
          'bg-blue-50 dark:bg-blue-950/30',
          'shadow-sm shadow-blue-500/10',
        ],
      },
      padding: {
        none: 'p-0',
        xs: 'p-3',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-xl hover:-translate-y-1.5 hover:shadow-black/10',
        glow: 'hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] hover:border-primary/40',
        highlight: 'hover:bg-accent/50',
        scale: 'hover:scale-[1.02]',
      },
      rounded: {
        default: 'rounded-xl',
        sm: 'rounded-lg',
        lg: 'rounded-2xl',
        full: 'rounded-3xl',
        none: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      hover: 'none',
      rounded: 'default',
    },
  }
)

export type CardVariants = VariantProps<typeof cardVariants>
export type CardVariant = NonNullable<CardVariants['variant']>
export type CardPadding = NonNullable<CardVariants['padding']>
export type CardHover = NonNullable<CardVariants['hover']>
