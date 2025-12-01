/**
 * NavItem Variants - TopSteel Design System
 * Variants pour les éléments de navigation sidebar
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const navItemVariants = cva(
  [
    'group relative flex items-center gap-3 rounded-xl text-sm font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ],
  {
    variants: {
      level: {
        0: 'px-3 py-2.5',
        1: 'px-3 py-2 pl-10',
        2: 'px-3 py-1.5 pl-14',
        3: 'px-3 py-1.5 pl-18',
      },
      active: {
        true: 'bg-primary/10 text-primary shadow-sm',
        false: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      },
      collapsed: {
        true: 'justify-center px-2 py-2.5',
        false: '',
      },
      hasActiveChild: {
        true: 'text-foreground',
        false: '',
      },
      disabled: {
        true: 'pointer-events-none opacity-50',
        false: '',
      },
    },
    compoundVariants: [
      {
        active: true,
        collapsed: true,
        className: 'bg-primary/10',
      },
      {
        hasActiveChild: true,
        active: false,
        className: 'text-foreground font-medium',
      },
    ],
    defaultVariants: {
      level: 0,
      active: false,
      collapsed: false,
      hasActiveChild: false,
      disabled: false,
    },
  }
)

export type NavItemVariants = VariantProps<typeof navItemVariants>

// Variant pour l'icône de navigation
export const navItemIconVariants = cva(
  'flex-shrink-0 transition-colors duration-200',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      active: {
        true: 'text-primary',
        false: 'text-muted-foreground group-hover:text-foreground',
      },
    },
    defaultVariants: {
      size: 'md',
      active: false,
    },
  }
)

export type NavItemIconVariants = VariantProps<typeof navItemIconVariants>
