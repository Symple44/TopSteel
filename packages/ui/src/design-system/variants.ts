/**
 * 🎨 VARIANTS UNIFIÉS - TOPSTEEL ERP
 * Variants CVA centralisés pour tous les composants
 * Extension et unification des variants existants
 */

import { cva, type VariantProps } from 'class-variance-authority'

// ===== TYPES DE BASE =====

export type ComponentVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
export type ComponentSize = 'sm' | 'default' | 'lg' | 'xl'

// ===== COMPOSANTS PRIMITIFS UNIFIÉS =====

/**
 * Variants pour Button unifié
 * Fusion et amélioration des versions existantes
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
        success: 'bg-success text-success-foreground hover:bg-success/90 shadow-sm',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm',
      },
      size: {
        sm: 'h-9 rounded-md px-3 text-xs',
        default: 'h-10 px-4 py-2 text-sm',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-base',
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

// ===== COMPOSANTS COMPLEXES UNIFIÉS =====

/**
 * Variants pour DropdownMenu unifié
 * Fusion des 3 implémentations existantes
 */
export const dropdownVariants = cva(
  'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
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
        start:
          'data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
        center:
          'data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
        end: 'data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      align: 'start',
    },
  }
)

export type DropdownVariants = VariantProps<typeof dropdownVariants>

/**
 * Variants pour DropdownMenuItem unifié
 */
export const dropdownItemVariants = cva(
  'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      variant: {
        default: 'hover:bg-accent hover:text-accent-foreground',
        destructive:
          'text-destructive hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground',
        success:
          'text-success hover:bg-success hover:text-success-foreground focus:bg-success focus:text-success-foreground',
      },
      size: {
        sm: 'px-1 py-1 text-xs',
        default: 'px-2 py-1.5 text-sm',
        lg: 'px-3 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type DropdownItemVariants = VariantProps<typeof dropdownItemVariants>

/**
 * Variants pour Tooltip unifié
 * Fusion des 4 implémentations existantes
 */
export const tooltipVariants = cva(
  'z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  {
    variants: {
      variant: {
        default: 'bg-popover border border-border shadow-md',
        dark: 'bg-slate-900/95 text-slate-50 border-slate-800/50 shadow-lg',
        light: 'bg-white text-slate-900 border-slate-200 shadow-lg',
        floating: 'bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl',
      },
      size: {
        sm: 'px-2 py-1 text-xs max-w-xs',
        default: 'px-3 py-1.5 text-xs max-w-xs',
        lg: 'px-4 py-2 text-sm max-w-sm',
        xl: 'px-6 py-3 text-base max-w-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type TooltipVariants = VariantProps<typeof tooltipVariants>

/**
 * Variants pour composants de notification/feedback
 */
export const notificationVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        success: 'bg-success/10 text-success-foreground border-success/20 [&>svg]:text-success',
        warning: 'bg-warning/10 text-warning-foreground border-warning/20 [&>svg]:text-warning',
        destructive:
          'bg-destructive/10 text-destructive-foreground border-destructive/20 [&>svg]:text-destructive',
        info: 'bg-info/10 text-info-foreground border-info/20 [&>svg]:text-info',
      },
      size: {
        sm: 'p-3 text-sm',
        default: 'p-4 text-sm',
        lg: 'p-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type NotificationVariants = VariantProps<typeof notificationVariants>

/**
 * Variants pour composants de chargement/état
 */
export const loadingVariants = cva('inline-flex items-center justify-center', {
  variants: {
    variant: {
      spinner: 'animate-spin rounded-full border-2 border-current border-t-transparent',
      dots: 'space-x-1',
      pulse: 'animate-pulse',
      skeleton: 'animate-pulse rounded bg-muted',
    },
    size: {
      sm: 'h-4 w-4',
      default: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
  },
  defaultVariants: {
    variant: 'spinner',
    size: 'default',
  },
})

export type LoadingVariants = VariantProps<typeof loadingVariants>

/**
 * Variants pour composants de métallurgie TopSteel
 */
export const metallurgyVariants = cva('rounded-lg border p-4 font-mono text-sm', {
  variants: {
    variant: {
      specification: 'bg-steel-50 border-steel-200 text-steel-900',
      calculation: 'bg-blue-50 border-blue-200 text-blue-900',
      quality: 'bg-green-50 border-green-200 text-green-900',
      hazard: 'bg-red-50 border-red-200 text-red-900',
      certification: 'bg-amber-50 border-amber-200 text-amber-900',
    },
    priority: {
      low: 'border-l-4 border-l-steel-300',
      medium: 'border-l-4 border-l-amber-400',
      high: 'border-l-4 border-l-red-500',
      critical: 'border-l-4 border-l-red-600 bg-red-50',
    },
  },
  defaultVariants: {
    variant: 'specification',
    priority: 'low',
  },
})

export type MetallurgyVariants = VariantProps<typeof metallurgyVariants>

// ===== REGISTRY DES VARIANTS =====

export const unifiedVariants = {
  // Nouveaux variants unifiés
  dropdown: dropdownVariants,
  dropdownItem: dropdownItemVariants,
  tooltip: tooltipVariants,
  notification: notificationVariants,
  loading: loadingVariants,
  metallurgy: metallurgyVariants,
} as const

// ===== TYPES D'EXPORT =====

export type ComponentVariants = {
  dropdown: DropdownVariants
  dropdownItem: DropdownItemVariants
  tooltip: TooltipVariants
  notification: NotificationVariants
  loading: LoadingVariants
  metallurgy: MetallurgyVariants
}
