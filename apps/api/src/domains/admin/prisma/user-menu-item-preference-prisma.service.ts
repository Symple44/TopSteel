import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { UserMenuItemPreference } from '@prisma/client'

/**
 * UserMenuItemPreferencePrismaService - Phase 2.3
 *
 * Service pour gestion des préférences par item de menu avec Prisma
 *
 * UserMenuItemPreference = Préférences individuelles par menu item
 * Permet à l'utilisateur de personnaliser chaque item (visibilité, ordre, label)
 *
 * Fonctionnalités:
 * - CRUD préférences d'items
 * - Visibilité personnalisée
 * - Ordre personnalisé
 * - Label personnalisé
 * - Relations avec UserMenuPreferences
 */
@Injectable()
export class UserMenuItemPreferencePrismaService {
  private readonly logger = new Logger(UserMenuItemPreferencePrismaService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une préférence d'item
   */
  async createUserMenuItemPreference(data: {
    userMenuPreferencesId: string
    menuItemId: string
    isVisible?: boolean
    order?: number
    customLabel?: string
  }): Promise<UserMenuItemPreference> {
    this.logger.log(
      `Creating menu item preference: userMenuPreferences=${data.userMenuPreferencesId}, menuItem=${data.menuItemId}`
    )

    try {
      const itemPreference = await this.prisma.userMenuItemPreference.create({
        data: {
          userMenuPreferencesId: data.userMenuPreferencesId,
          menuItemId: data.menuItemId,
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
          order: data.order || null,
          customLabel: data.customLabel || null,
        },
      })

      this.logger.log(`Menu item preference created: ${itemPreference.id}`)
      return itemPreference
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating user menu item preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une préférence d'item par ID
   */
  async getUserMenuItemPreferenceById(id: string): Promise<UserMenuItemPreference | null> {
    this.logger.debug(`Getting menu item preference: ${id}`)

    try {
      return await this.prisma.userMenuItemPreference.findUnique({
        where: { id },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user menu item preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer une préférence par userMenuPreferencesId et menuItemId
   */
  async getUserMenuItemPreference(
    userMenuPreferencesId: string,
    menuItemId: string
  ): Promise<UserMenuItemPreference | null> {
    this.logger.debug(`Getting menu item preference: preferences=${userMenuPreferencesId}, item=${menuItemId}`)

    try {
      return await this.prisma.userMenuItemPreference.findUnique({
        where: {
          userMenuPreferencesId_menuItemId: {
            userMenuPreferencesId,
            menuItemId,
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user menu item preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer toutes les préférences d'un utilisateur
   */
  async getUserMenuItemPreferences(userMenuPreferencesId: string): Promise<UserMenuItemPreference[]> {
    this.logger.debug(`Getting all menu item preferences for user preferences: ${userMenuPreferencesId}`)

    try {
      return await this.prisma.userMenuItemPreference.findMany({
        where: { userMenuPreferencesId },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user menu item preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les items visibles d'un utilisateur
   */
  async getVisibleMenuItems(userMenuPreferencesId: string): Promise<UserMenuItemPreference[]> {
    this.logger.debug(`Getting visible menu items for user preferences: ${userMenuPreferencesId}`)

    try {
      return await this.prisma.userMenuItemPreference.findMany({
        where: {
          userMenuPreferencesId,
          isVisible: true,
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting visible menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les items cachés d'un utilisateur
   */
  async getHiddenMenuItems(userMenuPreferencesId: string): Promise<UserMenuItemPreference[]> {
    this.logger.debug(`Getting hidden menu items for user preferences: ${userMenuPreferencesId}`)

    try {
      return await this.prisma.userMenuItemPreference.findMany({
        where: {
          userMenuPreferencesId,
          isVisible: false,
        },
        orderBy: { order: 'asc' },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting hidden menu items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour une préférence d'item
   */
  async updateUserMenuItemPreference(
    id: string,
    data: {
      isVisible?: boolean
      order?: number
      customLabel?: string
    }
  ): Promise<UserMenuItemPreference> {
    this.logger.log(`Updating menu item preference: ${id}`)

    try {
      const updateData: any = {}

      if (data.isVisible !== undefined) updateData.isVisible = data.isVisible
      if (data.order !== undefined) updateData.order = data.order
      if (data.customLabel !== undefined) updateData.customLabel = data.customLabel

      const itemPreference = await this.prisma.userMenuItemPreference.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`Menu item preference updated: ${id}`)
      return itemPreference
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating user menu item preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Basculer la visibilité d'un item
   */
  async toggleVisibility(id: string): Promise<UserMenuItemPreference> {
    this.logger.log(`Toggling visibility for menu item preference: ${id}`)

    try {
      const preference = await this.getUserMenuItemPreferenceById(id)
      if (!preference) {
        throw new Error(`Menu item preference not found: ${id}`)
      }

      return this.updateUserMenuItemPreference(id, {
        isVisible: !preference.isVisible,
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error toggling visibility: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour l'ordre d'un item
   */
  async updateOrder(id: string, order: number): Promise<UserMenuItemPreference> {
    this.logger.log(`Updating order for menu item preference ${id}: ${order}`)

    return this.updateUserMenuItemPreference(id, { order })
  }

  /**
   * Mettre à jour le label personnalisé
   */
  async updateCustomLabel(id: string, customLabel: string): Promise<UserMenuItemPreference> {
    this.logger.log(`Updating custom label for menu item preference ${id}: ${customLabel}`)

    return this.updateUserMenuItemPreference(id, { customLabel })
  }

  /**
   * Réorganiser les items (batch update)
   */
  async reorderMenuItems(itemOrders: Array<{ id: string; order: number }>): Promise<void> {
    this.logger.log(`Reordering ${itemOrders.length} menu item preferences`)

    try {
      for (const { id, order } of itemOrders) {
        await this.updateOrder(id, order)
      }

      this.logger.log('Menu item preferences reordered successfully')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error reordering menu item preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Créer ou mettre à jour une préférence (upsert)
   */
  async upsertUserMenuItemPreference(data: {
    userMenuPreferencesId: string
    menuItemId: string
    isVisible?: boolean
    order?: number
    customLabel?: string
  }): Promise<UserMenuItemPreference> {
    this.logger.log(`Upserting menu item preference: preferences=${data.userMenuPreferencesId}, item=${data.menuItemId}`)

    try {
      const itemPreference = await this.prisma.userMenuItemPreference.upsert({
        where: {
          userMenuPreferencesId_menuItemId: {
            userMenuPreferencesId: data.userMenuPreferencesId,
            menuItemId: data.menuItemId,
          },
        },
        create: {
          userMenuPreferencesId: data.userMenuPreferencesId,
          menuItemId: data.menuItemId,
          isVisible: data.isVisible !== undefined ? data.isVisible : true,
          order: data.order || null,
          customLabel: data.customLabel || null,
        },
        update: {
          isVisible: data.isVisible,
          order: data.order,
          customLabel: data.customLabel,
        },
      })

      this.logger.log(`Menu item preference upserted: ${itemPreference.id}`)
      return itemPreference
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting user menu item preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer une préférence d'item
   */
  async deleteUserMenuItemPreference(id: string): Promise<void> {
    this.logger.log(`Deleting menu item preference: ${id}`)

    try {
      await this.prisma.userMenuItemPreference.delete({
        where: { id },
      })

      this.logger.log(`Menu item preference deleted: ${id}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting user menu item preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer toutes les préférences d'un utilisateur
   */
  async deleteAllUserMenuItemPreferences(userMenuPreferencesId: string): Promise<void> {
    this.logger.log(`Deleting all menu item preferences for user preferences: ${userMenuPreferencesId}`)

    try {
      await this.prisma.userMenuItemPreference.deleteMany({
        where: { userMenuPreferencesId },
      })

      this.logger.log('All menu item preferences deleted')
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting all user menu item preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les préférences d'un utilisateur
   */
  async countUserMenuItemPreferences(userMenuPreferencesId: string): Promise<number> {
    this.logger.debug(`Counting menu item preferences for user preferences: ${userMenuPreferencesId}`)

    try {
      return await this.prisma.userMenuItemPreference.count({
        where: { userMenuPreferencesId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting user menu item preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter les items visibles
   */
  async countVisibleItems(userMenuPreferencesId: string): Promise<number> {
    this.logger.debug(`Counting visible items for user preferences: ${userMenuPreferencesId}`)

    try {
      return await this.prisma.userMenuItemPreference.count({
        where: {
          userMenuPreferencesId,
          isVisible: true,
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting visible items: ${err.message}`, err.stack)
      throw error
    }
  }
}
