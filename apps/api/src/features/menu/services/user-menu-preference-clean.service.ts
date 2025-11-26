import { Injectable, Logger } from '@nestjs/common'
import { UserMenuPreferencePrismaService } from '../../../domains/admin/prisma/user-menu-preference-prisma.service'
import type { UserMenuPreference } from '@prisma/client'

/**
 * Service propre pour la gestion des préférences de menu utilisateur
 * Utilise les services Prisma sous-jacents
 */
@Injectable()
export class UserMenuPreferenceCleanService {
  private readonly logger = new Logger(UserMenuPreferenceCleanService.name)

  constructor(
    private readonly userMenuPreferencePrisma: UserMenuPreferencePrismaService
  ) {}

  /**
   * Récupère ou crée les préférences pour un utilisateur
   * Retourne un tableau pour compatibilité avec l'ancien contrôleur
   */
  async findOrCreateByUserId(userId: string): Promise<any[]> {
    try {
      const preference = await this.userMenuPreferencePrisma.getOrCreateUserMenuPreference(userId)

      // Le contrôleur attend un tableau, on convertit le menu JSON en tableau
      const menuData = (preference.menuData as any) || {}
      const menuItems = menuData.items || []

      return Array.isArray(menuItems) ? menuItems : []
    } catch (error) {
      this.logger.error(`Error finding/creating preferences for user ${userId}:`, error)
      return []
    }
  }

  /**
   * Récupère le menu personnalisé complet
   */
  async getCustomMenu(userId: string): Promise<any> {
    try {
      const preference = await this.userMenuPreferencePrisma.getUserMenuPreference(userId)

      if (!preference) {
        return { items: [] }
      }

      return preference.menuData || { items: [] }
    } catch (error) {
      this.logger.error(`Error getting custom menu for user ${userId}:`, error)
      return { items: [] }
    }
  }

  /**
   * Sauvegarde le menu personnalisé
   */
  async saveCustomMenu(userId: string, menuData: any): Promise<UserMenuPreference> {
    try {
      return await this.userMenuPreferencePrisma.updateMenuData(userId, menuData)
    } catch (error) {
      this.logger.error(`Error saving custom menu for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Réinitialise les préférences aux valeurs par défaut
   */
  async resetPreferences(userId: string): Promise<UserMenuPreference> {
    try {
      return await this.userMenuPreferencePrisma.resetToDefaults(userId)
    } catch (error) {
      this.logger.error(`Error resetting preferences for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Active/désactive une page
   */
  async togglePage(userId: string, pageId: string): Promise<any> {
    try {
      const preference = await this.userMenuPreferencePrisma.getOrCreateUserMenuPreference(userId)
      const menuData = (preference.menuData as any) || { items: [] }
      const items = menuData.items || []

      // Trouve l'item et inverse sa visibilité
      const itemIndex = items.findIndex((item: any) => item.id === pageId || item.menuId === pageId)
      if (itemIndex >= 0) {
        items[itemIndex].isVisible = !items[itemIndex].isVisible
      }

      menuData.items = items
      await this.userMenuPreferencePrisma.updateMenuData(userId, menuData)

      return items[itemIndex] || { menuId: pageId, isVisible: false }
    } catch (error) {
      this.logger.error(`Error toggling page ${pageId} for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Met à jour la visibilité d'un menu
   */
  async updateMenuVisibility(userId: string, menuId: string, isVisible: boolean): Promise<any> {
    try {
      const preference = await this.userMenuPreferencePrisma.getOrCreateUserMenuPreference(userId)
      const menuData = (preference.menuData as any) || { items: [] }
      const items = menuData.items || []

      // Trouve et met à jour l'item
      const itemIndex = items.findIndex((item: any) => item.id === menuId || item.menuId === menuId)
      if (itemIndex >= 0) {
        items[itemIndex].isVisible = isVisible
      } else {
        // Ajoute un nouvel item si non trouvé
        items.push({ menuId, isVisible, order: items.length })
      }

      menuData.items = items
      await this.userMenuPreferencePrisma.updateMenuData(userId, menuData)

      return items[itemIndex >= 0 ? itemIndex : items.length - 1]
    } catch (error) {
      this.logger.error(`Error updating menu visibility for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Met à jour l'ordre d'un menu
   */
  async updateMenuOrder(userId: string, menuId: string, order: number): Promise<any> {
    try {
      const preference = await this.userMenuPreferencePrisma.getOrCreateUserMenuPreference(userId)
      const menuData = (preference.menuData as any) || { items: [] }
      const items = menuData.items || []

      const itemIndex = items.findIndex((item: any) => item.id === menuId || item.menuId === menuId)
      if (itemIndex >= 0) {
        items[itemIndex].order = order
      } else {
        items.push({ menuId, order, isVisible: true })
      }

      menuData.items = items
      await this.userMenuPreferencePrisma.updateMenuData(userId, menuData)

      return items[itemIndex >= 0 ? itemIndex : items.length - 1]
    } catch (error) {
      this.logger.error(`Error updating menu order for user ${userId}:`, error)
      throw error
    }
  }

  /**
   * Met à jour la personnalisation d'une page
   */
  async updatePageCustomization(userId: string, menuId: string, customLabel?: string): Promise<any> {
    try {
      const preference = await this.userMenuPreferencePrisma.getOrCreateUserMenuPreference(userId)
      const menuData = (preference.menuData as any) || { items: [] }
      const items = menuData.items || []

      const itemIndex = items.findIndex((item: any) => item.id === menuId || item.menuId === menuId)
      if (itemIndex >= 0) {
        items[itemIndex].customLabel = customLabel
      } else {
        items.push({ menuId, customLabel, isVisible: true, order: items.length })
      }

      menuData.items = items
      await this.userMenuPreferencePrisma.updateMenuData(userId, menuData)

      return items[itemIndex >= 0 ? itemIndex : items.length - 1]
    } catch (error) {
      this.logger.error(`Error updating page customization for user ${userId}:`, error)
      throw error
    }
  }
}
