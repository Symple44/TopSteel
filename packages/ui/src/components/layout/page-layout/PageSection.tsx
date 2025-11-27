'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../../lib/utils'

const pageSectionVariants = cva('', {
  variants: {
    variant: {
      default: '',
      card: 'bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden',
      ghost: 'bg-muted/30 rounded-xl',
    },
    spacing: {
      none: '',
      sm: 'mb-4',
      default: 'mb-6',
      lg: 'mb-8',
    },
    padding: {
      none: '',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    spacing: 'default',
    padding: 'none',
  },
})

export interface PageSectionProps extends VariantProps<typeof pageSectionVariants> {
  /** Titre de la section */
  title?: string
  /** Description de la section */
  description?: string
  /** Icône optionnelle */
  icon?: LucideIcon
  /** Actions à droite du titre */
  actions?: ReactNode
  /** Contenu de la section */
  children: ReactNode
  /** Nombre d'éléments (affiché en badge) */
  count?: number
  /** Classes additionnelles */
  className?: string
  /** Classes pour le header */
  headerClassName?: string
  /** Classes pour le contenu */
  contentClassName?: string
}

/**
 * PageSection - Section de page avec titre optionnel et card wrapper
 */
export function PageSection({
  title,
  description,
  icon: Icon,
  actions,
  children,
  count,
  variant,
  spacing,
  padding,
  className,
  headerClassName,
  contentClassName,
}: PageSectionProps) {
  const hasHeader = title || description || actions

  return (
    <section className={cn(pageSectionVariants({ variant, spacing, padding }), className)}>
      {hasHeader && (
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4',
            variant === 'card' && 'px-6 pt-6',
            headerClassName
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {count !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                    {count}
                  </span>
                )}
              </div>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div
        className={cn(variant === 'card' && hasHeader && 'px-6 pb-6', contentClassName)}
      >
        {children}
      </div>
    </section>
  )
}
