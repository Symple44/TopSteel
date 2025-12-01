/**
 * Table Variants - TopSteel Design System
 * Variants CVA pour le composant Table
 */

import { cva, type VariantProps } from 'class-variance-authority'

export const tableVariants = cva('w-full caption-bottom text-sm', {
  variants: {
    variant: {
      default: [
        '[&_tr]:border-b [&_tr]:border-border/50',
        '[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/50',
      ],
      striped: [
        '[&_tbody_tr:nth-child(even)]:bg-muted/30',
        '[&_tr]:border-b [&_tr]:border-border/50',
        '[&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-muted/60',
      ],
      grid: [
        'border-collapse',
        '[&_td]:border [&_th]:border',
        '[&_td]:border-border/50 [&_th]:border-border/50',
      ],
      modern: [
        '[&_thead]:bg-muted/30 [&_thead_th]:font-semibold',
        '[&_tbody_tr]:border-b [&_tbody_tr]:border-border/30',
        '[&_tbody_tr]:transition-all',
        '[&_tbody_tr:hover]:bg-primary/5 [&_tbody_tr:hover]:shadow-sm',
      ],
    },
    size: {
      sm: '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2.5 text-xs',
      default: '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3.5',
      lg: '[&_td]:px-6 [&_td]:py-4 [&_th]:px-6 [&_th]:py-5 text-base',
      compact: '[&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-2 text-xs',
    },
    header: {
      default: '[&_thead]:border-b [&_thead]:border-border',
      sticky: [
        '[&_thead]:sticky [&_thead]:top-0 [&_thead]:bg-background [&_thead]:z-10',
        '[&_thead]:shadow-sm',
      ],
      elevated: [
        '[&_thead]:bg-muted/50 [&_thead_th]:font-semibold [&_thead_th]:text-foreground',
        '[&_thead]:border-b-2 [&_thead]:border-border',
      ],
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    header: 'default',
  },
})

export type TableVariants = VariantProps<typeof tableVariants>
export type TableVariant = NonNullable<TableVariants['variant']>
export type TableSize = NonNullable<TableVariants['size']>
export type TableHeader = NonNullable<TableVariants['header']>
