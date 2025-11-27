'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'

const pageHeaderVariants = cva('mb-6', {
  variants: {
    variant: {
      default: '',
      bordered: 'pb-4 border-b border-border/50',
    },
    spacing: {
      sm: 'mb-4',
      default: 'mb-6',
      lg: 'mb-8',
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
 * PageHeader - En-tête compact et standardisé pour les pages
 * Style uniforme : icône (10x10) | titre (xl) + description | actions à droite
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
            className="mb-3 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        )}

        <div className="flex items-center justify-between gap-4">
          {/* Partie gauche: icône, titre, description */}
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white',
                  iconBackground
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-foreground truncate">
                  {title}
                </h1>
                {badge}
              </div>
              {description && (
                <p className="text-sm text-muted-foreground truncate">
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
