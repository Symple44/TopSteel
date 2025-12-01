/**
 * Input Variants - TopSteel Design System
 * Variants CVA consolidés pour le composant Input
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const inputVariants = cva(
  // Base styles
  [
    'flex w-full rounded-lg border-2 border-input bg-background text-sm',
    'transition-all duration-200 ease-out',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
    'placeholder:text-muted-foreground/70',
    'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
  ],
  {
    variants: {
      variant: {
        default: 'h-10 px-4 py-2 hover:border-muted-foreground/30',
        checkbox: [
          'h-5 w-5 shrink-0 rounded-md border-2 border-muted-foreground/30 shadow-sm',
          'hover:border-primary/50',
          'data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        ],
        radio: [
          'h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30 shadow-sm',
          'hover:border-primary/50',
          'data-[state=checked]:border-primary',
        ],
        search: 'h-10 px-4 py-2 pl-11',
        password: 'h-10 px-4 py-2 pr-11',
        textarea: 'min-h-[120px] px-4 py-3 resize-y',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs rounded-md',
        lg: 'h-12 px-5 text-base',
        xl: 'h-14 px-6 text-lg rounded-xl',
        checkbox: 'h-5 w-5',
        radio: 'h-5 w-5',
      },
      state: {
        default: '',
        error: [
          'border-destructive/60',
          'focus-visible:border-destructive focus-visible:ring-destructive/20',
          'bg-destructive/5',
        ],
        success: [
          'border-emerald-500/60',
          'focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20',
          'bg-emerald-50/50',
        ],
        warning: [
          'border-amber-500/60',
          'focus-visible:border-amber-500 focus-visible:ring-amber-500/20',
          'bg-amber-50/50',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
    },
  }
)

export type InputVariants = VariantProps<typeof inputVariants>
export type InputVariant = NonNullable<InputVariants['variant']>
export type InputSize = NonNullable<InputVariants['size']>
export type InputState = NonNullable<InputVariants['state']>
