/**
 * 🏷️ BADGE COMPONENT - TOPSTEEL ERP UI
 * Composant badge robuste pour affichage de statuts et labels
 *
 * Fonctionnalités:
 * - Variantes multiples (default, secondary, destructive, outline)
 * - Tailles adaptatives
 * - Support des icônes
 * - Thème adaptatif
 * - Accessibilité complète
 * - Animations optionnelles
 */

import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

// =============================================
// VARIANTS CONFIGURATION
// =============================================

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline:
          'text-foreground border-input bg-background hover:bg-accent hover:text-accent-foreground',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
        info: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',

        // Variantes spécifiques ERP
        status: 'border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200',
        priority: 'border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200',
        category: 'border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200',

        // Variantes métallurgie
        steel:
          'border-transparent bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600',
        iron: 'border-transparent bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800',
        aluminum:
          'border-transparent bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 hover:from-slate-200 hover:to-slate-300',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-1.5 text-xs',
        lg: 'px-3 py-2 text-sm',
        xl: 'px-4 py-2.5 text-base',
      },
      shape: {
        rounded: 'rounded-full',
        square: 'rounded-md',
        pill: 'rounded-full px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shape: 'rounded',
    },
  }
)

// =============================================
// TYPES ET INTERFACES
// =============================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  // Contenu
  children: React.ReactNode

  // Icônes
  icon?: React.ReactNode
  iconPosition?: 'start' | 'end'

  // État
  loading?: boolean
  disabled?: boolean

  // Actions
  onRemove?: () => void
  clickable?: boolean

  // Affichage
  dot?: boolean
  pulse?: boolean

  // Accessibilité
  label?: string

  // ERP spécifique
  status?: 'active' | 'inactive' | 'pending' | 'completed' | 'error'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  count?: number
}

// =============================================
// HELPERS
// =============================================

const getStatusVariant = (status?: BadgeProps['status']) => {
  const statusMap = {
    active: 'success' as const,
    inactive: 'secondary' as const,
    pending: 'warning' as const,
    completed: 'success' as const,
    error: 'destructive' as const,
  }

  return status ? statusMap[status] : undefined
}

const getPriorityVariant = (priority?: BadgeProps['priority']) => {
  const priorityMap = {
    low: 'secondary' as const,
    medium: 'info' as const,
    high: 'warning' as const,
    critical: 'destructive' as const,
  }

  return priority ? priorityMap[priority] : undefined
}

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      children,
      icon,
      iconPosition = 'start',
      loading = false,
      disabled = false,
      onRemove,
      clickable = false,
      dot = false,
      pulse = false,
      label,
      status,
      priority,
      count,
      onClick,
      ...props
    },
    ref
  ) => {
    // Déterminer la variante en fonction du status ou priority
    const finalVariant =
      variant || getStatusVariant(status) || getPriorityVariant(priority) || 'default'

    // Classes calculées
    const badgeClasses = cn(
      badgeVariants({ variant: finalVariant, size, shape }),
      {
        'cursor-pointer hover:scale-105': clickable || onClick,
        'opacity-60 cursor-not-allowed': disabled,
        'animate-pulse': pulse,
        relative: dot || count !== undefined,
        'pl-6': dot && iconPosition === 'start',
        'pr-6': dot && iconPosition === 'end',
      },
      className
    )

    // Contenu du badge
    const content = (
      <>
        {/* Dot indicator */}
        {dot ? <span
            className={cn(
              'absolute w-2 h-2 rounded-full',
              iconPosition === 'start' ? 'left-1.5' : 'right-1.5',
              finalVariant === 'success'
                ? 'bg-green-400'
                : finalVariant === 'warning'
                  ? 'bg-yellow-400'
                  : finalVariant === 'destructive'
                    ? 'bg-red-400'
                    : 'bg-blue-400'
            )}
          /> : null}

        {/* Icon start */}
        {icon && iconPosition === 'start' && !loading ? <span className={cn('mr-1', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')}>{icon}</span> : null}

        {/* Loading spinner */}
        {loading ? <span
            className={cn(
              'mr-1 animate-spin rounded-full border-2 border-current border-t-transparent',
              size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
            )}
          /> : null}

        {/* Main content */}
        <span className="truncate">{children}</span>

        {/* Count */}
        {count !== undefined && count > 0 && (
          <span
            className={cn(
              'ml-1 rounded-full bg-current text-xs font-bold',
              'flex items-center justify-center min-w-[1rem] h-4 px-1',
              'text-white bg-red-500'
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}

        {/* Icon end */}
        {icon && iconPosition === 'end' && !loading ? <span className={cn('ml-1', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')}>{icon}</span> : null}

        {/* Remove button */}
        {onRemove ? <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className={cn(
              'ml-1 rounded-full p-0.5 hover:bg-current hover:bg-opacity-20',
              'focus:outline-none focus:ring-1 focus:ring-current',
              'transition-colors'
            )}
            aria-label="Supprimer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button> : null}
      </>
    )

    // Props d'accessibilité
    const accessibilityProps = {
      role: clickable || onClick ? 'button' : undefined,
      'aria-label': label,
      'aria-disabled': disabled,
      tabIndex: (clickable || onClick) && !disabled ? 0 : undefined,
      onKeyDown:
        (clickable || onClick) && !disabled
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.(e as any)
              }
            }
          : undefined,
    }

    return (
      <div
        ref={ref}
        className={badgeClasses}
        onClick={disabled ? undefined : onClick}
        {...accessibilityProps}
        {...props}
      >
        {content}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

// =============================================
// COMPOSANTS SPÉCIALISÉS
// =============================================

/**
 * Badge de statut avec couleurs prédéfinies
 */
export const StatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, 'variant'> & { status: NonNullable<BadgeProps['status']> }
>(({ status, ...props }, ref) => {
  return <Badge ref={ref} status={status} {...props} />
})

StatusBadge.displayName = 'StatusBadge'

/**
 * Badge de priorité avec couleurs et icônes
 */
export const PriorityBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, 'variant'> & { priority: NonNullable<BadgeProps['priority']> }
>(({ priority, icon, ...props }, ref) => {
  const priorityIcons = {
    low: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 10l5 5 5-5H5z" />
      </svg>
    ),
    medium: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 8h10v4H5V8z" />
      </svg>
    ),
    high: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M15 10l-5-5-5 5h10z" />
      </svg>
    ),
    critical: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2l8 18H2L10 2z" />
      </svg>
    ),
  }

  return <Badge ref={ref} priority={priority} icon={icon || priorityIcons[priority]} {...props} />
})

PriorityBadge.displayName = 'PriorityBadge'

/**
 * Badge de compteur
 */
export const CountBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, 'children'> & { count: number; label?: string }
>(({ count, label = 'Éléments', ...props }, ref) => {
  if (count === 0) return null

  return (
    <Badge ref={ref} size="sm" variant="destructive" label={`${count} ${label}`} {...props}>
      {count > 999 ? '999+' : count}
    </Badge>
  )
})

CountBadge.displayName = 'CountBadge'

// =============================================
// EXPORTS
// =============================================

export { Badge, badgeVariants }
