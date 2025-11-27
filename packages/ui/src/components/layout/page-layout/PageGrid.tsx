'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { cn } from '../../../lib/utils'

const pageGridVariants = cva('grid gap-4 sm:gap-6', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      'auto-fill': 'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
  },
  defaultVariants: {
    cols: 2,
    align: 'stretch',
  },
})

export interface PageGridProps extends VariantProps<typeof pageGridVariants> {
  children: ReactNode
  className?: string
}

/**
 * PageGrid - Grille responsive pour organiser le contenu
 */
export function PageGrid({ children, cols, align, className }: PageGridProps) {
  return <div className={cn(pageGridVariants({ cols, align }), className)}>{children}</div>
}

/**
 * PageRow - Ligne flex pour organiser les éléments horizontalement
 */
export interface PageRowProps {
  children: ReactNode
  className?: string
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  align?: 'start' | 'center' | 'end' | 'stretch'
  gap?: 'none' | 'sm' | 'default' | 'lg'
  wrap?: boolean
}

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const gapMap = {
  none: 'gap-0',
  sm: 'gap-2',
  default: 'gap-4',
  lg: 'gap-6',
}

export function PageRow({
  children,
  className,
  justify = 'start',
  align = 'center',
  gap = 'default',
  wrap = false,
}: PageRowProps) {
  return (
    <div
      className={cn(
        'flex',
        justifyMap[justify],
        alignMap[align],
        gapMap[gap],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  )
}
