/**
 * Alert Variants - TopSteel Design System
 * Variants CVA pour le composant Alert
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const alertVariants = cva(
  [
    'relative w-full rounded-lg border px-4 py-3 text-sm',
    '[&>svg+div]:translate-y-[-3px]',
    '[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    '[&>svg~*]:pl-7',
  ],
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: [
          'border-destructive/50 text-destructive',
          'dark:border-destructive',
          '[&>svg]:text-destructive',
        ],
        success: [
          'border-success/50 text-success',
          'bg-success/10',
          '[&>svg]:text-success',
        ],
        warning: [
          'border-warning/50 text-warning',
          'bg-warning/10',
          '[&>svg]:text-warning',
        ],
        info: [
          'border-info/50 text-info',
          'bg-info/10',
          '[&>svg]:text-info',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export const alertTitleVariants = cva('mb-1 font-medium leading-none tracking-tight')

export const alertDescriptionVariants = cva('text-sm [&_p]:leading-relaxed')

export type AlertVariants = VariantProps<typeof alertVariants>
export type AlertVariant = NonNullable<AlertVariants['variant']>
