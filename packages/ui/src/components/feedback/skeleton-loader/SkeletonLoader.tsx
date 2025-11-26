'use client'

import { cn } from '../../../lib/utils'

export interface SkeletonLoaderProps {
  /** Largeur du skeleton (nombre en px ou string CSS) */
  width?: number | string
  /** Hauteur du skeleton (nombre en px ou string CSS) */
  height?: number | string
  /** Variante de forme */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  /** Animation */
  animation?: 'pulse' | 'wave' | 'none'
  /** Classes CSS additionnelles */
  className?: string
  /** Nombre de lignes pour le variant text */
  lines?: number
}

/**
 * Composant SkeletonLoader pour afficher un placeholder pendant le chargement
 * Accessible: utilise aria-busy et role="status"
 */
export function SkeletonLoader({
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  className,
  lines = 1,
}: SkeletonLoaderProps) {
  const baseStyles = cn(
    'bg-muted',
    animation === 'pulse' && 'animate-pulse',
    animation === 'wave' && 'animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]',
    variant === 'circular' && 'rounded-full',
    variant === 'rounded' && 'rounded-lg',
    variant === 'rectangular' && 'rounded-md',
    variant === 'text' && 'rounded h-4',
    className
  )

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  // Pour le variant text avec plusieurs lignes
  if (variant === 'text' && lines > 1) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Chargement en cours"
        className="space-y-2"
      >
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(baseStyles, index === lines - 1 && 'w-3/4')}
            style={style}
          />
        ))}
        <span className="sr-only">Chargement en cours...</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Chargement en cours"
      className={baseStyles}
      style={style}
    >
      <span className="sr-only">Chargement en cours...</span>
    </div>
  )
}

/**
 * Skeleton pour une carte
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 border rounded-lg space-y-4', className)}>
      <SkeletonLoader variant="text" width="60%" height={20} />
      <SkeletonLoader variant="text" lines={3} />
      <div className="flex gap-2">
        <SkeletonLoader variant="rounded" width={80} height={32} />
        <SkeletonLoader variant="rounded" width={80} height={32} />
      </div>
    </div>
  )
}

/**
 * Skeleton pour un avatar avec texte
 */
export function AvatarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <SkeletonLoader variant="circular" width={40} height={40} />
      <div className="space-y-2">
        <SkeletonLoader variant="text" width={120} height={16} />
        <SkeletonLoader variant="text" width={80} height={12} />
      </div>
    </div>
  )
}

export default SkeletonLoader
