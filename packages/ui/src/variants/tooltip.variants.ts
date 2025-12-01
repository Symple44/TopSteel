/**
 * Tooltip Variants - TopSteel Design System
 * Variants CVA consolidés pour le composant Tooltip (fusion de 2 versions)
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const tooltipVariants = cva(
  // Base styles
  [
    'z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs',
    'animate-in fade-in-0 zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2',
    'data-[side=top]:slide-in-from-bottom-2',
  ],
  {
    variants: {
      variant: {
        default: 'bg-popover text-popover-foreground border border-border shadow-md',
        dark: 'bg-slate-900/95 text-slate-50 border-slate-800/50 shadow-lg',
        light: 'bg-white text-slate-900 border-slate-200 shadow-lg',
        floating: 'bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl',
        inverse: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        success: 'bg-emerald-500 text-white',
        warning: 'bg-amber-500 text-white',
      },
      size: {
        sm: 'text-xs px-2 py-1 max-w-xs',
        default: 'text-sm px-3 py-1.5 max-w-xs',
        lg: 'text-base px-4 py-2 max-w-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Variants pour la flèche du tooltip
 */
export const tooltipArrowVariants = cva('fill-current', {
  variants: {
    variant: {
      default: 'text-popover',
      dark: 'text-slate-900',
      light: 'text-white',
      floating: 'text-popover/95',
      inverse: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-emerald-500',
      warning: 'text-amber-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export type TooltipVariants = VariantProps<typeof tooltipVariants>
export type TooltipArrowVariants = VariantProps<typeof tooltipArrowVariants>

export type TooltipVariant = NonNullable<TooltipVariants['variant']>
export type TooltipSize = NonNullable<TooltipVariants['size']>
