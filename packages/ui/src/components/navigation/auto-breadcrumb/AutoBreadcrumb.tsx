/**
 * Composant Auto Breadcrumb - Navigation en fil d'Ariane automatique
 */

'use client'

import { Breadcrumb, type BreadcrumbItem } from '../breadcrumb'

export interface AutoBreadcrumbProps {
  pathname: string
  // Translation function prop
  translateSegment?: (segment: string) => string
  className?: string
}

export function AutoBreadcrumb({
  pathname,
  translateSegment = (segment) => segment.charAt(0).toUpperCase() + segment.slice(1),
  className,
}: AutoBreadcrumbProps) {
  // Générer les éléments du breadcrumb basés sur l'URL
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    // Page d'accueil - ne pas afficher de breadcrumb
    if (pathname === '/') {
      return []
    }

    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Construire le chemin progressivement
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      // Utiliser la traduction ou fallback sur le segment formaté
      const title = translateSegment(segment)

      breadcrumbs.push({
        title,
        href: isLast ? undefined : currentPath,
        current: isLast,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Ne pas afficher le breadcrumb sur la page d'accueil ou s'il n'y a pas d'éléments
  if (pathname === '/' || breadcrumbs.length === 0) {
    return null
  }

  return (
    <div className={className || 'mb-6'}>
      <Breadcrumb items={breadcrumbs} showHome={true} />
    </div>
  )
}
