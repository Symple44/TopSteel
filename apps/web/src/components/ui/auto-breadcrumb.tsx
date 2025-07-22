/**
 * Composant Auto Breadcrumb - Navigation en fil d'Ariane automatique
 * Fichier: apps/web/src/components/ui/auto-breadcrumb.tsx
 */

'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Breadcrumb, BreadcrumbItem } from './breadcrumb'

// Configuration des titres des routes
const routeTitles: Record<string, string> = {
  '': 'Accueil',
  'admin': 'Administration',
  'settings': 'Paramètres',
  'appearance': 'Apparence',
  'notifications': 'Notifications',
  'security': 'Sécurité',
  'menu': 'Personnalisation du menu',
  'users': 'Gestion des utilisateurs',
  'sessions': 'Sessions utilisateurs',
  'company': 'Configuration entreprise',
  'database': 'Base de données',
  'menu-config': 'Configuration des menus',
  'roles': 'Rôles et permissions',
  'translations': 'Traductions',
  'profile': 'Profil',
  'dashboard': 'Tableau de bord',
  'planning': 'Planning',
  'test': 'Test'
}

export function AutoBreadcrumb() {
  const pathname = usePathname()
  
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
      const title = routeTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      breadcrumbs.push({
        title,
        href: isLast ? undefined : currentPath,
        current: isLast
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
    <div className="mb-6">
      <Breadcrumb items={breadcrumbs} showHome={true} />
    </div>
  )
}