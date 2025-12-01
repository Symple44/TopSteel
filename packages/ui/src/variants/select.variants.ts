/**
 * Select Variants - TopSteel Design System
 * Variants CVA consolidés pour le composant Select (fusion de 3 versions)
 */

import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Variants pour le trigger du select
 */
export const selectTriggerVariants = cva(
  // Base styles
  [
    'flex h-10 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-3 py-2 text-sm',
    'ring-offset-background',
    'transition-all duration-200 ease-out',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&>span]:line-clamp-1',
  ],
  {
    variants: {
      variant: {
        default: 'hover:border-muted-foreground/30',
        ghost: 'border-transparent hover:bg-accent',
        outline: 'border-2 border-border',
      },
      size: {
        sm: 'h-8 px-2 text-xs rounded-md',
        default: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default: '',
        error: 'border-destructive/60 focus:border-destructive focus:ring-destructive/20',
        success: 'border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  }
)

/**
 * Variants pour le contenu du select
 */
export const selectContentVariants = cva(
  // Base styles
  [
    'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2',
    'data-[side=top]:slide-in-from-bottom-2',
  ],
  {
    variants: {
      position: {
        popper: [
          'data-[side=bottom]:translate-y-1',
          'data-[side=left]:-translate-x-1',
          'data-[side=right]:translate-x-1',
          'data-[side=top]:-translate-y-1',
        ],
        'item-aligned': '',
      },
    },
    defaultVariants: {
      position: 'popper',
    },
  }
)

/**
 * Variants pour les items du select
 */
export const selectItemVariants = cva(
  // Base styles
  [
    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
    'transition-colors',
    'focus:bg-accent focus:text-accent-foreground',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'hover:bg-accent',
        highlighted: 'bg-accent text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

/**
 * Variants pour les labels du select
 */
export const selectLabelVariants = cva('py-1.5 pl-8 pr-2 text-sm font-semibold')

/**
 * Variants pour les séparateurs du select
 */
export const selectSeparatorVariants = cva('-mx-1 my-1 h-px bg-muted')

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>
export type SelectContentVariants = VariantProps<typeof selectContentVariants>
export type SelectItemVariants = VariantProps<typeof selectItemVariants>

export type SelectVariant = NonNullable<SelectTriggerVariants['variant']>
export type SelectSize = NonNullable<SelectTriggerVariants['size']>
export type SelectState = NonNullable<SelectTriggerVariants['state']>
