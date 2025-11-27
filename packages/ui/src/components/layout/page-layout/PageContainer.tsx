'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../../lib/utils'

const pageContainerVariants = cva('w-full', {
  variants: {
    maxWidth: {
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    },
    padding: {
      none: 'p-0',
      sm: 'px-4 py-4 sm:px-6 sm:py-6',
      default: 'px-4 py-6 sm:px-6 lg:px-8 sm:py-8',
      lg: 'px-6 py-8 sm:px-8 lg:px-12 sm:py-10',
    },
    centered: {
      true: 'mx-auto',
      false: '',
    },
  },
  defaultVariants: {
    maxWidth: 'xl',
    padding: 'default',
    centered: true,
  },
})

export interface PageContainerProps extends VariantProps<typeof pageContainerVariants> {
  children: ReactNode
  className?: string
}

/**
 * PageContainer - Conteneur principal pour les pages
 * Gère la largeur maximale, le padding et le centrage
 */
export function PageContainer({
  children,
  maxWidth,
  padding,
  centered,
  className,
}: PageContainerProps) {
  return (
    <div className={cn(pageContainerVariants({ maxWidth, padding, centered }), className)}>
      {children}
    </div>
  )
}
