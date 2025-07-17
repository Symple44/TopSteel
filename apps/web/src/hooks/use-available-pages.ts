'use client'

import { useState, useEffect, useCallback } from 'react'

export interface PageItem {
  id: string
  title: string
  href: string
  description?: string
  icon?: string
  category: string
  subcategory?: string
  tags?: string[]
  permissions?: string[]
  roles?: string[]
  moduleId?: string
  isEnabled: boolean
  isVisible: boolean
}

export interface PageCategory {
  id: string
  title: string
  description?: string
  icon?: string
  pages: PageItem[]
  subcategories?: PageSubcategory[]
}

export interface PageSubcategory {
  id: string
  title: string
  description?: string
  icon?: string
  pages: PageItem[]
}

// Pages disponibles dans l'application (structure simulée)
const mockAvailablePages: PageCategory[] = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    description: 'Vues d\'ensemble et métriques principales',
    icon: 'LayoutDashboard',
    pages: [
      {
        id: 'main-dashboard',
        title: 'Accueil',
        href: '/dashboard',
        description: 'Vue d\'ensemble de l\'activité',
        icon: 'Home',
        category: 'dashboard',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'analytics-dashboard',
        title: 'Analyses',
        href: '/dashboard/analytics',
        description: 'Analyses et statistiques détaillées',
        icon: 'BarChart3',
        category: 'dashboard',
        isEnabled: true,
        isVisible: true
      }
    ]
  },
  {
    id: 'production',
    title: 'Production',
    description: 'Gestion de la production et des processus',
    icon: 'Factory',
    pages: [
      {
        id: 'production-overview',
        title: 'Vue d\'ensemble',
        href: '/production',
        description: 'État général de la production',
        icon: 'Activity',
        category: 'production',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'production-planning',
        title: 'Planification',
        href: '/production/planning',
        description: 'Planification des ordres de production',
        icon: 'Calendar',
        category: 'production',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'quality-control',
        title: 'Contrôle qualité',
        href: '/production/quality',
        description: 'Contrôle et assurance qualité',
        icon: 'Shield',
        category: 'production',
        isEnabled: true,
        isVisible: true
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventaire',
    description: 'Gestion des stocks et approvisionnements',
    icon: 'Package',
    pages: [
      {
        id: 'inventory-overview',
        title: 'État des stocks',
        href: '/inventory',
        description: 'Vue d\'ensemble des stocks',
        icon: 'Package',
        category: 'inventory',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'inventory-movements',
        title: 'Mouvements',
        href: '/inventory/movements',
        description: 'Historique des mouvements de stock',
        icon: 'ArrowUpDown',
        category: 'inventory',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'suppliers',
        title: 'Fournisseurs',
        href: '/inventory/suppliers',
        description: 'Gestion des fournisseurs',
        icon: 'Truck',
        category: 'inventory',
        isEnabled: true,
        isVisible: true
      }
    ]
  },
  {
    id: 'sales',
    title: 'Ventes',
    description: 'Gestion commerciale et relations clients',
    icon: 'TrendingUp',
    pages: [
      {
        id: 'sales-overview',
        title: 'Vue d\'ensemble',
        href: '/sales',
        description: 'Tableau de bord des ventes',
        icon: 'TrendingUp',
        category: 'sales',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'customers',
        title: 'Clients',
        href: '/sales/customers',
        description: 'Gestion de la base clients',
        icon: 'Users',
        category: 'sales',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'orders',
        title: 'Commandes',
        href: '/sales/orders',
        description: 'Gestion des commandes clients',
        icon: 'FileText',
        category: 'sales',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'quotations',
        title: 'Devis',
        href: '/sales/quotations',
        description: 'Création et suivi des devis',
        icon: 'FileBarChart',
        category: 'sales',
        isEnabled: true,
        isVisible: true
      }
    ]
  },
  {
    id: 'finance',
    title: 'Finance',
    description: 'Gestion financière et comptabilité',
    icon: 'CreditCard',
    pages: [
      {
        id: 'finance-overview',
        title: 'Vue d\'ensemble',
        href: '/finance',
        description: 'Tableau de bord financier',
        icon: 'PieChart',
        category: 'finance',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'invoicing',
        title: 'Facturation',
        href: '/finance/invoicing',
        description: 'Gestion de la facturation',
        icon: 'Receipt',
        category: 'finance',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'payments',
        title: 'Paiements',
        href: '/finance/payments',
        description: 'Suivi des paiements',
        icon: 'CreditCard',
        category: 'finance',
        isEnabled: true,
        isVisible: true
      }
    ]
  },
  {
    id: 'hr',
    title: 'Ressources Humaines',
    description: 'Gestion du personnel et des compétences',
    icon: 'UserCheck',
    pages: [
      {
        id: 'employees',
        title: 'Employés',
        href: '/hr/employees',
        description: 'Gestion des employés',
        icon: 'Users',
        category: 'hr',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'attendance',
        title: 'Présences',
        href: '/hr/attendance',
        description: 'Suivi des présences',
        icon: 'Clock',
        category: 'hr',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'training',
        title: 'Formations',
        href: '/hr/training',
        description: 'Gestion des formations',
        icon: 'GraduationCap',
        category: 'hr',
        isEnabled: true,
        isVisible: true
      }
    ]
  },
  {
    id: 'administration',
    title: 'Administration',
    description: 'Configuration et administration système',
    icon: 'Settings',
    pages: [
      {
        id: 'users',
        title: 'Utilisateurs',
        href: '/admin/users',
        description: 'Gestion des utilisateurs',
        icon: 'Users',
        category: 'administration',
        permissions: ['admin.users.read'],
        roles: ['ADMIN'],
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'roles',
        title: 'Rôles et permissions',
        href: '/admin/roles',
        description: 'Gestion des rôles et permissions',
        icon: 'Shield',
        category: 'administration',
        permissions: ['admin.roles.read'],
        roles: ['ADMIN'],
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'system-settings',
        title: 'Paramètres système',
        href: '/admin/settings',
        description: 'Configuration du système',
        icon: 'Cog',
        category: 'administration',
        permissions: ['admin.settings.read'],
        roles: ['ADMIN'],
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'notifications',
        title: 'Notifications',
        href: '/admin/notifications',
        description: 'Gestion des notifications',
        icon: 'Bell',
        category: 'administration',
        permissions: ['admin.notifications.read'],
        roles: ['ADMIN'],
        isEnabled: true,
        isVisible: true
      }
    ]
  },
  {
    id: 'reports',
    title: 'Rapports',
    description: 'Rapports et analyses avancées',
    icon: 'FileBarChart',
    pages: [
      {
        id: 'production-reports',
        title: 'Rapports de production',
        href: '/reports/production',
        description: 'Analyses de la production',
        icon: 'Factory',
        category: 'reports',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'sales-reports',
        title: 'Rapports de ventes',
        href: '/reports/sales',
        description: 'Analyses commerciales',
        icon: 'TrendingUp',
        category: 'reports',
        isEnabled: true,
        isVisible: true
      },
      {
        id: 'financial-reports',
        title: 'Rapports financiers',
        href: '/reports/finance',
        description: 'Analyses financières',
        icon: 'PieChart',
        category: 'reports',
        isEnabled: true,
        isVisible: true
      }
    ]
  }
]

export function useAvailablePages() {
  const [categories, setCategories] = useState<PageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAvailablePages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setCategories(mockAvailablePages)
    } catch (err) {
      console.error('Erreur lors du chargement des pages disponibles:', err)
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllPages = useCallback((): PageItem[] => {
    return categories.flatMap(category => category.pages)
  }, [categories])

  const getPagesByCategory = useCallback((categoryId: string): PageItem[] => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.pages || []
  }, [categories])

  const searchPages = useCallback((query: string): PageItem[] => {
    const lowerQuery = query.toLowerCase()
    return getAllPages().filter(page => 
      page.title.toLowerCase().includes(lowerQuery) ||
      page.description?.toLowerCase().includes(lowerQuery) ||
      page.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }, [getAllPages])

  const getPageById = useCallback((pageId: string): PageItem | undefined => {
    return getAllPages().find(page => page.id === pageId)
  }, [getAllPages])

  useEffect(() => {
    loadAvailablePages()
  }, [loadAvailablePages])

  return {
    categories,
    loading,
    error,
    getAllPages,
    getPagesByCategory,
    searchPages,
    getPageById,
    refreshPages: loadAvailablePages
  }
}