import { PrismaService } from '../../../core/database/prisma/prisma.service'
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

export interface MenuTreeNode {
  id: string
  parentId?: string | null
  title: string
  icon?: string | null
  href?: string | null
  orderIndex: number
  isVisible: boolean
  children: MenuTreeNode[]
  depth: number
}

@Injectable()
export class MenuRawService {
  constructor(private readonly prisma: PrismaService) {}

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
        return {
          id: item.id,
          parentId: item.parentId,
          title: item.label,
          icon: item.icon,
          href: item.path,
          orderIndex: item.order,
          isVisible: item.isVisible,
          children: this.buildMenuTree(children, allItems, depth + 1),
          depth,
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
    _userRoles: string[],
    _userPermissions: string[]
  ): MenuTreeNode[] {
    return items
      .filter((item) => item.isVisible)
      .map((item) => ({
        ...item,
        children: this.filterMenuByPermissions(item.children, _userRoles, _userPermissions),
      }))
      .filter(
        (item) =>
          // Garder les éléments qui ont des enfants ou qui sont des liens directs
          item.children.length > 0 || item.href
      )
  }
}
