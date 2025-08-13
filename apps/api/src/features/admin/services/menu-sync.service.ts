import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { MenuConfiguration } from '../entities/menu-configuration.entity'
import { MenuItem, MenuItemType } from '../entities/menu-item.entity'
import { MenuItemRole } from '../entities/menu-item-role.entity'
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
    @InjectRepository(MenuConfiguration, 'auth')
    private readonly configRepository: Repository<MenuConfiguration>,
    @InjectRepository(MenuItem, 'auth')
    private readonly itemRepository: Repository<MenuItem>,
    @InjectRepository(MenuItemRole, 'auth')
    private readonly roleRepository: Repository<MenuItemRole>,
    private readonly menuConfigService: MenuConfigurationService
  ) {}

  /**
   * Synchronise la structure de menu du sidebar avec la base de données
   */
  async syncMenuFromSidebar(): Promise<MenuConfiguration> {
    this.logger.log('Début de la synchronisation du menu depuis le sidebar')

    try {
      // Structure de menu actuelle du sidebar
      const sidebarNavigation = this.getSidebarNavigationStructure()

      // Chercher ou créer la configuration système
      let systemConfig = await this.findOrCreateSystemConfig()

      // Supprimer les anciens items pour une synchro complète
      await this.itemRepository.delete({ configId: systemConfig.id })

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
   */
  private getSidebarNavigationStructure(): SidebarNavItem[] {
    return [
      {
        title: 'Tableau de bord',
        href: '/dashboard',
        icon: 'Home',
        gradient: 'from-blue-500 to-purple-600',
      },
      {
        title: 'Partenaires',
        icon: 'Users',
        gradient: 'from-violet-500 to-purple-600',
        children: [
          {
            title: 'Tous les partenaires',
            href: '/partners',
            icon: 'Users',
          },
          {
            title: 'Clients',
            href: '/partners/clients',
            icon: 'Briefcase',
          },
          {
            title: 'Fournisseurs',
            href: '/partners/suppliers',
            icon: 'Building2',
          },
        ],
      },
      {
        title: 'Inventaire',
        icon: 'Package',
        gradient: 'from-orange-500 to-red-600',
        children: [
          {
            title: 'Matériaux',
            href: '/inventory/materials',
            icon: 'Factory',
          },
          {
            title: 'Articles',
            href: '/inventory/articles',
            icon: 'Package',
          },
          {
            title: 'Stock',
            href: '/inventory/stock',
            icon: 'HardDrive',
          },
        ],
      },
      {
        title: 'Ventes',
        icon: 'TrendingUp',
        gradient: 'from-green-500 to-emerald-600',
        children: [
          {
            title: 'Devis',
            href: '/sales/quotes',
            icon: 'FileText',
          },
          {
            title: 'Commandes',
            href: '/sales/orders',
            icon: 'ListChecks',
          },
        ],
      },
      {
        title: 'Finance',
        href: '/finance/invoices',
        icon: 'CreditCard',
        gradient: 'from-yellow-500 to-orange-600',
      },
      {
        title: 'Projets',
        href: '/projects',
        icon: 'FolderKanban',
        gradient: 'from-cyan-500 to-blue-600',
      },
      {
        title: 'Query Builder',
        href: '/query-builder',
        icon: 'Search',
        gradient: 'from-emerald-500 to-teal-600',
      },
      {
        title: 'Configuration',
        href: '/admin',
        icon: 'Shield',
        gradient: 'from-red-500 to-pink-600',
        roles: ['ADMIN', 'SUPER_ADMIN'],
        children: [
          {
            title: 'Gestion des sessions',
            href: '/admin/sessions',
            icon: 'Monitor',
            gradient: 'from-cyan-500 to-teal-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Gestion des traductions',
            href: '/admin/translations',
            icon: 'Languages',
            gradient: 'from-emerald-500 to-green-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Test DataTable',
            href: '/admin/datatable-test',
            icon: 'Table',
            gradient: 'from-violet-500 to-purple-600',
            roles: ['SUPER_ADMIN', 'ADMIN'],
          },
          {
            title: 'Gestion des Sociétés',
            href: '/admin/societes',
            icon: 'Building2',
            gradient: 'from-blue-500 to-indigo-600',
            roles: ['SUPER_ADMIN'],
          },
        ],
      },
    ]
  }

  /**
   * Trouve ou crée la configuration système
   */
  private async findOrCreateSystemConfig(): Promise<MenuConfiguration> {
    let systemConfig = await this.configRepository.findOne({
      where: { name: 'Configuration Système Auto-Sync', isSystem: true },
    })

    if (!systemConfig) {
      systemConfig = MenuConfiguration.createSystem(
        'Configuration Système Auto-Sync',
        'Configuration de menu synchronisée automatiquement depuis le sidebar'
      )
      systemConfig.createdBy = null // Service système, pas d'utilisateur spécifique
      systemConfig = await this.configRepository.save(systemConfig)
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

      // Créer l'item selon s'il a des enfants ou non
      let menuItem: MenuItem

      if (sidebarItem.children && sidebarItem.children.length > 0) {
        // Item parent (dossier)
        menuItem = MenuItem.createFolder(configId, sidebarItem.title, sidebarItem.icon, parentId)
      } else if (sidebarItem.href) {
        // Item avec lien (programme)
        menuItem = MenuItem.createProgram(
          configId,
          sidebarItem.title,
          sidebarItem.href,
          sidebarItem.icon,
          parentId
        )
      } else {
        // Item par défaut (dossier sans lien)
        menuItem = MenuItem.createFolder(configId, sidebarItem.title, sidebarItem.icon, parentId)
      }

      // Mettre les propriétés virtuelles dans metadata pour les conserver
      menuItem.metadata = {
        gradient: sidebarItem.gradient,
        badge: sidebarItem.badge,
        icon: sidebarItem.icon,
        originalTitle: sidebarItem.title,
      }

      menuItem.orderIndex = orderIndex
      menuItem.createdBy = null // Service système, pas d'utilisateur spécifique

      // Sauvegarder l'item
      const savedItem = await this.itemRepository.save(menuItem)
      this.logger.debug(`Item créé: ${savedItem.title} (${savedItem.id})`)

      // Créer les rôles si spécifiés
      if (sidebarItem.roles && sidebarItem.roles.length > 0) {
        const roles = sidebarItem.roles.map((roleId) =>
          MenuItemRole.create(savedItem.id, roleId)
        )
        await this.roleRepository.save(roles)
        this.logger.debug(`Rôles ajoutés pour ${savedItem.title}: ${sidebarItem.roles.join(', ')}`)
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
      const systemConfig = await this.configRepository.findOne({
        where: { name: 'Configuration Système Auto-Sync', isSystem: true },
        relations: ['items'],
      })

      if (!systemConfig) {
        return true // Pas de config système, synchro nécessaire
      }

      const sidebarNavigation = this.getSidebarNavigationStructure()
      const expectedItemsCount = this.countTotalItems(sidebarNavigation)
      const actualItemsCount = systemConfig.items?.length || 0

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
  private countTotalItems(items: SidebarNavItem[]): number {
    let count = items.length
    for (const item of items) {
      if (item.children) {
        count += this.countTotalItems(item.children)
      }
    }
    return count
  }
}