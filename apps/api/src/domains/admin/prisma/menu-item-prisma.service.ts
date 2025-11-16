import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { MenuItem, Prisma } from '@prisma/client'

/**
 * MenuItemPrismaService - Phase 2.3
 *
 * Service pour gestion des items de menu avec Prisma
 *
 * MenuItem = Item individuel dans un menu (avec hiérarchie parent/enfant)
 *
 * Fonctionnalités:
 * - CRUD MenuItem
 * - Hiérarchie parent/enfant
 * - Ordering
 * - Metadata Json
 * - Relations rôles et permissions
 */
@Injectable()
export class MenuItemPrismaService {
  private readonly logger = new Logger(MenuItemPrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un menu item
   */
  async createMenuItem(data: {
    menuConfigurationId: string
    label: string
    parentId?: string
    icon?: string
    path?: string
    order?: number
    isActive?: boolean
    isVisible?: boolean
    metadata?: Record<string, any>
  }): Promise<MenuItem> {
    this.logger.log(`Creating menu item: ${data.label}`)

    try {
      const menuItem = await this.prisma.menuItem.create({
        data: {
          menuConfigurationId: data.menuConfigurationId,
          label: data.label,
          parentId: data.parentId || null,
          icon: data.icon || null,
          path: data.path || null,
          order: data.order || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
          metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Menu item created: ${menuItem.id}`)
      return menuItem
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un menu item par ID
   */
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    this.logger.debug(`Getting menu item: ${id}`)

    try {
      return await this.prisma.menuItem.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un menu item avec ses relations
   */
  async getMenuItemWithRelations(id: string) {
    this.logger.debug(`Getting menu item with relations: ${id}`)

    try {
      return await this.prisma.menuItem.findUnique({
        where: { id },
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                },
              },
            },
          },
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                  label: true,
                },
              },
            },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu item with relations: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister les items d'une configuration
   */
  async getMenuItems(menuConfigurationId: string, includeInactive = false): Promise<MenuItem[]> {
    this.logger.debug(`Getting menu items for configuration: ${menuConfigurationId}`)

    try {
      return await this.prisma.menuItem.findMany({
        where: {
          menuConfigurationId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les items racines (sans parent)
   */
  async getRootMenuItems(menuConfigurationId: string): Promise<MenuItem[]> {
    this.logger.debug(`Getting root menu items for configuration: ${menuConfigurationId}`)

    try {
      return await this.prisma.menuItem.findMany({
        where: {
          menuConfigurationId,
          parentId: null,
          isActive: true,
          isVisible: true,
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting root menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les enfants d'un item
   */
  async getChildMenuItems(parentId: string): Promise<MenuItem[]> {
    this.logger.debug(`Getting child menu items for parent: ${parentId}`)

    try {
      return await this.prisma.menuItem.findMany({
        where: {
          parentId,
          isActive: true,
          isVisible: true,
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting child menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer l'arbre complet des menus
   */
  async getMenuTree(menuConfigurationId: string) {
    this.logger.debug(`Getting menu tree for configuration: ${menuConfigurationId}`)

    try {
      const rootItems = await this.getRootMenuItems(menuConfigurationId)

      const buildTree = async (items: MenuItem[]): Promise<any[]> => {
        const tree = []

        for (const item of items) {
          const children = await this.getChildMenuItems(item.id)
          tree.push({
            ...item,
            children: children.length > 0 ? await buildTree(children) : [],
          })
        }

        return tree
      }

      return await buildTree(rootItems)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting menu tree: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un menu item
   */
  async updateMenuItem(
    id: string,
    data: Partial<Omit<MenuItem, 'id' | 'menuConfigurationId' | 'createdAt' | 'updatedAt'>> & {
      metadata?: Record<string, any>
    }
  ): Promise<MenuItem> {
    this.logger.log(`Updating menu item: ${id}`)

    try {
      const updateData: any = { ...data }

      // Convert metadata to Prisma.InputJsonValue
      if (data.metadata) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue
      }

      const menuItem = await this.prisma.menuItem.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Menu item updated: ${id}`)
      return menuItem
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour l'ordre
   */
  async updateOrder(id: string, order: number): Promise<MenuItem> {
    this.logger.log(`Updating menu item order: ${id} -> ${order}`)

    return this.updateMenuItem(id, { order })
  }

  /**
   * Réorganiser les items (batch update)
   */
  async reorderMenuItems(itemOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.log(`Reordering ${itemOrders.length} menu items`)

    try {
      for (const { id, order } of itemOrders) {
        await this.updateOrder(id, order)
      }

      this.logger.log('Menu items reordered successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error reordering menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Activer/désactiver un item
   */
  async setActive(id: string, isActive: boolean): Promise<MenuItem> {
    this.logger.log(`Setting menu item active: ${id} -> ${isActive}`)

    return this.updateMenuItem(id, { isActive })
  }

  /**
   * Montrer/cacher un item
   */
  async setVisible(id: string, isVisible: boolean): Promise<MenuItem> {
    this.logger.log(`Setting menu item visible: ${id} -> ${isVisible}`)

    return this.updateMenuItem(id, { isVisible })
  }

  /**
   * Déplacer un item vers un nouveau parent
   */
  async moveMenuItem(id: string, newParentId: string | null): Promise<MenuItem> {
    this.logger.log(`Moving menu item ${id} to parent ${newParentId}`)

    return this.updateMenuItem(id, { parentId: newParentId })
  }

  /**
   * Supprimer un menu item
   */
  async deleteMenuItem(id: string, deleteChildren = false): Promise<void> {
    this.logger.log(`Deleting menu item: ${id} (deleteChildren: ${deleteChildren})`)

    try {
      if (deleteChildren) {
        // Supprimer récursivement les enfants
        const children = await this.getChildMenuItems(id)
        for (const child of children) {
          await this.deleteMenuItem(child.id, true)
        }
      } else {
        // Vérifier s'il y a des enfants
        const children = await this.prisma.menuItem.findMany({
          where: { parentId: id },
        })

        if (children.length > 0) {
          throw new Error('Cannot delete menu item with children. Delete children first or use deleteChildren=true.')
        }
      }

      // Supprimer l'item (les relations roles/permissions seront supprimées en cascade)
      await this.prisma.menuItem.delete({
        where: { id },
      })

      this.logger.log(`Menu item deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting menu item: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les items d'une configuration
   */
  async countMenuItems(menuConfigurationId: string, includeInactive = false): Promise<number> {
    this.logger.debug('Counting menu items')

    try {
      return await this.prisma.menuItem.count({
        where: {
          menuConfigurationId,
          ...(includeInactive ? {} : { isActive: true }),
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Rechercher des items par label
   */
  async searchMenuItems(menuConfigurationId: string, searchTerm: string): Promise<MenuItem[]> {
    this.logger.debug(`Searching menu items: ${searchTerm}`)

    try {
      return await this.prisma.menuItem.findMany({
        where: {
          menuConfigurationId,
          label: {
            contains: searchTerm,
            mode: 'insensitive',
          },
          isActive: true,
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error searching menu items: ${err.message}`, err.stack)
      throw error
    }
  }
}
