import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import { Injectable } from '@nestjs/common'

export interface MenuConfigurationData {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  isDefault: boolean
  societeId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface MenuItemData {
  id: string
  menuConfigurationId: string
  parentId: string | null
  label: string
  icon: string | null
  path: string | null
  order: number
  isActive: boolean
  isVisible: boolean
  metadata: unknown
  createdAt: Date
  updatedAt: Date
}

// Compact menu type format (frontend expects this)
export type CompactMenuType = 'M' | 'P' | 'L' | 'D'

export interface MenuTreeNode {
  id: string
  parentId?: string | null
  title: string
  titleKey?: string
  icon?: string | null
  href?: string | null
  orderIndex: number
  isVisible: boolean
  type: CompactMenuType // Add type field
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  gradient?: string
  badge?: string
  children: MenuTreeNode[]
  depth: number
  permissions?: string[]
  roles?: string[]
}

@Injectable()
export class MenuRawService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  async findAllConfigurations(): Promise<MenuConfigurationData[]> {
    const configs = await this.prisma.menuConfiguration.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })
    return configs
  }

  async findActiveConfiguration(): Promise<MenuConfigurationData | null> {
    const config = await this.prisma.menuConfiguration.findFirst({
      where: { isActive: true },
      orderBy: { isDefault: 'desc' },
    })
    return config
  }

  async findMenuItemsByConfigId(configId: string): Promise<MenuItemData[]> {
    const items = await this.prisma.menuItem.findMany({
      where: { menuConfigurationId: configId },
      orderBy: [{ order: 'asc' }, { parentId: 'asc' }],
    })
    return items
  }

  async getMenuTree(configId?: string): Promise<MenuTreeNode[]> {
    let config: MenuConfigurationData | null

    if (configId) {
      config = await this.prisma.menuConfiguration.findUnique({
        where: { id: configId },
      })
    } else {
      config = await this.findActiveConfiguration()
    }

    if (!config) {
      return []
    }

    const items = await this.findMenuItemsByConfigId(config.id)
    const rootItems = items.filter((item) => !item.parentId)

    return this.buildMenuTree(rootItems, items, 0)
  }

  private buildMenuTree(
    parentItems: MenuItemData[],
    allItems: MenuItemData[],
    depth: number
  ): MenuTreeNode[] {
    return parentItems
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const children = allItems.filter((child) => child.parentId === item.id)
        const metadata = (item.metadata as Record<string, any>) || {}

        // Determine type from metadata or infer from properties
        let type: CompactMenuType = 'M' // Default to Menu/Folder
        if (metadata.type) {
          // Convert from long form to compact form if needed
          switch (metadata.type) {
            case 'FOLDER':
            case 'F':
            case 'M':
              type = 'M'
              break
            case 'PROGRAM':
            case 'P':
              type = 'P'
              break
            case 'LINK':
            case 'L':
              type = 'L'
              break
            case 'DATA_VIEW':
            case 'D':
              type = 'D'
              break
          }
        } else if (metadata.queryBuilderId) {
          type = 'D' // Data view
        } else if (metadata.externalUrl) {
          type = 'L' // External link
        } else if (item.path || metadata.programId) {
          type = 'P' // Program
        }

        return {
          id: item.id,
          parentId: item.parentId,
          title: item.label,
          titleKey: metadata.titleKey as string | undefined,
          icon: item.icon,
          href: item.path,
          orderIndex: item.order,
          isVisible: item.isVisible,
          type,
          programId: (metadata.programId as string | undefined) || item.path || undefined,
          externalUrl: metadata.externalUrl as string | undefined,
          queryBuilderId: metadata.queryBuilderId as string | undefined,
          gradient: metadata.gradient as string | undefined,
          badge: metadata.badge as string | undefined,
          children: this.buildMenuTree(children, allItems, depth + 1),
          depth,
          permissions: metadata.permissions as string[] | undefined,
          roles: metadata.roles as string[] | undefined,
        }
      })
  }

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
      .filter(
        (item) =>
          // Garder les éléments qui ont des enfants ou qui sont des liens directs
          item.children.length > 0 || item.href
      )
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
}
