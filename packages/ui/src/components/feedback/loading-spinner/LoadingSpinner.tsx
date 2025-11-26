'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface LoadingSpinnerProps {
  /** Taille du spinner */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Label pour l'accessibilite */
  label?: string
  /** Afficher le label visuellement */
  showLabel?: boolean
  /** Classes CSS additionnelles */
  className?: string
  /** Centrer dans le conteneur parent */
  centered?: boolean
  /** Couleur du spinner */
  variant?: 'default' | 'primary' | 'muted'
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

const variantClasses = {
  default: 'text-foreground',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
}

/**
 * Composant LoadingSpinner accessible et consistant
 * Utilise Lucide Loader2 avec animation spin
 */
export function LoadingSpinner({
  size = 'md',
  label = 'Chargement en cours',
  showLabel = false,
  className,
  centered = false,
  variant = 'default',
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-2',
        centered && 'justify-center',
        className
      )}
    >
      <Loader2
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
        aria-hidden="true"
      />
      {showLabel ? (
        <span className={cn('text-sm', variantClasses[variant])}>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )

  if (centered) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[100px]">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * Spinner plein ecran avec overlay
 */
export function FullPageSpinner({
  label = 'Chargement en cours',
}: {
  label?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="xl" label={label} showLabel variant="primary" />
    </div>
  )
}

/**
 * Spinner pour les boutons (inline, petit)
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('h-4 w-4 animate-spin', className)}
      aria-hidden="true"
    />
  )
}

/**
 * Wrapper qui affiche un spinner pendant le chargement
 */
export function LoadingWrapper({
  loading,
  children,
  fallback,
  minHeight = 100,
}: {
  loading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: number
}) {
  if (loading) {
    return (
      fallback || (
        <div
          className="flex items-center justify-center w-full"
          style={{ minHeight }}
        >
          <LoadingSpinner size="lg" showLabel />
        </div>
      )
    )
  }

  return <>{children}</>
}

export default LoadingSpinner
