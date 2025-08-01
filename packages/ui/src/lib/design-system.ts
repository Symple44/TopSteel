import { cva, type VariantProps } from 'class-variance-authority'

// === BUTTON VARIANTS ===
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow hover:bg-primary/90 [&:not(:hover)]:text-white',
        destructive:
          'bg-destructive text-white shadow-sm hover:bg-destructive/90 [&:not(:hover)]:text-white',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
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
  'flex w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'h-9 px-3 py-1',
        checkbox: 'h-4 w-4 shrink-0 rounded-sm border-primary shadow',
        radio: 'h-4 w-4 shrink-0 rounded-full border-primary shadow',
      },
      size: {
        default: 'h-9 px-3 py-1',
        sm: 'h-8 px-2 text-xs',
        lg: 'h-10 px-4 text-base',
        checkbox: 'h-4 w-4',
        radio: 'h-4 w-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
export const cardVariants = cva('rounded-lg border bg-card text-card-foreground shadow', {
  variants: {
    variant: {
      default: 'border-border',
      elevated: 'border-transparent shadow-lg',
      ghost: 'border-transparent shadow-none',
      outline: 'border-border shadow-none',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
})

export type CardVariants = VariantProps<typeof cardVariants>

// === TABLE VARIANTS ===
export const tableVariants = cva('w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default: '[&_tr]:border-b',
      striped: '[&_tbody_tr:nth-child(even)]:bg-muted/50 [&_tr]:border-b',
      grid: 'border-collapse [&_td]:border [&_th]:border',
    },
    size: {
      sm: '[&_td]:p-2 [&_th]:p-2 text-xs',
      default: '[&_td]:p-4 [&_th]:p-4',
      lg: '[&_td]:p-6 [&_th]:p-6 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export type TableVariants = VariantProps<typeof tableVariants>

// === DIALOG VARIANTS ===
export const dialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw] max-h-[90vh]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export type DialogContentVariants = VariantProps<typeof dialogContentVariants>

// === SIDEBAR VARIANTS ===
export const sidebarVariants = cva('flex h-full flex-col overflow-y-auto border-r bg-background', {
  variants: {
    variant: {
      default: 'border-border',
      floating: 'border-transparent shadow-lg m-2 rounded-lg',
      inset: 'border-border bg-muted/30',
    },
    size: {
      default: 'w-64',
      sm: 'w-48',
      lg: 'w-80',
      collapsed: 'w-16',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export type SidebarVariants = VariantProps<typeof sidebarVariants>
