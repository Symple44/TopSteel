'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link.js'
import { cn } from '../../../lib/utils'

export interface BreadcrumbItem {
  title: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
  /** Label pour l'accessibilité (traduit) */
  ariaLabel?: string
}

/**
 * Composant Breadcrumb accessible
 * - Utilise la sémantique HTML appropriée (nav > ol > li)
 * - Inclut aria-current="page" pour la page actuelle
 * - Cache les icônes décoratives des lecteurs d'écran
 */
export function Breadcrumb({
  items,
  className,
  showHome = true,
  ariaLabel = 'Fil d\'Ariane'
}: BreadcrumbProps) {
  const allItems = showHome ? [{ title: 'Accueil', href: '/' }, ...items] : items

  return (
    <nav
      className={cn('flex', className)}
      aria-label={ariaLabel}
      role="navigation"
    >
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {allItems.map((item, index) => (
          <li
            key={item.href || `breadcrumb-title-${item.title}` || `breadcrumb-index-${index}`}
            className="inline-flex items-center"
          >
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 text-muted-foreground mx-1"
                aria-hidden="true"
              />
            )}

            {item.current || !item.href ? (
              <span
                className={cn(
                  'flex items-center text-sm font-medium',
                  item.current ? 'text-foreground' : 'text-muted-foreground'
                )}
                aria-current="page"
              >
                {index === 0 && showHome && (
                  <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                {item.title}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
                  'hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded'
                )}
              >
                {index === 0 && showHome && (
                  <Home className="h-4 w-4 mr-2" aria-hidden="true" />
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
