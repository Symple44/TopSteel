/**
 * 🗂️ CARD COMPONENT - TOPSTEEL ERP UI
 * Composant carte modulaire et flexible pour l'affichage de contenu
 *
 * Fonctionnalités:
 * - Structure modulaire (Header, Content, Footer)
 * - Variantes d'apparence multiples
 * - Support des actions et états
 * - Thème adaptatif
 * - Accessibilité complète
 * - Patterns ERP intégrés
 * - Animations et interactions
 */

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

// =============================================
// VARIANTS CONFIGURATION
// =============================================

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-border',
        outlined: 'border-2 border-border',
        elevated: 'border-border shadow-md',
        ghost: 'border-transparent shadow-none bg-transparent',

        // Variantes ERP
        project: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50/80',
        client: 'border-green-200 bg-green-50/50 hover:bg-green-50/80',
        quote: 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50/80',
        invoice: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50/80',
        production: 'border-orange-200 bg-orange-50/50 hover:bg-orange-50/80',
        stock: 'border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50/80',

        // États
        success: 'border-green-200 bg-green-50/50',
        warning: 'border-yellow-200 bg-yellow-50/50',
        error: 'border-red-200 bg-red-50/50',
        info: 'border-blue-200 bg-blue-50/50',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      interactive: {
        none: '',
        hover: 'hover:shadow-md cursor-pointer',
        clickable: 'hover:shadow-lg hover:scale-[1.02] cursor-pointer active:scale-[0.98]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: 'none',
    },
  }
)

// =============================================
// TYPES ET INTERFACES
// =============================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  // État et comportement
  loading?: boolean
  disabled?: boolean
  selected?: boolean

  // Actions
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void

  // Accessibilité
  label?: string
  description?: string

  // ERP spécifique
  entityType?: 'project' | 'client' | 'quote' | 'invoice' | 'production' | 'stock'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled'
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode
  avatar?: React.ReactNode
  badge?: React.ReactNode
  subtitle?: React.ReactNode
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode
  timestamp?: Date | string
  author?: string
}

// =============================================
// HELPERS
// =============================================

const LoadingSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'h-4 bg-muted rounded',
          i === lines - 1 && 'w-3/4' // Dernière ligne plus courte
        )}
      />
    ))}
  </div>
)

const EmptyState = ({ message = 'Aucun contenu disponible' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <svg
      className="w-12 h-12 text-muted-foreground mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
)

// =============================================
// COMPOSANT PRINCIPAL CARD
// =============================================

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      loading = false,
      disabled = false,
      selected = false,
      onSelect,
      onEdit,
      onDelete,
      label,
      description,
      entityType,
      priority,
      status,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    // Déterminer la variante en fonction de l'entityType
    const finalVariant = variant || entityType || 'default'

    // Déterminer l'interactivité
    const finalInteractive = interactive || (onClick || onSelect ? 'clickable' : 'none')

    // Classes calculées
    const cardClasses = cn(
      cardVariants({ variant: finalVariant, size, interactive: finalInteractive }),
      {
        'opacity-60 cursor-not-allowed': disabled,
        'ring-2 ring-primary ring-offset-2': selected,
        'animate-pulse': loading && !children,

        // Classes de priorité
        'border-l-4 border-l-red-500': priority === 'critical',
        'border-l-4 border-l-orange-500': priority === 'high',
        'border-l-4 border-l-yellow-500': priority === 'medium',
        'border-l-4 border-l-gray-300': priority === 'low',

        // Classes de statut
        'bg-green-50/80 border-green-200': status === 'completed',
        'bg-red-50/80 border-red-200': status === 'cancelled',
        'bg-yellow-50/80 border-yellow-200': status === 'pending',
        'bg-gray-50/80 border-gray-200': status === 'inactive',
      },
      className
    )

    // Handler de click
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return

        onClick?.(e)
        onSelect?.()
      },
      [disabled, onClick, onSelect]
    )

    // Handler de clavier
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.()
        }
      },
      [disabled, onSelect]
    )

    // Props d'accessibilité
    const accessibilityProps = {
      role: onClick || onSelect ? 'button' : undefined,
      'aria-label': label,
      'aria-describedby': description ? `${props.id || 'card'}-description` : undefined,
      'aria-disabled': disabled,
      'aria-selected': selected,
      tabIndex: (onClick || onSelect) && !disabled ? 0 : undefined,
      onKeyDown: (onClick || onSelect) && !disabled ? handleKeyDown : undefined,
    }

    return (
      <>
        <div
          ref={ref}
          className={cardClasses}
          onClick={disabled ? undefined : handleClick}
          {...accessibilityProps}
          {...props}
        >
          {loading && !children ? <LoadingSkeleton /> : children}
        </div>

        {/* Description cachée pour l'accessibilité */}
        {description && (
          <div id={`${props.id || 'card'}-description`} className="sr-only">
            {description}
          </div>
        )}
      </>
    )
  }
)

Card.displayName = 'Card'

// =============================================
// CARD HEADER
// =============================================

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, actions, avatar, badge, subtitle, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-3', className)} {...props}>
        {/* Ligne principale avec avatar, titre et actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Avatar */}
            {avatar && <div className="flex-shrink-0">{avatar}</div>}

            {/* Titre et badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="truncate">{children}</div>
                {badge && <div className="flex-shrink-0">{badge}</div>}
              </div>

              {/* Sous-titre */}
              {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
            </div>
          </div>

          {/* Actions */}
          {actions && <div className="flex-shrink-0 ml-3">{actions}</div>}
        </div>
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// =============================================
// CARD TITLE
// =============================================

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
)

CardTitle.displayName = 'CardTitle'

// =============================================
// CARD DESCRIPTION
// =============================================

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}>
    {children}
  </p>
))

CardDescription.displayName = 'CardDescription'

// =============================================
// CARD CONTENT
// =============================================

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, loading = false, empty = false, emptyMessage, ...props }, ref) => {
    if (loading) {
      return (
        <div ref={ref} className={cn('py-3', className)} {...props}>
          <LoadingSkeleton />
        </div>
      )
    }

    if (empty) {
      return (
        <div ref={ref} className={cn('py-3', className)} {...props}>
          <EmptyState message={emptyMessage || 'Aucun contenu disponible'} />
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('py-3', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// =============================================
// CARD FOOTER
// =============================================

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, actions, timestamp, author, ...props }, ref) => {
    const formatDate = (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date

      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between pt-3 border-t border-border', className)}
        {...props}
      >
        {/* Métadonnées */}
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          {author && <span>Par {author}</span>}
          {timestamp && <span>{formatDate(timestamp)}</span>}
          {children}
        </div>

        {/* Actions */}
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

// =============================================
// COMPOSANTS SPÉCIALISÉS ERP
// =============================================

/**
 * Carte projet avec structure prédéfinie
 */
export const ProjectCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, 'entityType'> & {
    title: string
    description?: string
    progress?: number
    dueDate?: Date | string
    client?: string
    status?: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  }
>(({ title, description, progress, dueDate, client, status, ...props }, ref) => {
  return (
    <Card ref={ref} entityType="project" {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {client && <p className="text-sm text-muted-foreground mt-2">Client: {client}</p>}
      </CardContent>

      {dueDate && <CardFooter timestamp={dueDate} />}
    </Card>
  )
})

ProjectCard.displayName = 'ProjectCard'

/**
 * Carte statistique avec métriques
 */
export const StatsCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, 'children'> & {
    title: string
    value: string | number
    change?: {
      value: number
      type: 'increase' | 'decrease'
      period?: string
    }
    icon?: React.ReactNode
  }
>(({ title, value, change, icon, ...props }, ref) => {
  return (
    <Card ref={ref} {...props}>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p
                className={cn(
                  'text-xs flex items-center',
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                )}
              >
                <svg
                  className={cn(
                    'w-3 h-3 mr-1',
                    change.type === 'increase' ? 'rotate-0' : 'rotate-180'
                  )}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3l7 7H3l7-7z" />
                </svg>
                {Math.abs(change.value)}% {change.period && `vs ${change.period}`}
              </p>
            )}
          </div>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

// =============================================
// EXPORTS
// =============================================

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants }
