import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { MenuConfiguration, MenuItem } from '@prisma/client'

// Enum for MenuItemType - keeping for backward compatibility
// Note: Prisma schema doesn't have this enum, items are differentiated by presence of path, etc.
export enum MenuItemType {
  FOLDER = 'FOLDER',
  PROGRAM = 'PROGRAM',
  LINK = 'LINK',
  DATA_VIEW = 'DATA_VIEW',
}

// Interfaces for relations
interface MenuItemPermissionData {
  id: string
  menuItemId: string
  permissionId: string
  createdAt: Date
}

interface MenuItemRoleData {
  id: string
  menuItemId: string
  roleId: string
  createdAt: Date
}

// Extended MenuItem interface with relations for internal use
interface MenuItemData extends MenuItem {
  // Relations
  permissions?: MenuItemPermissionData[]
  roles?: MenuItemRoleData[]
  children?: MenuItemData[]
  // Virtual properties for compatibility with frontend
  title?: string // alias for label
  titleKey?: string
  href?: string // alias for path
  gradient?: string // from metadata
  badge?: string // from metadata
  type?: MenuItemType // computed from metadata or path presence
  programId?: string // from metadata or path
  externalUrl?: string // from metadata
  queryBuilderId?: string // from metadata
  moduleId?: string // from metadata
  target?: string // from metadata
  orderIndex?: number // alias for order
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
  constructor(private readonly prisma: PrismaService) {}

  // ===== GESTION DES CONFIGURATIONS =====

  async findAllConfigurations(): Promise<any[]> {
    return await this.prisma.menuConfiguration.findMany({
      orderBy: [{ name: 'asc' }],
    })
  }

  async findActiveConfiguration(): Promise<any | null> {
    return await this.prisma.menuConfiguration.findFirst({
      where: { isActive: true },
      include: {
        menuItems: {
          include: {
            children: true,
            permissions: true,
            roles: true,
          },
        },
      },
    })
  }

  async findConfigurationById(id: string): Promise<any> {
    const config = await this.prisma.menuConfiguration.findFirst({
      where: { id },
      include: {
        menuItems: {
          include: {
            children: true,
            permissions: true,
            roles: true,
          },
        },
      },
    })

    if (!config) {
      throw new NotFoundException(`Configuration de menu avec l'ID ${id} non trouvée`)
    }

    return config
  }

  async createConfiguration(createDto: CreateMenuConfigDto, createdBy: string): Promise<any> {
    // Vérifier l'unicité du nom
    const existingConfig = await this.prisma.menuConfiguration.findFirst({
      where: { name: createDto.name },
    })

    if (existingConfig) {
      throw new ConflictException(`Une configuration avec le nom "${createDto.name}" existe déjà`)
    }

    // Créer la configuration
    const config = await this.prisma.menuConfiguration.create({
      data: {
        name: createDto.name,
        description: createDto.description || createDto.name,
        isActive: false,
        isDefault: false,
      },
    })

    // Créer les items de menu
    if (createDto.items && createDto.items.length > 0) {
      await this.createMenuItems(config.id, createDto.items)
    }

    return await this.findConfigurationById(config.id)
  }

  async updateConfiguration(
    id: string,
    updateDto: UpdateMenuConfigDto,
    updatedBy: string
  ): Promise<any> {
    const config = await this.findConfigurationById(id)

    // Vérifier l'unicité du nom si modifié
    if (updateDto.name && updateDto.name !== config.name) {
      const existingConfig = await this.prisma.menuConfiguration.findFirst({
        where: { name: updateDto.name },
      })

      if (existingConfig) {
        throw new ConflictException(`Une configuration avec le nom "${updateDto.name}" existe déjà`)
      }
    }

    // Mettre à jour la configuration
    await this.prisma.menuConfiguration.update({
      where: { id },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.description && { description: updateDto.description }),
        ...(updateDto.isActive !== undefined && { isActive: updateDto.isActive }),
        updatedAt: new Date(),
      },
    })

    // Mettre à jour les items si fournis
    if (updateDto.items) {
      await this.updateMenuItems(config.id, updateDto.items)
    }

    return await this.findConfigurationById(config.id)
  }

  async deleteConfiguration(id: string): Promise<void> {
    const config = await this.findConfigurationById(id)

    if (config.isActive) {
      throw new ForbiddenException('Impossible de supprimer la configuration active')
    }

    await this.prisma.menuConfiguration.delete({ where: { id } })
  }

  async activateConfiguration(id: string): Promise<void> {
    // Désactiver toutes les autres configurations
    await this.prisma.menuConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    // Activer la configuration sélectionnée
    await this.prisma.menuConfiguration.update({
      where: { id },
      data: { isActive: true },
    })
  }

  // ===== GESTION DES ITEMS DE MENU =====

  async getMenuTree(configId?: string): Promise<MenuTreeNode[]> {
    let config: any | null

    if (configId) {
      config = await this.findConfigurationById(configId)
    } else {
      config = await this.findActiveConfiguration()
    }

    if (!config) {
      return []
    }

    // Construire l'arbre de menu
    const items = (config.menuItems || []).filter(
      (item: any) => !item.parentId
    ) as unknown as MenuItemData[]
    return this.buildMenuTree(items, (config.menuItems || []) as unknown as MenuItemData[])
  }

  private buildMenuTree(rootItems: MenuItemData[], allItems: MenuItemData[]): MenuTreeNode[] {
    return rootItems
      .sort((a, b) => a.order - b.order)
      .map((item): MenuTreeNode => {
        const children = allItems.filter((child) => child.parentId === item.id)
        const metadata = (item.metadata as Record<string, any>) || {}

        return {
          id: item.id,
          parentId: item.parentId || undefined,
          title: item.label,
          titleKey: metadata.titleKey as string | undefined,
          href: item.path || undefined,
          icon: item.icon || undefined,
          gradient: metadata.gradient as string | undefined,
          badge: metadata.badge as string | undefined,
          orderIndex: item.order,
          isVisible: item.isVisible,
          moduleId: metadata.moduleId as string | undefined,
          target: metadata.target as string | undefined,
          type: (metadata.type as MenuItemType) || (item.path ? MenuItemType.PROGRAM : MenuItemType.FOLDER),
          programId: (metadata.programId as string | undefined) || item.path || undefined,
          externalUrl: metadata.externalUrl as string | undefined,
          queryBuilderId: metadata.queryBuilderId as string | undefined,
          permissions: item.permissions?.map((p) => p.permissionId) || [],
          roles: item.roles?.map((r) => r.roleId) || [],
          children: this.buildMenuTree(children, allItems),
          depth: this.calculateDepth(item, allItems),
        }
      })
  }

  private calculateDepth(item: MenuItemData, allItems: MenuItemData[]): number {
    let depth = 0
    let currentId: string | null | undefined = item.parentId
    while (currentId) {
      depth++
      const parent = allItems.find(i => i.id === currentId)
      currentId = parent?.parentId || null
    }
    return depth
  }

  private async createMenuItems(
    configId: string,
    items: MenuItemDto[],
    parentId?: string
  ): Promise<void> {
    for (const itemDto of items) {
      // Préparer les métadonnées avec les propriétés étendues
      const metadata: Record<string, any> = {
        type: itemDto.type,
        titleKey: itemDto.titleKey,
        gradient: itemDto.gradient,
        badge: itemDto.badge,
        moduleId: itemDto.moduleId,
        target: itemDto.target,
      }

      // Ajouter les champs spécifiques au type dans les métadonnées
      switch (itemDto.type) {
        case MenuItemType.PROGRAM:
          metadata.programId = itemDto.programId || itemDto.href
          break
        case MenuItemType.LINK:
          metadata.externalUrl = itemDto.externalUrl
          break
        case MenuItemType.DATA_VIEW:
          metadata.queryBuilderId = itemDto.queryBuilderId
          break
      }

      // Créer l'item avec le schéma Prisma
      const itemData = {
        menuConfigurationId: configId,
        label: itemDto.title,
        icon: itemDto.icon || null,
        path: itemDto.href || itemDto.programId || null,
        order: itemDto.orderIndex,
        isVisible: itemDto.isVisible,
        isActive: true,
        parentId: parentId || itemDto.parentId || null,
        metadata,
      }

      const savedItem = await this.prisma.menuItem.create({ data: itemData })

      // Créer les permissions
      if (itemDto.permissions && itemDto.permissions.length > 0) {
        await this.prisma.menuItemPermission.createMany({
          data: itemDto.permissions.map((permissionId) => ({
            menuItemId: savedItem.id,
            permissionId,
          })),
        })
      }

      // Créer les rôles
      if (itemDto.roles && itemDto.roles.length > 0) {
        await this.prisma.menuItemRole.createMany({
          data: itemDto.roles.map((roleId) => ({
            menuItemId: savedItem.id,
            roleId,
          })),
        })
      }

      // Créer les enfants de manière récursive
      if (itemDto.children && itemDto.children.length > 0) {
        await this.createMenuItems(configId, itemDto.children, savedItem.id)
      }
    }
  }

  private async updateMenuItems(configId: string, items: MenuItemDto[]): Promise<void> {
    // Supprimer tous les items existants de cette config
    await this.prisma.menuItem.deleteMany({
      where: { menuConfigurationId: configId },
    })

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

  async createDefaultConfiguration(): Promise<any> {
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

  async importConfiguration(data: Record<string, unknown>, createdBy: string): Promise<any> {
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
  ): Promise<any> {
    return await this.prisma.menuItem.create({
      data: {
        menuConfigurationId: configId,
        label: title,
        icon: icon || null,
        parentId: parentId || null,
        order: 999,
        isVisible: true,
        isActive: true,
        metadata: {
          type: MenuItemType.DATA_VIEW,
          queryBuilderId,
        },
      },
    })
  }

  async addUserDataViewToMenu(
    userId: string,
    queryBuilderId: string,
    title: string,
    icon?: string
  ): Promise<any> {
    // Rechercher ou créer une configuration personnelle pour l'utilisateur
    let userConfig = await this.prisma.menuConfiguration.findFirst({
      where: { name: `Menus personnels - ${userId}` },
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

    if (!userConfig) {
      throw new Error('Failed to create user configuration')
    }

    return await this.createDataViewMenuItem(
      userConfig.id,
      queryBuilderId,
      title,
      icon || 'BarChart3'
    )
  }
}
