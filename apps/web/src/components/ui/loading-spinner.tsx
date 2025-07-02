// apps/web/src/components/ui/loading-spinner.tsx - Composant optimisé
'use client'

import { cn } from '@erp/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }
  
  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-2 border-current border-r-transparent gpu-accelerated",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Chargement..."
    >
      <span className="sr-only">Chargement...</span>
    </div>
  )
}
