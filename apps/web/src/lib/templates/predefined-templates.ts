/**
 * Templates prédéfinis pour l'interface utilisateur
 * Fichier: apps/web/src/lib/templates/predefined-templates.ts
 */

import type { AppearanceSettings } from '@/hooks/use-appearance-settings'

export interface Template {
  id: string
  name: string
  description: string
  category: 'business' | 'role' | 'productivity' | 'accessibility'
  preview: string // URL ou nom de l'image de preview
  settings: AppearanceSettings
  tags: string[]
}

export const predefinedTemplates: Template[] = [
  // Templates Métier
  {
    id: 'production-focus',
    name: 'Production Focus',
    description:
      'Interface optimisée pour les équipes de production avec vue compacte et couleurs énergisantes',
    category: 'business',
    preview: '/templates/production-focus.png',
    settings: {
      theme: 'light',
      language: 'fr',
      fontSize: 'medium',
      sidebarWidth: 'compact',
      density: 'compact',
      accentColor: 'orange',
      contentWidth: 'full',
    },
    tags: ['production', 'compact', 'efficacité'],
  },
  {
    id: 'sales-dashboard',
    name: 'Sales Dashboard',
    description:
      'Interface dynamique pour les équipes commerciales avec mise en évidence des données importantes',
    category: 'business',
    preview: '/templates/sales-dashboard.png',
    settings: {
      theme: 'vibrant',
      language: 'fr',
      fontSize: 'medium',
      sidebarWidth: 'normal',
      density: 'comfortable',
      accentColor: 'green',
      contentWidth: 'full',
    },
    tags: ['ventes', 'commercial', 'dynamique'],
  },
  {
    id: 'admin-control',
    name: 'Admin Control',
    description:
      "Interface administrative avec accent sur la lisibilité et l'organisation des données",
    category: 'business',
    preview: '/templates/admin-control.png',
    settings: {
      theme: 'light',
      language: 'fr',
      fontSize: 'medium',
      sidebarWidth: 'wide',
      density: 'spacious',
      accentColor: 'blue',
      contentWidth: 'compact',
    },
    tags: ['administration', 'contrôle', 'lisibilité'],
  },
  {
    id: 'finance-precision',
    name: 'Finance Precision',
    description:
      "Interface sobre et précise pour les équipes financières avec densité élevée d'information",
    category: 'business',
    preview: '/templates/finance-precision.png',
    settings: {
      theme: 'light',
      language: 'fr',
      fontSize: 'small',
      sidebarWidth: 'compact',
      density: 'compact',
      accentColor: 'purple',
      contentWidth: 'compact',
    },
    tags: ['finance', 'précision', 'données'],
  },

  // Templates par Rôle
  {
    id: 'manager-overview',
    name: 'Manager Overview',
    description: "Vue d'ensemble pour les managers avec focus sur les KPI et tableaux de bord",
    category: 'role',
    preview: '/templates/manager-overview.png',
    settings: {
      theme: 'dark',
      language: 'fr',
      fontSize: 'large',
      sidebarWidth: 'normal',
      density: 'comfortable',
      accentColor: 'blue',
      contentWidth: 'full',
    },
    tags: ['management', 'KPI', "vue d'ensemble"],
  },
  {
    id: 'operator-efficiency',
    name: 'Operator Efficiency',
    description:
      'Interface simplifiée pour les opérateurs avec accès rapide aux fonctions essentielles',
    category: 'role',
    preview: '/templates/operator-efficiency.png',
    settings: {
      theme: 'light',
      language: 'fr',
      fontSize: 'large',
      sidebarWidth: 'compact',
      density: 'spacious',
      accentColor: 'green',
      contentWidth: 'full',
    },
    tags: ['opérateur', 'simplicité', 'efficacité'],
  },

  // Templates Productivité
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    description: 'Interface minimaliste pour maximiser la concentration sur les tâches importantes',
    category: 'productivity',
    preview: '/templates/focus-mode.png',
    settings: {
      theme: 'dark',
      language: 'fr',
      fontSize: 'medium',
      sidebarWidth: 'compact',
      density: 'comfortable',
      accentColor: 'purple',
      contentWidth: 'compact',
    },
    tags: ['focus', 'minimalisme', 'concentration'],
  },
  {
    id: 'data-intensive',
    name: 'Data Intensive',
    description: "Maximise l'espace disponible pour l'affichage de grandes quantités de données",
    category: 'productivity',
    preview: '/templates/data-intensive.png',
    settings: {
      theme: 'light',
      language: 'fr',
      fontSize: 'small',
      sidebarWidth: 'compact',
      density: 'compact',
      accentColor: 'blue',
      contentWidth: 'full',
    },
    tags: ['données', 'espace', 'information'],
  },

  // Templates Accessibilité
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Contraste élevé et police large pour une meilleure accessibilité visuelle',
    category: 'accessibility',
    preview: '/templates/high-contrast.png',
    settings: {
      theme: 'dark',
      language: 'fr',
      fontSize: 'large',
      sidebarWidth: 'wide',
      density: 'spacious',
      accentColor: 'orange',
      contentWidth: 'compact',
    },
    tags: ['accessibilité', 'contraste', 'visibilité'],
  },
  {
    id: 'comfort-reading',
    name: 'Comfort Reading',
    description: 'Optimisé pour réduire la fatigue oculaire lors de longues sessions de travail',
    category: 'accessibility',
    preview: '/templates/comfort-reading.png',
    settings: {
      theme: 'vibrant',
      language: 'fr',
      fontSize: 'large',
      sidebarWidth: 'normal',
      density: 'spacious',
      accentColor: 'green',
      contentWidth: 'compact',
    },
    tags: ['confort', 'lecture', 'fatigue oculaire'],
  },
]

export const templateCategories = {
  business: {
    name: 'Métier',
    description: "Templates optimisés par secteur d'activité",
    icon: 'Building2',
  },
  role: {
    name: 'Rôle',
    description: 'Templates adaptés selon votre fonction',
    icon: 'Users',
  },
  productivity: {
    name: 'Productivité',
    description: 'Templates pour optimiser votre efficacité',
    icon: 'Zap',
  },
  accessibility: {
    name: 'Accessibilité',
    description: 'Templates pour une meilleure expérience utilisateur',
    icon: 'Eye',
  },
} as const

/**
 * Recherche de templates par critères
 */
export function searchTemplates(query: string, category?: string): Template[] {
  const filteredByCategory = category
    ? predefinedTemplates?.filter((template) => template.category === category)
    : predefinedTemplates

  if (!query?.trim()) {
    return filteredByCategory
  }

  const searchTerm = query?.toLowerCase()
  return filteredByCategory?.filter(
    (template) =>
      template?.name?.toLowerCase().includes(searchTerm) ||
      template?.description?.toLowerCase().includes(searchTerm) ||
      template?.tags?.some((tag) => tag?.toLowerCase().includes(searchTerm))
  )
}

/**
 * Obtient un template par son ID
 */
export function getTemplateById(id: string): Template | undefined {
  return predefinedTemplates?.find((template) => template.id === id)
}

/**
 * Obtient les templates recommandés pour un utilisateur
 * (peut être étendu avec de la logique basée sur le rôle/usage)
 */
export function getRecommendedTemplates(): Template[] {
  // Pour l'instant, retourne les templates les plus populaires
  // Peut être étendu avec de l'analyse d'usage
  return [
    predefinedTemplates?.find((t) => t.id === 'sales-dashboard'),
    predefinedTemplates?.find((t) => t.id === 'admin-control'),
    predefinedTemplates?.find((t) => t.id === 'focus-mode'),
    predefinedTemplates?.find((t) => t.id === 'production-focus'),
  ].filter(Boolean) as Template[]
}
