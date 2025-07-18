import { PageItem, PageCategory } from '@/hooks/use-available-pages'
import { readdirSync, statSync, readFileSync } from 'fs'
import { join } from 'path'

export interface DiscoveredPage {
  id: string
  title: string
  href: string
  description?: string
  icon?: string
  category: string
  subcategory?: string
  permissions?: string[]
  roles?: string[]
  moduleId?: string
  isEnabled: boolean
  isVisible: boolean
}

export interface PageMetadata {
  title?: string
  description?: string
  icon?: string
  permissions?: string[]
  roles?: string[]
  moduleId?: string
  category?: string
  subcategory?: string
}

/**
 * Service pour découvrir automatiquement les pages disponibles
 * dans le dossier (dashboard) et les associer avec les permissions
 */
export class PageDiscoveryService {
  private readonly basePath = process.cwd()
  private readonly dashboardPath = 'src/app/(dashboard)'
  
  /**
   * Scan les pages disponibles dans le dossier (dashboard)
   */
  discoverPages(): PageCategory[] {
    try {
      const pages = this.scanDashboardPages()
      const pagesWithCorrectTitles = this.applyStaticMetadata(pages)
      const categorizedPages = this.categorizePages(pagesWithCorrectTitles)
      return categorizedPages
    } catch (error) {
      console.error('Erreur lors de la découverte des pages:', error)
      return []
    }
  }

  /**
   * Scan récursivement les pages dans le dossier (dashboard)
   */
  private scanDashboardPages(): DiscoveredPage[] {
    const pages: DiscoveredPage[] = []
    const fullPath = join(this.basePath, this.dashboardPath)
    
    try {
      this.scanDirectory(fullPath, '', pages)
    } catch (error) {
      console.error('Erreur lors du scan des pages:', error)
    }
    
    return pages
  }

  /**
   * Scan récursivement un dossier pour trouver les pages
   */
  private scanDirectory(dirPath: string, relativePath: string, pages: DiscoveredPage[]): void {
    try {
      const items = readdirSync(dirPath)
      
      for (const item of items) {
        const itemPath = join(dirPath, item)
        const itemStats = statSync(itemPath)
        
        if (itemStats.isDirectory()) {
          // Ignorer les dossiers spéciaux de Next.js
          if (item.startsWith('_') || item.startsWith('.')) {
            continue
          }
          
          const newRelativePath = relativePath ? `${relativePath}/${item}` : item
          this.scanDirectory(itemPath, newRelativePath, pages)
        } else if (item === 'page.tsx') {
          // Trouvé une page
          const pageInfo = this.extractPageInfo(itemPath, relativePath)
          if (pageInfo) {
            pages.push(pageInfo)
          }
        }
      }
    } catch (error) {
      console.error(`Erreur lors du scan du dossier ${dirPath}:`, error)
    }
  }

  /**
   * Extrait les informations d'une page
   */
  private extractPageInfo(filePath: string, relativePath: string): DiscoveredPage | null {
    try {
      // Lire le fichier pour extraire les métadonnées
      const content = readFileSync(filePath, 'utf-8')
      
      // Construire l'href
      const href = relativePath ? `/${relativePath}` : '/'
      
      // Extraire les métadonnées du fichier
      const metadata = this.extractMetadata(content)
      
      // Déterminer la catégorie basée sur le chemin
      const category = this.determineCategoryFromPath(relativePath)
      
      // Générer un ID unique
      const id = this.generatePageId(relativePath)
      
      // Titre par défaut basé sur le chemin
      const defaultTitle = this.generateTitleFromPath(relativePath)
      
      return {
        id,
        title: metadata.title || defaultTitle,
        href,
        description: metadata.description,
        icon: metadata.icon,
        category: metadata.category || category,
        subcategory: metadata.subcategory,
        permissions: metadata.permissions,
        roles: metadata.roles,
        moduleId: metadata.moduleId,
        isEnabled: true,
        isVisible: true
      }
    } catch (error) {
      console.error(`Erreur lors de l'extraction des infos de ${filePath}:`, error)
      return null
    }
  }

  /**
   * Extrait les métadonnées d'un fichier de page
   */
  private extractMetadata(content: string): PageMetadata {
    const metadata: PageMetadata = {}
    
    // Chercher les métadonnées dans les commentaires
    const metadataComment = content.match(/\/\*\*\s*PAGE_METADATA\s*([\s\S]*?)\*\//)
    if (metadataComment) {
      try {
        const metadataStr = metadataComment[1]
        const lines = metadataStr.split('\n')
        
        for (const line of lines) {
          const match = line.match(/^\s*\*\s*@(\w+)\s+(.+)$/)
          if (match) {
            const [, key, value] = match
            switch (key) {
              case 'title':
                metadata.title = value.trim()
                break
              case 'description':
                metadata.description = value.trim()
                break
              case 'icon':
                metadata.icon = value.trim()
                break
              case 'category':
                metadata.category = value.trim()
                break
              case 'subcategory':
                metadata.subcategory = value.trim()
                break
              case 'permissions':
                metadata.permissions = value.split(',').map(p => p.trim())
                break
              case 'roles':
                metadata.roles = value.split(',').map(r => r.trim())
                break
              case 'moduleId':
                metadata.moduleId = value.trim()
                break
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du parsing des métadonnées:', error)
      }
    }
    
    // Chercher le titre dans les composants
    if (!metadata.title) {
      const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/) || 
                         content.match(/title:\s*['"`]([^'"`]+)['"`]/)
      if (titleMatch) {
        metadata.title = titleMatch[1].trim()
      }
    }
    
    return metadata
  }

  /**
   * Détermine la catégorie basée sur le chemin
   */
  private determineCategoryFromPath(path: string): string {
    const segments = path.split('/')
    const firstSegment = segments[0]
    
    const categoryMap: Record<string, string> = {
      '': 'dashboard',
      'dashboard': 'dashboard',
      'admin': 'administration',
      'settings': 'settings',
      'profile': 'profile',
      'planning': 'planning',
      'production': 'production',
      'stocks': 'inventory',
      'clients': 'sales',
      'fournisseurs': 'suppliers',
      'commandes': 'orders',
      'devis': 'quotes',
      'facturation': 'billing',
      'finance': 'finance',
      'users': 'users',
      'roles': 'roles',
      'notifications': 'notifications',
      'reports': 'reports',
      'maintenance': 'maintenance',
      'qualite': 'quality',
      'tracabilite': 'traceability'
    }
    
    return categoryMap[firstSegment] || 'other'
  }

  /**
   * Génère un ID unique pour une page
   */
  private generatePageId(path: string): string {
    return path.replace(/\//g, '-') || 'home'
  }

  /**
   * Génère un titre par défaut basé sur le chemin
   */
  private generateTitleFromPath(path: string): string {
    if (!path) return 'Accueil'
    
    const segments = path.split('/')
    const lastSegment = segments[segments.length - 1]
    
    // Capitaliser et remplacer les tirets/underscores par des espaces
    return lastSegment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  /**
   * Applique des métadonnées statiques pour corriger les titres
   */
  private applyStaticMetadata(pages: DiscoveredPage[]): DiscoveredPage[] {
    const staticMetadata: Record<string, Partial<DiscoveredPage>> = {
      'admin': { title: 'Administration', description: 'Panneau d\'administration principal' },
      'settings': { title: 'Paramètres', description: 'Paramètres utilisateur et système' },
      'profile': { title: 'Profil', description: 'Profil utilisateur et préférences' },
      'dashboard': { title: 'Tableau de bord', description: 'Vue d\'ensemble du système' },
      'home': { title: 'Accueil', description: 'Page d\'accueil' },
      'admin-company': { title: 'Entreprise', description: 'Informations sur l\'entreprise' },
      'admin-menu-config': { title: 'Configuration Menu', description: 'Configuration des menus' },
      'admin-database': { title: 'Base de données', description: 'Gestion de la base de données' },
      'admin-users': { title: 'Utilisateurs', description: 'Gestion des utilisateurs' },
      'admin-roles': { title: 'Rôles', description: 'Gestion des rôles et permissions' },
      'admin-notifications-rules': { title: 'Règles de notification', description: 'Configuration des notifications' },
      'settings-menu': { title: 'Menu personnalisé', description: 'Personnalisation du menu' },
      'planning-test': { title: 'Planning de test', description: 'Page de test pour la planification' }
    }

    return pages.map(page => {
      const staticMeta = staticMetadata[page.id]
      if (staticMeta) {
        return {
          ...page,
          ...staticMeta
        }
      }
      return page
    })
  }

  /**
   * Catégorise les pages découvertes
   */
  private categorizePages(pages: DiscoveredPage[]): PageCategory[] {
    const categoryMap = new Map<string, PageCategory>()
    
    for (const page of pages) {
      const categoryId = page.category
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          title: this.getCategoryTitle(categoryId),
          description: this.getCategoryDescription(categoryId),
          icon: this.getCategoryIcon(categoryId),
          pages: []
        })
      }
      
      const category = categoryMap.get(categoryId)!
      category.pages.push(page)
    }
    
    // Trier les pages dans chaque catégorie
    for (const category of categoryMap.values()) {
      category.pages.sort((a, b) => a.title.localeCompare(b.title))
    }
    
    return Array.from(categoryMap.values()).sort((a, b) => a.title.localeCompare(b.title))
  }

  /**
   * Obtient le titre d'une catégorie
   */
  private getCategoryTitle(categoryId: string): string {
    const titles: Record<string, string> = {
      'dashboard': 'Tableau de bord',
      'administration': 'Administration',
      'settings': 'Paramètres',
      'profile': 'Profil',
      'planning': 'Planification',
      'production': 'Production',
      'inventory': 'Inventaire',
      'sales': 'Ventes',
      'suppliers': 'Fournisseurs',
      'orders': 'Commandes',
      'quotes': 'Devis',
      'billing': 'Facturation',
      'finance': 'Finance',
      'users': 'Utilisateurs',
      'roles': 'Rôles',
      'notifications': 'Notifications',
      'reports': 'Rapports',
      'maintenance': 'Maintenance',
      'quality': 'Qualité',
      'traceability': 'Traçabilité',
      'other': 'Autres'
    }
    
    return titles[categoryId] || categoryId
  }

  /**
   * Obtient la description d'une catégorie
   */
  private getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      'dashboard': 'Vues d\'ensemble et métriques principales',
      'administration': 'Configuration et administration système',
      'settings': 'Paramètres utilisateur et système',
      'profile': 'Profil utilisateur et préférences',
      'planning': 'Planification et ordonnancement',
      'production': 'Gestion de la production',
      'inventory': 'Gestion des stocks',
      'sales': 'Gestion commerciale',
      'suppliers': 'Gestion des fournisseurs',
      'orders': 'Gestion des commandes',
      'quotes': 'Gestion des devis',
      'billing': 'Facturation et paiements',
      'finance': 'Gestion financière',
      'users': 'Gestion des utilisateurs',
      'roles': 'Gestion des rôles et permissions',
      'notifications': 'Gestion des notifications',
      'reports': 'Rapports et analyses',
      'maintenance': 'Maintenance et support',
      'quality': 'Contrôle qualité',
      'traceability': 'Traçabilité et audit',
      'other': 'Autres fonctionnalités'
    }
    
    return descriptions[categoryId] || ''
  }

  /**
   * Obtient l'icône d'une catégorie
   */
  private getCategoryIcon(categoryId: string): string {
    const icons: Record<string, string> = {
      'dashboard': 'LayoutDashboard',
      'administration': 'Settings',
      'settings': 'Settings',
      'profile': 'User',
      'planning': 'Calendar',
      'production': 'Factory',
      'inventory': 'Package',
      'sales': 'TrendingUp',
      'suppliers': 'Truck',
      'orders': 'FileText',
      'quotes': 'FileBarChart',
      'billing': 'Receipt',
      'finance': 'CreditCard',
      'users': 'Users',
      'roles': 'Shield',
      'notifications': 'Bell',
      'reports': 'FileBarChart',
      'maintenance': 'Wrench',
      'quality': 'CheckCircle',
      'traceability': 'Search',
      'other': 'MoreHorizontal'
    }
    
    return icons[categoryId] || 'Circle'
  }
}

// Instance singleton
export const pageDiscoveryService = new PageDiscoveryService()