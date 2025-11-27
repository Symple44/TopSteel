import { cva, type VariantProps } from 'class-variance-authority'

// === BUTTON VARIANTS ===
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm [&:not(:hover)]:text-white',
        destructive:
          'bg-destructive text-white shadow-md hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 [&:not(:hover)]:text-white',
        outline:
          'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Nouveaux variants
        success:
          'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5',
        warning:
          'bg-amber-500 text-white shadow-md hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5',
        subtle:
          'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        xl: 'h-14 rounded-xl px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

// === BADGE VARIANTS ===
export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-white shadow hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>

// === ALERT VARIANTS ===
export const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type AlertVariants = VariantProps<typeof alertVariants>

// === SCROLL AREA VARIANTS ===
export const scrollAreaVariants = cva('relative overflow-hidden', {
  variants: {
    size: {
      sm: 'h-32',
      md: 'h-64',
      lg: 'h-96',
      xl: 'h-[32rem]',
      full: 'h-full',
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export type ScrollAreaVariants = VariantProps<typeof scrollAreaVariants>

// === INPUT VARIANTS ===
export const inputVariants = cva(
  'flex w-full rounded-lg border-2 border-input bg-background text-sm transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
  {
    variants: {
      variant: {
        default: 'h-10 px-4 py-2 hover:border-muted-foreground/30',
        checkbox:
          'h-5 w-5 shrink-0 rounded-md border-2 border-muted-foreground/30 shadow-sm hover:border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        radio:
          'h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30 shadow-sm hover:border-primary/50 data-[state=checked]:border-primary',
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
        error:
          'border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20 bg-destructive/5',
        success:
          'border-emerald-500/60 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 bg-emerald-50/50',
        warning:
          'border-amber-500/60 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 bg-amber-50/50',
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

// === SWITCH VARIANTS ===
export const switchVariants = cva(
  'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        default: 'h-6 w-11',
        lg: 'h-8 w-14',
      },
      variant: {
        default: 'bg-input data-[state=checked]:bg-primary',
        success: 'bg-input data-[state=checked]:bg-green-500',
        warning: 'bg-input data-[state=checked]:bg-amber-500',
        destructive: 'bg-input data-[state=checked]:bg-destructive',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export type SwitchVariants = VariantProps<typeof switchVariants>

// === CARD VARIANTS ===
export const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        default: 'border-border/60 shadow-sm',
        elevated:
          'border-transparent shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl',
        glass:
          'border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg',
        ghost: 'border-transparent shadow-none bg-transparent',
        outline: 'border-2 border-border shadow-none',
        interactive:
          'border-border/60 shadow-sm cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 active:translate-y-0',
        gradient:
          'border-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 shadow-sm',
        success:
          'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm shadow-emerald-500/10',
        warning:
          'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 shadow-sm shadow-amber-500/10',
        error:
          'border-destructive/30 bg-destructive/5 dark:bg-destructive/10 shadow-sm shadow-destructive/10',
        info: 'border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/30 shadow-sm shadow-blue-500/10',
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

// === TABLE VARIANTS ===
export const tableVariants = cva('w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default:
        '[&_tr]:border-b [&_tr]:border-border/50 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/50',
      striped:
        '[&_tbody_tr:nth-child(even)]:bg-muted/30 [&_tr]:border-b [&_tr]:border-border/50 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/60',
      grid: 'border-collapse [&_td]:border [&_th]:border [&_td]:border-border/50 [&_th]:border-border/50',
      modern:
        '[&_thead]:bg-muted/30 [&_thead_th]:font-semibold [&_tbody_tr]:border-b [&_tbody_tr]:border-border/30 [&_tbody_tr]:transition-all [&_tbody_tr:hover]:bg-primary/5 [&_tbody_tr:hover]:shadow-sm',
    },
    size: {
      sm: '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2.5 text-xs',
      default: '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3.5',
      lg: '[&_td]:px-6 [&_td]:py-4 [&_th]:px-6 [&_th]:py-5 text-base',
      compact: '[&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-2 text-xs',
    },
    header: {
      default: '[&_thead]:border-b [&_thead]:border-border',
      sticky: '[&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-background [&_thead]:z-10 [&_thead]:shadow-sm',
      elevated:
        '[&_thead]:bg-muted/50 [&_thead_th]:font-semibold [&_thead_th]:text-foreground [&_thead]:border-b-2 [&_thead]:border-border',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    header: 'default',
  },
})

export type TableVariants = VariantProps<typeof tableVariants>

// === DIALOG VARIANTS ===
export const dialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/50 bg-background p-6 shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-5xl',
        full: 'max-w-[90vw] max-h-[90vh]',
        fullscreen: 'max-w-full w-full h-full rounded-none',
      },
      variant: {
        default: '',
        glass: 'bg-background/95 backdrop-blur-xl border-white/20',
        minimal: 'border-0 shadow-none bg-transparent',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export type DialogContentVariants = VariantProps<typeof dialogContentVariants>

// === SIDEBAR VARIANTS ===
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
        default: 'w-64',
        sm: 'w-52',
        lg: 'w-72',
        xl: 'w-80',
        collapsed: 'w-[68px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type SidebarVariants = VariantProps<typeof sidebarVariants>

// === TOOLTIP VARIANTS ===
export const tooltipVariants = cva(
  'z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
  {
    variants: {
      variant: {
        default: 'bg-popover text-popover-foreground shadow-md',
        inverse: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        success: 'bg-green-500 text-white',
        warning: 'bg-amber-500 text-white',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        default: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type TooltipVariants = VariantProps<typeof tooltipVariants>

// === THEME CONFIGURATION ===
// Import unified theme types and configurations
export type { ResolvedTheme, ThemeConfig } from '../design-system/themes'

export { darkTheme, lightTheme, vibrantTheme } from '../design-system/themes'
