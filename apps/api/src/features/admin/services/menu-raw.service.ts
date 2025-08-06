import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

export interface MenuConfigurationData {
  id: string
  name: string
  description?: string
  isActive: boolean
  isSystem: boolean
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface MenuItemData {
  id: string
  configId: string
  parentId?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  orderIndex: number
  isVisible: boolean
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface MenuTreeNode {
  id: string
  parentId?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  orderIndex: number
  isVisible: boolean
  children: MenuTreeNode[]
  depth: number
}

@Injectable()
export class MenuRawService {
  constructor(
    @InjectDataSource('auth')
    private readonly _dataSource: DataSource
  ) {}

  async findAllConfigurations(): Promise<MenuConfigurationData[]> {
    const result = await this._dataSource.query(`
      SELECT 
        id, 
        name, 
        description, 
        isactive as "isActive", 
        issystem as "isSystem", 
        metadata, 
        createdat as "createdAt", 
        updatedat as "updatedAt", 
        createdby as "createdBy", 
        updatedby as "updatedBy"
      FROM menu_configurations 
      ORDER BY issystem DESC, name ASC
    `)
    return result
  }

  async findActiveConfiguration(): Promise<MenuConfigurationData | null> {
    const result = await this._dataSource.query(`
      SELECT 
        id, 
        name, 
        description, 
        isactive as "isActive", 
        issystem as "isSystem", 
        metadata, 
        createdat as "createdAt", 
        updatedat as "updatedAt", 
        createdby as "createdBy", 
        updatedby as "updatedBy"
      FROM menu_configurations 
      WHERE isactive = true 
      LIMIT 1
    `)
    return result[0] || null
  }

  async findMenuItemsByConfigId(configId: string): Promise<MenuItemData[]> {
    const result = await this._dataSource.query(
      `
      SELECT 
        id,
        "configId",
        "parentId",
        title,
        type,
        "programId",
        "externalUrl",
        "queryBuilderId",
        "orderIndex",
        "isVisible",
        metadata,
        "createdAt",
        "updatedAt",
        "createdBy",
        "updatedBy"
      FROM menu_items 
      WHERE "configId" = $1 
      ORDER BY "orderIndex", "parentId" NULLS FIRST
    `,
      [configId]
    )
    return result
  }

  async getMenuTree(configId?: string): Promise<MenuTreeNode[]> {
    let config: MenuConfigurationData | null

    if (configId) {
      const result = await this._dataSource.query(
        `
        SELECT 
          id, 
          name, 
          description, 
          isactive as "isActive", 
          issystem as "isSystem", 
          metadata, 
          createdat as "createdAt", 
          updatedat as "updatedAt", 
          createdby as "createdBy", 
          updatedby as "updatedBy"
        FROM menu_configurations 
        WHERE id = $1
      `,
        [configId]
      )
      config = result[0] || null
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
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => {
        const children = allItems.filter((child) => child.parentId === item.id)
        return {
          id: item.id,
          parentId: item.parentId,
          title: item.title,
          type: item.type,
          programId: item.programId,
          externalUrl: item.externalUrl,
          queryBuilderId: item.queryBuilderId,
          orderIndex: item.orderIndex,
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
    userRoles: string[],
    userPermissions: string[]
  ): MenuTreeNode[] {
    return items
      .filter((item) => item.isVisible)
      .map((item) => ({
        ...item,
        children: this.filterMenuByPermissions(item.children, userRoles, userPermissions),
      }))
      .filter(
        (item) =>
          // Garder les éléments qui ont des enfants ou qui sont des liens directs
          item.children.length > 0 || item.programId || item.externalUrl || item.queryBuilderId
      )
  }
}
