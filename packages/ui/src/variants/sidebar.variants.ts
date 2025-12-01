/**
 * Sidebar Variants - TopSteel Design System
 * Variants CVA pour le composant Sidebar
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const sidebarVariants = cva(
  'flex h-full flex-col overflow-y-auto border-r bg-background transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'border-border/60',
        floating: 'border-transparent shadow-xl shadow-black/10 m-3 rounded-2xl',
        inset: 'border-border/40 bg-muted/20',
        glass: 'border-white/20 bg-background/80 backdrop-blur-xl',
        minimal: 'border-0 bg-transparent',
      },
      size: {
        collapsed: 'w-[68px]',
        sm: 'w-52',
        default: 'w-64',
        lg: 'w-72',
        xl: 'w-80',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export const sidebarItemVariants = cva(
  [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
    'transition-all duration-200',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ],
  {
    variants: {
      variant: {
        default: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        active: 'bg-primary/10 text-primary hover:bg-primary/15',
        ghost: 'hover:bg-transparent hover:text-primary',
      },
      size: {
        sm: 'px-2 py-1.5 text-xs',
        default: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type SidebarVariants = VariantProps<typeof sidebarVariants>
export type SidebarItemVariants = VariantProps<typeof sidebarItemVariants>

export type SidebarVariant = NonNullable<SidebarVariants['variant']>
export type SidebarSize = NonNullable<SidebarVariants['size']>
