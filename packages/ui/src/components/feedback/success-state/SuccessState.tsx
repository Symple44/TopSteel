'use client'

import { CheckCircle, ArrowRight } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface SuccessStateProps {
  /** Success title */
  title: string
  /** Success description */
  description?: string
  /** Icon to display (defaults to CheckCircle) */
  icon?: React.ReactNode
  /** Primary action button */
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  /** Secondary action button */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  /** Show confetti animation */
  showConfetti?: boolean
  /** Custom class name */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    container: 'py-6 px-4',
    icon: 'h-10 w-10',
    title: 'text-lg',
    description: 'text-sm',
  },
  md: {
    container: 'py-10 px-6',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'h-20 w-20',
    title: 'text-2xl',
    description: 'text-lg',
  },
}

/**
 * SuccessState component for displaying success feedback
 * Used after successful form submissions, operations, etc.
 */
export function SuccessState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  showConfetti = false,
  className,
  size = 'md',
}: SuccessStateProps) {
  const sizes = sizeClasses[size]

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-green-500 animate-confetti-1 rounded-full" />
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 animate-confetti-2 rounded-full" />
          <div className="absolute top-0 left-3/4 w-2 h-2 bg-yellow-500 animate-confetti-3 rounded-full" />
          <div className="absolute top-0 left-1/3 w-2 h-2 bg-pink-500 animate-confetti-4 rounded-full" />
          <div className="absolute top-0 left-2/3 w-2 h-2 bg-purple-500 animate-confetti-5 rounded-full" />
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full',
          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
          'mb-4 animate-scale-in'
        )}
      >
        {icon || (
          <CheckCircle className={cn(sizes.icon, 'p-2')} aria-hidden="true" />
        )}
      </div>

      {/* Title */}
      <h2 className={cn('font-semibold text-foreground', sizes.title)}>
        {title}
      </h2>

      {/* Description */}
      {description && (
        <p className={cn('mt-2 text-muted-foreground max-w-md', sizes.description)}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'font-medium text-sm min-h-[44px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'transition-colors'
              )}
            >
              {primaryAction.label}
              {primaryAction.icon || <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={cn(
                'inline-flex items-center justify-center px-6 py-3 rounded-md',
                'border hover:bg-accent',
                'font-medium text-sm min-h-[44px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'transition-colors'
              )}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * FormSuccessState - Pre-configured success state for form submissions
 */
export function FormSuccessState({
  title = 'Enregistré avec succès',
  description,
  onContinue,
  onGoBack,
  continueLabel = 'Continuer',
  backLabel = 'Retour',
  className,
}: {
  title?: string
  description?: string
  onContinue?: () => void
  onGoBack?: () => void
  continueLabel?: string
  backLabel?: string
  className?: string
}) {
  return (
    <SuccessState
      title={title}
      description={description}
      size="md"
      primaryAction={
        onContinue
          ? { label: continueLabel, onClick: onContinue }
          : undefined
      }
      secondaryAction={
        onGoBack
          ? { label: backLabel, onClick: onGoBack }
          : undefined
      }
      className={className}
    />
  )
}

/**
 * OperationSuccessState - Pre-configured success state for async operations
 */
export function OperationSuccessState({
  operationType = 'opération',
  onDismiss,
  className,
}: {
  operationType?: string
  onDismiss?: () => void
  className?: string
}) {
  return (
    <SuccessState
      title={`${operationType.charAt(0).toUpperCase() + operationType.slice(1)} terminée`}
      description={`L'${operationType} a été effectuée avec succès.`}
      size="sm"
      primaryAction={
        onDismiss
          ? { label: 'OK', onClick: onDismiss }
          : undefined
      }
      className={className}
    />
  )
}

export default SuccessState
