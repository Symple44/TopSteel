import type { MenuConfiguration, MenuItem } from '@prisma/client'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { MenuConfigurationService } from './menu-configuration.service'


interface SidebarNavItem {
  title: string
  href?: string
  icon: string
  gradient?: string
  badge?: string
  roles?: string[]
  children?: SidebarNavItem[]
}

@Injectable()
export class MenuSyncService {
  private readonly logger = new Logger(MenuSyncService.name)

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly menuConfigService: MenuConfigurationService
  ) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Synchronise la structure de menu du sidebar avec la base de données
   */
  async syncMenuFromSidebar(): Promise<MenuConfiguration> {
    this.logger.log('Début de la synchronisation du menu depuis le sidebar')

    try {
      // Structure de menu actuelle du sidebar
      const sidebarNavigation = this.getSidebarNavigationStructure()

      // Chercher ou créer la configuration système
      const systemConfig = await this.findOrCreateSystemConfig()

      // Supprimer les anciens items pour une synchro complète
      await this.prisma.menuItem.deleteMany({ where: { menuConfigurationId: systemConfig.id } })

      // Créer les nouveaux items depuis le sidebar
      await this.createMenuItemsFromSidebar(systemConfig.id, sidebarNavigation)

      // Activer la configuration système
      await this.menuConfigService.activateConfiguration(systemConfig.id)

      this.logger.log(`Menu synchronisé avec succès - Configuration: ${systemConfig.id}`)
      return systemConfig
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation du menu', error)
      throw error
    }
  }

  /**
   * Structure de navigation actuelle du sidebar
   * IMPORTANT: Cette structure doit correspondre à celle du frontend (navigation.ts)
   */
  getSidebarNavigationStructure(): SidebarNavItem[] {
    return [
      {
        title: 'Tableau de bord',
        href: '/dashboard',
        icon: 'Home',
        gradient: 'from-blue-500 to-purple-600',
      },
      {
        title: 'Query Builder',
        href: '/query-builder',
        icon: 'Search',
        gradient: 'from-emerald-500 to-teal-600',
      },
      {
        title: 'Paramètres',
        icon: 'Settings',
        gradient: 'from-slate-500 to-gray-600',
        children: [
          {
            title: 'Apparence',
            href: '/settings/appearance',
            icon: 'Palette',
            gradient: 'from-indigo-500 to-purple-600',
          },
          {
            title: 'Notifications',
            href: '/settings/notifications',
            icon: 'Bell',
            gradient: 'from-amber-500 to-orange-600',
          },
          {
            title: 'Sécurité',
            href: '/settings/security',
            icon: 'Lock',
            gradient: 'from-red-500 to-rose-600',
          },
          {
            title: 'Personnalisation du Menu',
            href: '/settings/menu',
            icon: 'Menu',
            gradient: 'from-purple-500 to-pink-600',
          },
        ],
      },
      {
        title: 'Configuration',
        href: '/admin',
        icon: 'Shield',
        gradient: 'from-red-500 to-pink-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
        children: [
          {
            title: 'Configuration Entreprise',
            href: '/admin/company',
            icon: 'Building2',
            gradient: 'from-blue-500 to-indigo-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Gestion des Utilisateurs',
            href: '/admin/users',
            icon: 'Users',
            gradient: 'from-violet-500 to-purple-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Gestion des Rôles',
            href: '/admin/roles',
            icon: 'UserCog',
            gradient: 'from-orange-500 to-red-600',
            roles: ['SUPER_ADMIN'],
          },
          {
            title: 'Gestion des Groupes',
            href: '/admin/groups',
            icon: 'UsersRound',
            gradient: 'from-teal-500 to-cyan-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Gestion des Sociétés',
            href: '/admin/societes',
            icon: 'Building2',
            gradient: 'from-blue-500 to-indigo-600',
            roles: ['SUPER_ADMIN'],
          },
          {
            title: 'Sessions Utilisateurs',
            href: '/admin/sessions',
            icon: 'Monitor',
            gradient: 'from-cyan-500 to-teal-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Base de Données',
            href: '/admin/database',
            icon: 'Database',
            gradient: 'from-emerald-500 to-green-600',
            roles: ['SUPER_ADMIN'],
          },
          {
            title: 'Configuration des Menus',
            href: '/admin/menu-config',
            icon: 'Menu',
            gradient: 'from-purple-500 to-pink-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Gestion des Traductions',
            href: '/admin/translations',
            icon: 'Languages',
            gradient: 'from-emerald-500 to-green-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Paramètres Admin',
            href: '/admin/admin',
            icon: 'Settings',
            gradient: 'from-slate-500 to-gray-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Test DataTable',
            href: '/admin/datatable-test',
            icon: 'Table',
            gradient: 'from-violet-500 to-purple-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
        ],
      },
    ]
  }

  /**
   * Obtient la configuration système
   */
  async getSystemConfig(): Promise<(MenuConfiguration & { items?: MenuItem[] }) | null> {
    const config = await this.prisma.menuConfiguration.findFirst({
      where: { name: 'Configuration Système Auto-Sync' },
    })

    if (!config) {
      return null
    }

    const items = await this.prisma.menuItem.findMany({
      where: { menuConfigurationId: config.id },
    })

    return {
      ...config,
      items,
    }
  }

  /**
   * Trouve ou crée la configuration système
   */
  private async findOrCreateSystemConfig(): Promise<MenuConfiguration> {
    let systemConfig = await this.prisma.menuConfiguration.findFirst({
      where: { name: 'Configuration Système Auto-Sync' },
    })

    if (!systemConfig) {
      systemConfig = await this.prisma.menuConfiguration.create({
        data: {
          name: 'Configuration Système Auto-Sync',
          description: 'Configuration de menu synchronisée automatiquement depuis le sidebar',
          isActive: false,
          isDefault: false,
        },
      })
      this.logger.log(`Configuration système créée: ${systemConfig.id}`)
    }

    return systemConfig
  }

  /**
   * Crée les items de menu depuis la structure du sidebar
   */
  private async createMenuItemsFromSidebar(
    configId: string,
    items: SidebarNavItem[],
    parentId?: string,
    orderOffset = 0
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const sidebarItem = items[i]
      const orderIndex = (i + 1) * 10 + orderOffset

      // Determine menu type based on item properties
      // 'M' = Menu/Folder (no href), 'P' = Program (has href)
      const menuType = sidebarItem.href ? 'P' : 'M'

      // Créer l'item de menu
      const menuItemData = {
        menuConfigurationId: configId,
        label: sidebarItem.title,
        icon: sidebarItem.icon,
        path: sidebarItem.href || null,
        parentId: parentId || null,
        order: orderIndex,
        isActive: true,
        isVisible: true,
        metadata: {
          type: menuType, // Store compact menu type
          gradient: sidebarItem.gradient,
          badge: sidebarItem.badge,
          icon: sidebarItem.icon,
          originalTitle: sidebarItem.title,
          requiredRoles: sidebarItem.roles || [], // Stocker les noms de rôles dans metadata
          programId: sidebarItem.href, // Store programId for consistency
        },
      }

      // Sauvegarder l'item
      const savedItem = await this.prisma.menuItem.create({ data: menuItemData })
      this.logger.debug(`Item créé: ${savedItem.label} (${savedItem.id})`)

      // Créer les rôles si spécifiés - rechercher les rôles par nom
      if (sidebarItem.roles && sidebarItem.roles.length > 0) {
        const existingRoles = await this.prisma.role.findMany({
          where: { name: { in: sidebarItem.roles } },
          select: { id: true, name: true },
        })

        if (existingRoles.length > 0) {
          await this.prisma.menuItemRole.createMany({
            data: existingRoles.map((role) => ({
              menuItemId: savedItem.id,
              roleId: role.id,
            })),
          })
          this.logger.debug(
            `Rôles ajoutés pour ${savedItem.label}: ${existingRoles.map((r) => r.name).join(', ')}`
          )
        } else {
          this.logger.warn(
            `Aucun rôle trouvé pour ${savedItem.label}: ${sidebarItem.roles.join(', ')}`
          )
        }
      }

      // Créer les enfants de manière récursive
      if (sidebarItem.children && sidebarItem.children.length > 0) {
        await this.createMenuItemsFromSidebar(
          configId,
          sidebarItem.children,
          savedItem.id,
          orderIndex * 1000
        )
      }
    }
  }

  /**
   * Synchronisation automatique programmée (à appeler via un cron ou au démarrage)
   */
  async autoSync(): Promise<boolean> {
    try {
      await this.syncMenuFromSidebar()
      return true
    } catch (error) {
      this.logger.error('Échec de la synchronisation automatique', error)
      return false
    }
  }

  /**
   * Vérifie si la synchronisation est nécessaire
   */
  async needsSync(): Promise<boolean> {
    try {
      const systemConfig = await this.prisma.menuConfiguration.findFirst({
        where: { name: 'Configuration Système Auto-Sync' },
        include: { menuItems: true },
      })

      if (!systemConfig) {
        return true // Pas de config système, synchro nécessaire
      }

      const sidebarNavigation = this.getSidebarNavigationStructure()
      const expectedItemsCount = this.countTotalItems(sidebarNavigation)
      const actualItemsCount = systemConfig.menuItems?.length || 0

      // Simple vérification du nombre d'items pour détecter les changements
      return expectedItemsCount !== actualItemsCount
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du besoin de sync', error)
      return true // En cas d'erreur, forcer la synchro
    }
  }

  /**
   * Compte le nombre total d'items dans la structure
   */
  countTotalItems(items: SidebarNavItem[]): number {
    let count = items.length
    for (const item of items) {
      if (item.children) {
        count += this.countTotalItems(item.children)
      }
    }
    return count
  }
}
