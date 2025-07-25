import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DiscoveredPage } from '../entities/discovered-page.entity'
import { pageDiscoveryService } from '../../../services/page-discovery.service'

export interface PageSyncResult {
  discovered: number
  synced: number
  errors: string[]
}

@Injectable()
export class PageSyncService {
  constructor(
    @InjectRepository(DiscoveredPage, 'auth')
    private readonly discoveredPageRepository: Repository<DiscoveredPage>
  ) {}

  /**
   * Synchronise les pages découvertes avec la base de données
   */
  async syncPages(): Promise<PageSyncResult> {
    const result: PageSyncResult = {
      discovered: 0,
      synced: 0,
      errors: []
    }

    try {
      // Découvrir les pages disponibles
      const categories = pageDiscoveryService.discoverPages()
      const allPages = categories.flatMap(category => category.pages)
      
      result.discovered = allPages.length

      // Synchroniser chaque page
      for (const page of allPages) {
        try {
          await this.syncSinglePage(page)
          result.synced++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          result.errors.push(`Erreur pour la page ${page.id}: ${errorMessage}`)
        }
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      result.errors.push(`Erreur générale: ${errorMessage}`)
      return result
    }
  }

  /**
   * Synchronise une seule page avec la base de données
   */
  private async syncSinglePage(page: any): Promise<void> {
    // Vérifier si la page existe déjà
    const existingPage = await this.discoveredPageRepository.findOne({
      where: { pageId: page.id }
    })

    if (!existingPage) {
      // Créer une nouvelle entrée avec les permissions les plus élevées
      const newPage = this.discoveredPageRepository.create({
        pageId: page.id,
        title: page.title,
        href: page.href,
        description: page.description,
        icon: page.icon,
        category: page.category,
        subcategory: page.subcategory,
        requiredPermissions: page.permissions ? page.permissions.join(',') : null,
        requiredRoles: page.roles ? page.roles.join(',') : null,
        moduleId: page.moduleId,
        isVisible: true,
        isEnabled: true,
        defaultOrder: 0,
        // Accorder l'accès au niveau le plus élevé par défaut
        defaultAccessLevel: 'ADMIN'
      })

      await this.discoveredPageRepository.save(newPage)
    } else {
      // Mettre à jour les informations existantes
      await this.discoveredPageRepository.update(existingPage.id, {
        title: page.title,
        href: page.href,
        description: page.description,
        icon: page.icon,
        category: page.category,
        subcategory: page.subcategory,
        requiredPermissions: page.permissions ? page.permissions.join(',') : null,
        requiredRoles: page.roles ? page.roles.join(',') : null,
        moduleId: page.moduleId,
        isEnabled: page.isEnabled,
        isVisible: page.isVisible
      })
    }
  }

  /**
   * Obtient les pages autorisées pour un utilisateur
   */
  async getAuthorizedPages(userId: string, userRole: string, userPermissions: string[]): Promise<any[]> {
    const allPages = await this.discoveredPageRepository.find({
      where: { isEnabled: true }
    })

    const authorizedPages = allPages.filter(page => {
      // Vérifier les rôles requis
      if (page.requiredRoles) {
        const requiredRoles = page.requiredRoles.split(',').map(r => r.trim())
        if (!requiredRoles.includes(userRole)) {
          return false
        }
      }

      // Vérifier les permissions requises
      if (page.requiredPermissions) {
        const requiredPermissions = page.requiredPermissions.split(',').map(p => p.trim())
        const hasPermission = requiredPermissions.some(permission => 
          userPermissions.includes(permission)
        )
        if (!hasPermission) {
          return false
        }
      }

      return true
    })

    return authorizedPages
  }

  /**
   * Obtient les pages organisées par catégorie
   */
  async getPagesByCategory(userId: string, userRole: string, userPermissions: string[]): Promise<any[]> {
    const authorizedPages = await this.getAuthorizedPages(userId, userRole, userPermissions)
    
    // Organiser par catégorie
    const categoryMap = new Map<string, any>()
    
    for (const page of authorizedPages) {
      const categoryId = page.category || 'other'
      
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
      category.pages.push({
        id: page.pageId,
        title: page.title,
        href: page.href,
        description: page.description,
        icon: page.icon,
        category: page.category,
        subcategory: page.subcategory,
        permissions: page.requiredPermissions ? page.requiredPermissions.split(',') : [],
        roles: page.requiredRoles ? page.requiredRoles.split(',') : [],
        moduleId: page.moduleId,
        isEnabled: page.isEnabled,
        isVisible: page.isVisible
      })
    }
    
    return Array.from(categoryMap.values())
  }

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