'use client'

import * as React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface BreadcrumbItem {
  title: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const allItems = showHome 
    ? [{ title: 'Accueil', href: '/' }, ...items]
    : items

  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {allItems.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
            )}
            
            {item.current || !item.href ? (
              <span className={cn(
                'flex items-center text-sm font-medium',
                item.current 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              )}>
                {index === 0 && showHome && (
                  <Home className="h-4 w-4 mr-2" />
                )}
                {item.title}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
                  'hover:underline'
                )}
              >
                {index === 0 && showHome && (
                  <Home className="h-4 w-4 mr-2" />
                )}
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}