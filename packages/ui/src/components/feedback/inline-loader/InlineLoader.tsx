'use client'

import * as React from 'react'
import { cn } from '../../../lib/utils'

export interface InlineLoaderProps {
  /** Loading text to display */
  text?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show dots animation */
  showDots?: boolean
  /** Custom class name */
  className?: string
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const dotSizeClasses = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2',
}

/**
 * InlineLoader component for inline loading states
 * Displays animated dots or spinner with optional text
 */
export function InlineLoader({
  text = 'Chargement',
  size = 'md',
  showDots = true,
  className,
}: InlineLoaderProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5',
        sizeClasses[size],
        className
      )}
    >
      {showDots ? (
        <>
          <span className="sr-only">{text}</span>
          <span aria-hidden="true">{text}</span>
          <span className="inline-flex gap-0.5" aria-hidden="true">
            <span
              className={cn(
                'rounded-full bg-current animate-bounce',
                dotSizeClasses[size]
              )}
              style={{ animationDelay: '0ms', animationDuration: '600ms' }}
            />
            <span
              className={cn(
                'rounded-full bg-current animate-bounce',
                dotSizeClasses[size]
              )}
              style={{ animationDelay: '150ms', animationDuration: '600ms' }}
            />
            <span
              className={cn(
                'rounded-full bg-current animate-bounce',
                dotSizeClasses[size]
              )}
              style={{ animationDelay: '300ms', animationDuration: '600ms' }}
            />
          </span>
        </>
      ) : (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{text}</span>
        </>
      )}
    </span>
  )
}

/**
 * Saving indicator for form submissions
 */
export function SavingIndicator({
  className,
  text = 'Enregistrement',
}: {
  className?: string
  text?: string
}) {
  return (
    <InlineLoader
      text={text}
      size="sm"
      showDots={true}
      className={cn('text-muted-foreground', className)}
    />
  )
}

/**
 * Processing indicator for async operations
 */
export function ProcessingIndicator({
  className,
  text = 'Traitement en cours',
}: {
  className?: string
  text?: string
}) {
  return (
    <InlineLoader
      text={text}
      size="md"
      showDots={false}
      className={cn('text-primary', className)}
    />
  )
}

export default InlineLoader
