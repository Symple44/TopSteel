/**
 * Dropdown Variants - TopSteel Design System
 * Variants CVA consolidés pour le composant Dropdown (fusion de 7 versions)
 */

import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Variants pour le contenu du dropdown
 */
export const dropdownContentVariants = cva(
  // Base styles
  [
    'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
  ],
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-transparent shadow-lg',
        floating: 'border-transparent shadow-xl backdrop-blur-sm bg-popover/95',
      },
      size: {
        sm: 'min-w-[6rem] text-xs',
        default: 'min-w-[8rem] text-sm',
        lg: 'min-w-[12rem] text-base',
        xl: 'min-w-[16rem] text-base',
      },
      align: {
        start: [
          'data-[side=top]:slide-in-from-bottom-1',
          'data-[side=bottom]:slide-in-from-top-1',
          'data-[side=left]:slide-in-from-right-1',
          'data-[side=right]:slide-in-from-left-1',
        ],
        center: [
          'data-[side=top]:slide-in-from-bottom-2',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
        ],
        end: [
          'data-[side=top]:slide-in-from-bottom-1',
          'data-[side=bottom]:slide-in-from-top-1',
          'data-[side=left]:slide-in-from-right-1',
          'data-[side=right]:slide-in-from-left-1',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      align: 'start',
    },
  }
)

/**
 * Variants pour les items du dropdown
 */
export const dropdownItemVariants = cva(
  // Base styles
  [
    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
    'transition-colors',
    'focus:bg-accent focus:text-accent-foreground',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'hover:bg-accent hover:text-accent-foreground',
        destructive: [
          'text-destructive',
          'hover:bg-destructive hover:text-destructive-foreground',
          'focus:bg-destructive focus:text-destructive-foreground',
        ],
        success: [
          'text-emerald-600',
          'hover:bg-emerald-500 hover:text-white',
          'focus:bg-emerald-500 focus:text-white',
        ],
      },
      size: {
        sm: 'px-1 py-1 text-xs',
        default: 'px-2 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base',
      },
      inset: {
        true: 'pl-8',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      inset: false,
    },
  }
)

/**
 * Variants pour les labels du dropdown
 */
export const dropdownLabelVariants = cva('px-2 py-1.5 text-sm font-semibold', {
  variants: {
    inset: {
      true: 'pl-8',
      false: '',
    },
  },
  defaultVariants: {
    inset: false,
  },
})

/**
 * Variants pour les séparateurs du dropdown
 */
export const dropdownSeparatorVariants = cva('-mx-1 my-1 h-px bg-muted')

/**
 * Variants pour les raccourcis clavier
 */
export const dropdownShortcutVariants = cva(
  'ml-auto text-xs tracking-widest opacity-60'
)

export type DropdownContentVariants = VariantProps<typeof dropdownContentVariants>
export type DropdownItemVariants = VariantProps<typeof dropdownItemVariants>
export type DropdownLabelVariants = VariantProps<typeof dropdownLabelVariants>

export type DropdownVariant = NonNullable<DropdownContentVariants['variant']>
export type DropdownSize = NonNullable<DropdownContentVariants['size']>
export type DropdownAlign = NonNullable<DropdownContentVariants['align']>
