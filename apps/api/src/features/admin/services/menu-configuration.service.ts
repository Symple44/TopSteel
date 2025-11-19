import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MenuConfiguration } from '../entities/menu-configuration.entity'
import { MenuItem, MenuItemType } from '../entities/menu-item.entity'
import { MenuItemPermission } from '../entities/menu-item-permission.entity'
import { MenuItemRole } from '../entities/menu-item-role.entity'



// Interfaces for relations
interface MenuItemPermissionData {
  id: string
  menuItemId: string
  permissionId: string
  isRequired?: boolean
  createdAt: Date
}

interface MenuItemRoleData {
  id: string
  menuItemId: string
  roleId: string
  createdAt: Date
}

// Import interface from entity file
interface MenuItemData {
  id: string
  configId: string
  parentId?: string
  title: string
  orderIndex: number
  isVisible: boolean
  type: MenuItemType
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  metadata?: Record<string, unknown>
  // Relations
  permissions?: MenuItemPermissionData[]
  roles?: MenuItemRoleData[]
  children?: MenuItemData[]
  // Virtual properties for compatibility
  titleKey?: string
  href?: string
  icon?: string
  gradient?: string
  badge?: string
  moduleId?: string
  target?: string
  // Method
  getDepth?(): number
}

export interface MenuItemDto {
  id?: string
  parentId?: string
  title: string
  titleKey?: string
  href?: string
  icon?: string
  gradient?: string
  badge?: string
  orderIndex: number
  isVisible: boolean
  moduleId?: string
  target?: string
  type: MenuItemType
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  permissions?: string[]
  roles?: string[]
  children?: MenuItemDto[]
}

export interface CreateMenuConfigDto {
  name: string
  description?: string
  items: MenuItemDto[]
}

export interface UpdateMenuConfigDto {
  name?: string
  description?: string
  isActive?: boolean
  items?: MenuItemDto[]
}

export interface MenuTreeNode extends MenuItemDto {
  children: MenuTreeNode[]
  depth: number
}

@Injectable()
export class MenuConfigurationService {
  constructor(
    @InjectRepository(MenuConfiguration, 'auth')
    private readonly _configRepository: Repository<MenuConfiguration>,
    @InjectRepository(MenuItem, 'auth')
    private readonly _itemRepository: Repository<MenuItem>,
    @InjectRepository(MenuItemPermission, 'auth')
    private readonly _permissionRepository: Repository<MenuItemPermission>,
    @InjectRepository(MenuItemRole, 'auth')
    private readonly _roleRepository: Repository<MenuItemRole>
  ) {}

  // ===== GESTION DES CONFIGURATIONS =====

  async findAllConfigurations(): Promise<MenuConfiguration[]> {
    return await this._configRepository.find({
      order: { isSystem: 'DESC', name: 'ASC' },
    })
  }

  async findActiveConfiguration(): Promise<MenuConfiguration | null> {
    return await this._configRepository.findOne({
      where: { isActive: true },
      relations: ['items', 'items.children', 'items.permissions', 'items.roles'],
    })
  }

  async findConfigurationById(id: string): Promise<MenuConfiguration> {
    const config = await this._configRepository.findOne({
      where: { id },
      relations: ['items', 'items.children', 'items.permissions', 'items.roles'],
    })

    if (!config) {
      throw new NotFoundException(`Configuration de menu avec l'ID ${id} non trouvée`)
    }

    return config
  }

  async createConfiguration(
    createDto: CreateMenuConfigDto,
    createdBy: string
  ): Promise<MenuConfiguration> {
    // Vérifier l'unicité du nom
    const existingConfig = await this._configRepository.findOne({
      where: { name: createDto.name },
    })

    if (existingConfig) {
      throw new ConflictException(`Une configuration avec le nom "${createDto.name}" existe déjà`)
    }

    // Créer la configuration
    const config = MenuConfiguration.createCustom(
      createDto.name,
      createDto.description || '',
      createdBy
    )

    const savedConfig = await this._configRepository.save(config)

    // Créer les items de menu
    if (createDto.items && createDto.items.length > 0) {
      await this.createMenuItems(savedConfig.id, createDto.items)
    }

    return await this.findConfigurationById(savedConfig.id)
  }

  async updateConfiguration(
    id: string,
    updateDto: UpdateMenuConfigDto,
    updatedBy: string
  ): Promise<MenuConfiguration> {
    const config = await this.findConfigurationById(id)

    if (config.isSystem && updateDto.name) {
      throw new ForbiddenException("Impossible de modifier le nom d'une configuration système")
    }

    // Vérifier l'unicité du nom si modifié
    if (updateDto.name && updateDto.name !== config.name) {
      const existingConfig = await this._configRepository.findOne({
        where: { name: updateDto.name },
      })

      if (existingConfig) {
        throw new ConflictException(`Une configuration avec le nom "${updateDto.name}" existe déjà`)
      }
    }

    // Mettre à jour la configuration
    Object.assign(config, updateDto)
    config.updatedBy = updatedBy
    config.updatedAt = new Date()

    await this._configRepository.save(config)

    // Mettre à jour les items si fournis
    if (updateDto.items) {
      await this.updateMenuItems(config.id, updateDto.items)
    }

    return await this.findConfigurationById(config.id)
  }

  async deleteConfiguration(id: string): Promise<void> {
    const config = await this.findConfigurationById(id)

    if (config.isSystem) {
      throw new ForbiddenException('Impossible de supprimer une configuration système')
    }

    if (config.isActive) {
      throw new ForbiddenException('Impossible de supprimer la configuration active')
    }

    await this._configRepository.delete(id)
  }

  async activateConfiguration(id: string): Promise<void> {
    // Désactiver toutes les autres configurations
    await this._configRepository
      .createQueryBuilder()
      .update(MenuConfiguration)
      .set({ isActive: false })
      .where('isActive = :isActive', { isActive: true })
      .execute()

    // Activer la configuration sélectionnée
    await this._configRepository.update(id, { isActive: true })
  }

  // ===== GESTION DES ITEMS DE MENU =====

  async getMenuTree(configId?: string): Promise<MenuTreeNode[]> {
    let config: MenuConfiguration | null

    if (configId) {
      config = await this.findConfigurationById(configId)
    } else {
      config = await this.findActiveConfiguration()
    }

    if (!config) {
      return []
    }

    // Construire l'arbre de menu
    const items = config.items.filter((item) => !item.parentId) as MenuItemData[]
    return this.buildMenuTree(items, config.items as MenuItemData[])
  }

  private buildMenuTree(rootItems: MenuItemData[], allItems: MenuItemData[]): MenuTreeNode[] {
    return rootItems
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => {
        const children = allItems.filter((child) => child.parentId === item.id)
        return {
          id: item.id,
          parentId: item.parentId,
          title: item.title,
          titleKey: item.titleKey,
          href: item.href,
          icon: item.icon,
          gradient: item.gradient,
          badge: item.badge,
          orderIndex: item.orderIndex,
          isVisible: item.isVisible,
          moduleId: item.moduleId,
          target: item.target,
          type: item.type,
          programId: item.programId,
          externalUrl: item.externalUrl,
          queryBuilderId: item.queryBuilderId,
          permissions: item.permissions?.map((p) => p.permissionId) || [],
          roles: item.roles?.map((r) => r.roleId) || [],
          children: this.buildMenuTree(children, allItems),
          depth: item.getDepth?.() || 0,
        }
      })
  }

  private async createMenuItems(
    configId: string,
    items: MenuItemDto[],
    parentId?: string
  ): Promise<void> {
    for (const itemDto of items) {
      // Créer l'item selon son type
      let item: MenuItem

      switch (itemDto.type) {
        case MenuItemType.FOLDER:
          item = MenuItem.createFolder(
            configId,
            itemDto.title,
            itemDto.icon,
            parentId || itemDto.parentId
          )
          break
        case MenuItemType.PROGRAM:
          item = MenuItem.createProgram(
            configId,
            itemDto.title,
            itemDto.programId || itemDto.href || '',
            itemDto.icon,
            parentId || itemDto.parentId
          )
          break
        case MenuItemType.LINK:
          item = MenuItem.createLink(
            configId,
            itemDto.title,
            itemDto.externalUrl || '',
            itemDto.icon,
            parentId || itemDto.parentId
          )
          break
        case MenuItemType.DATA_VIEW:
          item = MenuItem.createDataView(
            configId,
            itemDto.title,
            itemDto.queryBuilderId || '',
            itemDto.icon,
            parentId || itemDto.parentId
          )
          break
        default:
          item = MenuItem.create(
            configId,
            itemDto.title,
            itemDto.type,
            itemDto.href,
            itemDto.icon,
            parentId || itemDto.parentId
          )
      }

      Object.assign(item, {
        titleKey: itemDto.titleKey,
        gradient: itemDto.gradient,
        badge: itemDto.badge,
        orderIndex: itemDto.orderIndex,
        isVisible: itemDto.isVisible,
        moduleId: itemDto.moduleId,
        target: itemDto.target,
      })

      const savedItem = await this._itemRepository.save(item)

      // Créer les permissions
      if (itemDto.permissions) {
        const permissions = itemDto.permissions.map((permissionId) =>
          MenuItemPermission.create(savedItem.id, permissionId)
        )
        await this._permissionRepository.save(permissions)
      }

      // Créer les rôles
      if (itemDto.roles) {
        const roles = itemDto.roles.map((roleId) => MenuItemRole.create(savedItem.id, roleId))
        await this._roleRepository.save(roles)
      }

      // Créer les enfants de manière récursive
      if (itemDto.children && itemDto.children.length > 0) {
        await this.createMenuItems(configId, itemDto.children, savedItem.id)
      }
    }
  }

  private async updateMenuItems(configId: string, items: MenuItemDto[]): Promise<void> {
    // Supprimer tous les items existants
    await this._itemRepository.delete({ configId })

    // Recréer les items
    await this.createMenuItems(configId, items)
  }

  // ===== FILTRAGE PAR PERMISSIONS =====

  async getFilteredMenuForUser(
    _userId: string,
    userRoles: string[],
    userPermissions: string[]
  ): Promise<MenuTreeNode[]> {
    const menuTree = await this.getMenuTree()
    return this.filterMenuByPermissions(menuTree, userRoles, userPermissions)
  }

  private filterMenuByPermissions(
    items: MenuTreeNode[],
    userRoles: string[],
    userPermissions: string[]
  ): MenuTreeNode[] {
    return items
      .filter((item) => this.canUserAccessItem(item, userRoles, userPermissions))
      .map((item) => ({
        ...item,
        children: this.filterMenuByPermissions(item.children, userRoles, userPermissions),
      }))
      .filter((item) => item.children.length > 0 || item.href) // Garder seulement les items avec enfants ou avec lien
  }

  private canUserAccessItem(
    item: MenuTreeNode,
    userRoles: string[],
    userPermissions: string[]
  ): boolean {
    // Si l'item n'est pas visible, ne pas l'afficher
    if (!item.isVisible) {
      return false
    }

    // Si aucune restriction, autoriser l'accès
    if (
      (!item.roles || item.roles.length === 0) &&
      (!item.permissions || item.permissions.length === 0)
    ) {
      return true
    }

    // Vérifier les rôles
    if (item.roles && item.roles.length > 0) {
      const hasRequiredRole = item.roles.some((role) => userRoles.includes(role))
      if (!hasRequiredRole) {
        return false
      }
    }

    // Vérifier les permissions
    if (item.permissions && item.permissions.length > 0) {
      const hasRequiredPermission = item.permissions.some((permission) =>
        userPermissions.includes(permission)
      )
      if (!hasRequiredPermission) {
        return false
      }
    }

    return true
  }

  // ===== TEMPLATES ET UTILITAIRES =====

  async createDefaultConfiguration(): Promise<MenuConfiguration> {
    const defaultItems: MenuItemDto[] = [
      {
        title: 'Tableau de bord',
        titleKey: 'dashboard',
        type: MenuItemType.PROGRAM,
        programId: '/dashboard',
        icon: 'Home',
        orderIndex: 1,
        isVisible: true,
      },
      {
        title: 'Administration',
        titleKey: 'administration',
        type: MenuItemType.FOLDER,
        icon: 'Shield',
        orderIndex: 100,
        isVisible: true,
        roles: ['ADMIN', 'SUPER_ADMIN'],
        children: [
          {
            title: 'Gestion des utilisateurs',
            titleKey: 'users_management',
            type: MenuItemType.PROGRAM,
            programId: '/admin/users',
            icon: 'Users',
            orderIndex: 1,
            isVisible: true,
            moduleId: 'USER_MANAGEMENT',
            permissions: ['USER_MANAGEMENT_VIEW'],
          },
          {
            title: 'Gestion des rôles',
            titleKey: 'roles_management',
            type: MenuItemType.PROGRAM,
            programId: '/admin/roles',
            icon: 'Shield',
            orderIndex: 2,
            isVisible: true,
            moduleId: 'ROLE_MANAGEMENT',
            permissions: ['ROLE_MANAGEMENT_VIEW'],
          },
          {
            title: 'Gestion des groupes',
            titleKey: 'groups_management',
            type: MenuItemType.PROGRAM,
            programId: '/admin/groups',
            icon: 'Building',
            orderIndex: 3,
            isVisible: true,
            moduleId: 'USER_MANAGEMENT',
            permissions: ['USER_MANAGEMENT_VIEW'],
          },
          {
            title: 'Gestion des menus',
            titleKey: 'menu_management',
            type: MenuItemType.PROGRAM,
            programId: '/admin/menus',
            icon: 'Menu',
            orderIndex: 4,
            isVisible: true,
            moduleId: 'MENU_MANAGEMENT',
            permissions: ['MENU_MANAGEMENT_VIEW'],
          },
        ],
      },
      {
        title: 'Query Builder',
        titleKey: 'query_builder',
        type: MenuItemType.PROGRAM,
        programId: '/query-builder',
        icon: 'Database',
        orderIndex: 50,
        isVisible: true,
      },
    ]

    return await this.createConfiguration(
      {
        name: 'Configuration par défaut',
        description: 'Configuration de menu par défaut',
        items: defaultItems,
      },
      'system'
    )
  }

  async exportConfiguration(id: string): Promise<{
    name: string
    description: string | null
    version: string
    exportedAt: string
    items: MenuTreeNode[]
  }> {
    const config = await this.findConfigurationById(id)
    const menuTree = await this.getMenuTree(id)

    return {
      name: config.name,
      description: config.description || null,
      version: '1.0',
      exportedAt: new Date().toISOString(),
      items: menuTree,
    }
  }

  async importConfiguration(
    data: Record<string, unknown>,
    createdBy: string
  ): Promise<MenuConfiguration> {
    return await this.createConfiguration(
      {
        name: data.name as string,
        description: typeof data.description === 'string' ? data.description : undefined,
        items: data.items as MenuItemDto[],
      },
      createdBy
    )
  }

  // ===== INTÉGRATION QUERY BUILDER =====

  async createDataViewMenuItem(
    configId: string,
    queryBuilderId: string,
    title: string,
    icon?: string,
    parentId?: string
  ): Promise<MenuItem> {
    const item = MenuItem.createDataView(configId, title, queryBuilderId, icon, parentId)
    return await this._itemRepository.save(item)
  }

  async addUserDataViewToMenu(
    userId: string,
    queryBuilderId: string,
    title: string,
    icon?: string
  ): Promise<MenuItem> {
    // Rechercher ou créer une configuration personnelle pour l'utilisateur
    let userConfig = await this._configRepository.findOne({
      where: { createdBy: userId, name: `Menus personnels - ${userId}` },
    })

    if (!userConfig) {
      userConfig = await this.createConfiguration(
        {
          name: `Menus personnels - ${userId}`,
          description: 'Configuration personnelle de menus utilisateur',
          items: [],
        },
        userId
      )
    }

    return await this.createDataViewMenuItem(
      userConfig.id,
      queryBuilderId,
      title,
      icon || 'BarChart3'
    )
  }
}

