import type { Prisma, DiscoveredPage } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

// Type helper for partial updates
type DeepPartial<T> = Partial<T>

import {
  type DiscoveredPage as DiscoveredPageInterface,
  pageDiscoveryService,
} from '../../../core/services/page-discovery.service'



export interface PageSyncResult {
  discovered: number
  synced: number
  errors: string[]
}

@Injectable()
export class PageSyncService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  /**
   * Synchronise les pages découvertes avec la base de données
   */
  async syncPages(): Promise<PageSyncResult> {
    const result: PageSyncResult = {
      discovered: 0,
      synced: 0,
      errors: [],
    }

    try {
      // Découvrir les pages disponibles
      const categories = pageDiscoveryService.discoverPages()
      const allPages = categories.flatMap((category) => category.pages)

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
  private async syncSinglePage(page: DiscoveredPageInterface): Promise<void> {
    // Vérifier si la page existe déjà
    const existingPage = await this.prisma.discoveredPage.findFirst({
      where: { id: page.id },
    })

    if (existingPage) {
      // Mettre à jour les informations existantes avec Prisma
      await this.prisma.discoveredPage.update({
        where: { id: existingPage.id },
        data: {
          title: page.title,
          path: (page as any).href,
          description: page.description,
          icon: page.icon,
          category: page.category,
          isActive: (page as any).isActive !== false,
          metadata: {
            subcategory: page.subcategory,
            requiredPermissions: page.permissions ? page.permissions.join(',') : undefined,
            requiredRoles: page.roles ? page.roles.join(',') : undefined,
            moduleId: page.moduleId,
            isVisible: page.isVisible,
          },
        },
      })
    } else {
      // Créer une nouvelle entrée avec Prisma
      await this.prisma.discoveredPage.create({
        data: {
          id: page.id,
          title: page.title,
          path: (page as any).href,
          description: page.description,
          icon: page.icon,
          category: page.category,
          isActive: true,
          metadata: {
            subcategory: page.subcategory,
            requiredPermissions: page.permissions ? page.permissions.join(',') : undefined,
            requiredRoles: page.roles ? page.roles.join(',') : undefined,
            moduleId: page.moduleId,
            isVisible: true,
            defaultOrder: 0,
            defaultAccessLevel: 'ADMIN',
          },
        },
      })
    }
  }

  /**
   * Obtient les pages autorisées pour un utilisateur
   */
  async getAuthorizedPages(
    _userId: string,
    userRole: string,
    userPermissions: string[]
  ): Promise<DiscoveredPage[]> {
    const allPages = await this.prisma.discoveredPage.findMany({
      where: { isActive: true },
    })

    const authorizedPages = allPages.filter((page: any) => {
      const metadata = page.metadata as any || {}

      // Vérifier les rôles requis
      if (metadata.requiredRoles) {
        const requiredRoles = metadata.requiredRoles.split(',').map((r: string) => r.trim())
        if (!requiredRoles.includes(userRole)) {
          return false
        }
      }

      // Vérifier les permissions requises
      if (metadata.requiredPermissions) {
        const requiredPermissions = metadata.requiredPermissions.split(',').map((p: string) => p.trim())
        const hasPermission = requiredPermissions.some((permission: string) =>
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
  async getPagesByCategory(
    userId: string,
    userRole: string,
    userPermissions: string[]
  ): Promise<
    {
      id: string
      title: string
      description: string
      icon: string
      pages: {
        id: string
        title: string
        href: string
        description: string | null
        icon: string | null
        category: string | null
        subcategory: string | null
        permissions: string[]
        roles: string[]
        moduleId: string | null
        isActive: boolean
        isVisible: boolean
      }[]
    }[]
  > {
    const authorizedPages = await this.getAuthorizedPages(userId, userRole, userPermissions)

    // Organiser par catégorie
    const categoryMap = new Map<
      string,
      {
        id: string
        title: string
        description: string
        icon: string
        pages: {
          id: string
          title: string
          href: string
          description: string | null
          icon: string | null
          category: string | null
          subcategory: string | null
          permissions: string[]
          roles: string[]
          moduleId: string | null
          isActive: boolean
          isVisible: boolean
        }[]
      }
    >()

    for (const page of authorizedPages) {
      const categoryId = page.category || 'other'

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          title: this.getCategoryTitle(categoryId),
          description: this.getCategoryDescription(categoryId),
          icon: this.getCategoryIcon(categoryId),
          pages: [],
        })
      }

      const category = categoryMap.get(categoryId)
      if (!category) continue
      const pageAny = page as any
      const metadata = pageAny.metadata as any || {}
      category.pages.push({
        id: pageAny.id,
        title: pageAny.title,
        href: pageAny.path || pageAny.href,
        description: pageAny.description || null,
        icon: pageAny.icon || null,
        category: pageAny.category,
        subcategory: metadata.subcategory || null,
        permissions: metadata.requiredPermissions ? metadata.requiredPermissions.split(',') : [],
        roles: metadata.requiredRoles ? metadata.requiredRoles.split(',') : [],
        moduleId: metadata.moduleId || null,
        isActive: pageAny.isActive || true,
        isVisible: metadata.isVisible !== false,
      } as any)
    }

    return Array.from(categoryMap.values())
  }

  private getCategoryTitle(categoryId: string): string {
    const titles: Record<string, string> = {
      dashboard: 'Tableau de bord',
      administration: 'Administration',
      settings: 'Paramètres',
      profile: 'Profil',
      planning: 'Planification',
      production: 'Production',
      inventory: 'Inventaire',
      sales: 'Ventes',
      suppliers: 'Fournisseurs',
      orders: 'Commandes',
      quotes: 'Devis',
      billing: 'Facturation',
      finance: 'Finance',
      users: 'Utilisateurs',
      roles: 'Rôles',
      notifications: 'Notifications',
      reports: 'Rapports',
      maintenance: 'Maintenance',
      quality: 'Qualité',
      traceability: 'Traçabilité',
      other: 'Autres',
    }

    return titles[categoryId] || categoryId
  }

  private getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      dashboard: "Vues d'ensemble et métriques principales",
      administration: 'Configuration et administration système',
      settings: 'Paramètres utilisateur et système',
      profile: 'Profil utilisateur et préférences',
      planning: 'Planification et ordonnancement',
      production: 'Gestion de la production',
      inventory: 'Gestion des stocks',
      sales: 'Gestion commerciale',
      suppliers: 'Gestion des fournisseurs',
      orders: 'Gestion des commandes',
      quotes: 'Gestion des devis',
      billing: 'Facturation et paiements',
      finance: 'Gestion financière',
      users: 'Gestion des utilisateurs',
      roles: 'Gestion des rôles et permissions',
      notifications: 'Gestion des notifications',
      reports: 'Rapports et analyses',
      maintenance: 'Maintenance et support',
      quality: 'Contrôle qualité',
      traceability: 'Traçabilité et audit',
      other: 'Autres fonctionnalités',
    }

    return descriptions[categoryId] || ''
  }

  private getCategoryIcon(categoryId: string): string {
    const icons: Record<string, string> = {
      dashboard: 'LayoutDashboard',
      administration: 'Settings',
      settings: 'Settings',
      profile: 'User',
      planning: 'Calendar',
      production: 'Factory',
      inventory: 'Package',
      sales: 'TrendingUp',
      suppliers: 'Truck',
      orders: 'FileText',
      quotes: 'FileBarChart',
      billing: 'Receipt',
      finance: 'CreditCard',
      users: 'Users',
      roles: 'Shield',
      notifications: 'Bell',
      reports: 'FileBarChart',
      maintenance: 'Wrench',
      quality: 'CheckCircle',
      traceability: 'Search',
      other: 'MoreHorizontal',
    }

    return icons[categoryId] || 'Circle'
  }
}

