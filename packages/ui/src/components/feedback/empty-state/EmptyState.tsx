'use client'

import { FileQuestion, Inbox, Search, AlertCircle, FolderOpen } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button/Button'

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'folder' | 'custom'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  icon?: React.ReactNode
}

export interface EmptyStateProps {
  /** Titre principal */
  title: string
  /** Description explicative */
  description?: string
  /** Variante avec icone prédéfinie */
  variant?: EmptyStateVariant
  /** Icone personnalisée (remplace l'icone de la variante) */
  icon?: React.ReactNode
  /** Action principale */
  action?: EmptyStateAction
  /** Action secondaire */
  secondaryAction?: EmptyStateAction
  /** Classes CSS additionnelles */
  className?: string
  /** Taille de l'affichage */
  size?: 'sm' | 'md' | 'lg'
}

const variantIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: <Inbox className="h-12 w-12" />,
  search: <Search className="h-12 w-12" />,
  error: <AlertCircle className="h-12 w-12" />,
  folder: <FolderOpen className="h-12 w-12" />,
  custom: <FileQuestion className="h-12 w-12" />,
}

const sizeStyles = {
  sm: {
    container: 'py-6 px-4',
    icon: 'h-8 w-8',
    title: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'py-10 px-6',
    icon: 'h-12 w-12',
    title: 'text-base',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'h-16 w-16',
    title: 'text-lg',
    description: 'text-base',
  },
}

/**
 * Composant EmptyState pour afficher un etat vide avec message et action
 * Utilise pour les tables sans donnees, recherches sans resultats, etc.
 */
export function EmptyState({
  title,
  description,
  variant = 'default',
  icon,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const styles = sizeStyles[size]
  const displayIcon = icon || variantIcons[variant]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icone */}
      <div
        className={cn(
          'text-muted-foreground/50 mb-4',
          variant === 'error' && 'text-destructive/50'
        )}
        aria-hidden="true"
      >
        {displayIcon}
      </div>

      {/* Titre */}
      <h3
        className={cn(
          'font-medium text-foreground mb-1',
          styles.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-muted-foreground max-w-sm',
            styles.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'ghost'}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.icon && <span className="mr-2">{secondaryAction.icon}</span>}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * EmptyState specifique pour les resultats de recherche
 */
export function SearchEmptyState({
  searchTerm,
  onClearSearch,
  className,
}: {
  searchTerm?: string
  onClearSearch?: () => void
  className?: string
}) {
  return (
    <EmptyState
      variant="search"
      title={searchTerm ? `Aucun resultat pour "${searchTerm}"` : 'Aucun resultat'}
      description="Essayez de modifier votre recherche ou vos filtres"
      action={
        onClearSearch
          ? {
              label: 'Effacer la recherche',
              onClick: onClearSearch,
              variant: 'outline',
            }
          : undefined
      }
      className={className}
    />
  )
}

/**
 * EmptyState specifique pour les tables sans donnees
 */
export function TableEmptyState({
  entityName = 'elements',
  onAdd,
  className,
}: {
  entityName?: string
  onAdd?: () => void
  className?: string
}) {
  return (
    <EmptyState
      variant="folder"
      title={`Aucun ${entityName}`}
      description={`Il n'y a pas encore de ${entityName}. Commencez par en creer un.`}
      action={
        onAdd
          ? {
              label: `Ajouter un ${entityName}`,
              onClick: onAdd,
            }
          : undefined
      }
      className={className}
    />
  )
}

export default EmptyState
