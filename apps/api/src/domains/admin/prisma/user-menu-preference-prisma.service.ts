import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { UserMenuPreference, Prisma } from '@prisma/client'

/**
 * UserMenuPreferencePrismaService - Phase 2.3
 *
 * Service pour gestion des préférences de menu dynamique utilisateur avec Prisma
 *
 * UserMenuPreference = Menu dynamique complet en Json par utilisateur
 * Alternative à UserMenuPreferences pour menus entièrement personnalisés
 *
 * Fonctionnalités:
 * - CRUD préférences menu dynamique
 * - Stockage complet menu en Json (menuData)
 * - Préférences additionnelles (Json)
 * - Un seul enregistrement par utilisateur (unique userId)
 */
@Injectable()
export class UserMenuPreferencePrismaService {
  private readonly logger = new Logger(UserMenuPreferencePrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer une préférence de menu pour un utilisateur
   */
  async createUserMenuPreference(data: {
    userId: string
    menuData: Record<string, any>
    preferences?: Record<string, any>
  }): Promise<UserMenuPreference> {
    this.logger.log(`Creating menu preference for user: ${data.userId}`)

    try {
      const menuPreference = await this.prisma.userMenuPreference.create({
        data: {
          userId: data.userId,
          menuData: data.menuData as Prisma.InputJsonValue,
          preferences: data.preferences ? (data.preferences as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Menu preference created for user: ${data.userId}`)
      return menuPreference
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating user menu preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Créer une préférence par défaut pour un utilisateur
   */
  async createDefaultMenuPreference(userId: string): Promise<UserMenuPreference> {
    this.logger.log(`Creating default menu preference for user: ${userId}`)

    const defaultMenuData = {
      layout: 'vertical',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'dashboard',
          path: '/dashboard',
          order: 0,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: 'settings',
          path: '/settings',
          order: 1,
        },
      ],
    }

    const defaultPreferences = {
      collapsed: false,
      pinned: false,
      width: 240,
    }

    return this.createUserMenuPreference({
      userId,
      menuData: defaultMenuData,
      preferences: defaultPreferences,
    })
  }

  /**
   * Récupérer la préférence d'un utilisateur
   */
  async getUserMenuPreference(userId: string): Promise<UserMenuPreference | null> {
    this.logger.debug(`Getting menu preference for user: ${userId}`)

    try {
      return await this.prisma.userMenuPreference.findUnique({
        where: { userId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user menu preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer ou créer la préférence d'un utilisateur
   */
  async getOrCreateUserMenuPreference(userId: string): Promise<UserMenuPreference> {
    this.logger.debug(`Getting or creating menu preference for user: ${userId}`)

    let preference = await this.getUserMenuPreference(userId)

    if (!preference) {
      preference = await this.createDefaultMenuPreference(userId)
    }

    return preference
  }

  /**
   * Mettre à jour la préférence d'un utilisateur
   */
  async updateUserMenuPreference(
    userId: string,
    data: {
      menuData?: Record<string, any>
      preferences?: Record<string, any>
    }
  ): Promise<UserMenuPreference> {
    this.logger.log(`Updating menu preference for user: ${userId}`)

    try {
      const updateData: any = {}

      if (data.menuData !== undefined) updateData.menuData = data.menuData as Prisma.InputJsonValue
      if (data.preferences !== undefined) updateData.preferences = data.preferences as Prisma.InputJsonValue

      const menuPreference = await this.prisma.userMenuPreference.update({
        where: { userId },
        data: updateData,
      })

      this.logger.log(`Menu preference updated for user: ${userId}`)
      return menuPreference
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating user menu preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour les données du menu
   */
  async updateMenuData(userId: string, menuData: Record<string, any>): Promise<UserMenuPreference> {
    this.logger.log(`Updating menu data for user: ${userId}`)

    return this.updateUserMenuPreference(userId, { menuData })
  }

  /**
   * Mettre à jour les préférences additionnelles
   */
  async updatePreferences(userId: string, preferences: Record<string, any>): Promise<UserMenuPreference> {
    this.logger.log(`Updating preferences for user: ${userId}`)

    return this.updateUserMenuPreference(userId, { preferences })
  }

  /**
   * Fusionner des données de menu (merge)
   */
  async mergeMenuData(userId: string, partialMenuData: Record<string, any>): Promise<UserMenuPreference> {
    this.logger.log(`Merging menu data for user: ${userId}`)

    try {
      const current = await this.getUserMenuPreference(userId)
      if (!current) {
        throw new Error(`User menu preference not found for user: ${userId}`)
      }

      const currentMenuData = current.menuData as Record<string, any>
      const mergedMenuData = {
        ...currentMenuData,
        ...partialMenuData,
      }

      return this.updateMenuData(userId, mergedMenuData)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error merging menu data: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Fusionner des préférences (merge)
   */
  async mergePreferences(userId: string, partialPreferences: Record<string, any>): Promise<UserMenuPreference> {
    this.logger.log(`Merging preferences for user: ${userId}`)

    try {
      const current = await this.getUserMenuPreference(userId)
      if (!current) {
        throw new Error(`User menu preference not found for user: ${userId}`)
      }

      const currentPreferences = (current.preferences as Record<string, any>) || {}
      const mergedPreferences = {
        ...currentPreferences,
        ...partialPreferences,
      }

      return this.updatePreferences(userId, mergedPreferences)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error merging preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Créer ou mettre à jour la préférence (upsert)
   */
  async upsertUserMenuPreference(data: {
    userId: string
    menuData: Record<string, any>
    preferences?: Record<string, any>
  }): Promise<UserMenuPreference> {
    this.logger.log(`Upserting menu preference for user: ${data.userId}`)

    try {
      const menuPreference = await this.prisma.userMenuPreference.upsert({
        where: { userId: data.userId },
        create: {
          userId: data.userId,
          menuData: data.menuData as Prisma.InputJsonValue,
          preferences: data.preferences ? (data.preferences as Prisma.InputJsonValue) : undefined,
        },
        update: {
          menuData: data.menuData as Prisma.InputJsonValue,
          preferences: data.preferences ? (data.preferences as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Menu preference upserted for user: ${data.userId}`)
      return menuPreference
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error upserting user menu preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Réinitialiser aux préférences par défaut
   */
  async resetToDefaults(userId: string): Promise<UserMenuPreference> {
    this.logger.log(`Resetting menu preference to defaults for user: ${userId}`)

    try {
      // Supprimer la préférence existante
      await this.deleteUserMenuPreference(userId)

      // Créer la préférence par défaut
      return await this.createDefaultMenuPreference(userId)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error resetting user menu preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer la préférence d'un utilisateur
   */
  async deleteUserMenuPreference(userId: string): Promise<void> {
    this.logger.log(`Deleting menu preference for user: ${userId}`)

    try {
      await this.prisma.userMenuPreference.delete({
        where: { userId },
      })

      this.logger.log(`Menu preference deleted for user: ${userId}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting user menu preference: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter le nombre d'utilisateurs avec des préférences
   */
  async countUsersWithPreferences(): Promise<number> {
    this.logger.debug('Counting users with menu preferences')

    try {
      return await this.prisma.userMenuPreference.count()
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting users with preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Valider la structure de menuData
   */
  validateMenuData(menuData: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Vérifier que c'est un objet
    if (typeof menuData !== 'object' || menuData === null || Array.isArray(menuData)) {
      errors.push('MenuData must be a non-null object')
      return { valid: false, errors }
    }

    // Vérifier les champs requis
    if (!menuData.items || !Array.isArray(menuData.items)) {
      errors.push('MenuData must have an "items" array')
    }

    // Valider chaque item
    if (menuData.items && Array.isArray(menuData.items)) {
      menuData.items.forEach((item: any, index: number) => {
        if (!item.id) {
          errors.push(`Item at index ${index} must have an "id"`)
        }
        if (!item.label) {
          errors.push(`Item at index ${index} must have a "label"`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Créer une préférence avec validation
   */
  async createWithValidation(data: {
    userId: string
    menuData: Record<string, any>
    preferences?: Record<string, any>
  }): Promise<UserMenuPreference> {
    this.logger.log(`Creating menu preference with validation for user: ${data.userId}`)

    const validation = this.validateMenuData(data.menuData)
    if (!validation.valid) {
      const errorMsg = `Invalid menuData: ${validation.errors.join(', ')}`
      this.logger.error(errorMsg)
      throw new Error(errorMsg)
    }

    return this.createUserMenuPreference(data)
  }
}
