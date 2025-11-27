'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'

const pageHeaderVariants = cva('mb-6 sm:mb-8', {
  variants: {
    variant: {
      default: '',
      bordered: 'pb-6 border-b border-border/50',
      card: 'bg-card rounded-xl p-6 border border-border/50 shadow-sm',
    },
    spacing: {
      sm: 'mb-4',
      default: 'mb-6 sm:mb-8',
      lg: 'mb-8 sm:mb-10',
      none: 'mb-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    spacing: 'default',
  },
})

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  /** Titre principal de la page */
  title: string
  /** Description/sous-titre optionnel */
  description?: string
  /** Icône à afficher à côté du titre */
  icon?: LucideIcon
  /** Couleur de fond de l'icône (classe Tailwind) */
  iconBackground?: string
  /** Actions à afficher à droite (boutons, etc.) */
  actions?: React.ReactNode
  /** Afficher un bouton retour */
  backHref?: string
  /** Callback pour le bouton retour */
  onBack?: () => void
  /** Label du bouton retour */
  backLabel?: string
  /** Badge/tag à afficher près du titre */
  badge?: React.ReactNode
}

/**
 * PageHeader - En-tête standardisé pour les pages
 * Inclut titre, description, icône, actions et bouton retour optionnel
 */
const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      description,
      icon: Icon,
      iconBackground = 'bg-primary',
      actions,
      backHref,
      onBack,
      backLabel = 'Retour',
      badge,
      variant,
      spacing,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const handleBack = () => {
      if (onBack) {
        onBack()
      } else if (backHref && typeof window !== 'undefined') {
        window.history.back()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(pageHeaderVariants({ variant, spacing }), className)}
        {...props}
      >
        {/* Bouton retour */}
        {(backHref || onBack) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Partie gauche: icône, titre, description */}
          <div className="flex items-start gap-4">
            {Icon && (
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg',
                  iconBackground
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                {badge}
              </div>

              {description && (
                <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Partie droite: actions */}
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>

        {/* Contenu additionnel */}
        {children && <div className="mt-4">{children}</div>}
      </div>
    )
  }
)

PageHeader.displayName = 'PageHeader'

export { PageHeader }
