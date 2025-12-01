import { Injectable, Logger } from '@nestjs/common'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import type { UserMenuPreferences, Prisma } from '@prisma/client'

/**
 * UserMenuPreferencesPrismaService - Phase 2.3
 *
 * Service pour gestion des préférences de menu utilisateur avec Prisma
 *
 * UserMenuPreferences = Préférences globales de menu par utilisateur
 * Stocke le thème, layout, couleurs, raccourcis, etc.
 *
 * Fonctionnalités:
 * - CRUD préférences menu utilisateur
 * - Thème et layout personnalisés
 * - Couleurs et raccourcis (Json)
 * - Relations avec préférences d'items individuels
 */
@Injectable()
export class UserMenuPreferencesPrismaService {
  private readonly logger = new Logger(UserMenuPreferencesPrismaService.name)

  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Créer des préférences de menu pour un utilisateur
   */
  async createUserMenuPreferences(data: {
    userId: string
    theme?: string
    layout?: string
    customColors?: Record<string, any>
    shortcuts?: Record<string, any>
  }): Promise<UserMenuPreferences> {
    this.logger.log(`Creating menu preferences for user: ${data.userId}`)

    try {
      const preferences = await this.prisma.userMenuPreferences.create({
        data: {
          userId: data.userId,
          theme: data.theme || null,
          layout: data.layout || null,
          customColors: data.customColors ? (data.customColors as Prisma.InputJsonValue) : undefined,
          shortcuts: data.shortcuts ? (data.shortcuts as Prisma.InputJsonValue) : undefined,
        },
      })

      this.logger.log(`Menu preferences created for user: ${data.userId}`)
      return preferences
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error creating user menu preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Créer des préférences par défaut pour un utilisateur
   */
  async createDefaultPreferences(userId: string): Promise<UserMenuPreferences> {
    this.logger.log(`Creating default menu preferences for user: ${userId}`)

    const defaultColors = {
      primary: '#1976d2',
      secondary: '#424242',
      accent: '#82b1ff',
    }

    const defaultShortcuts = {
      dashboard: 'ctrl+h',
      settings: 'ctrl+,',
      search: 'ctrl+k',
    }

    return this.createUserMenuPreferences({
      userId,
      theme: 'light',
      layout: 'default',
      customColors: defaultColors,
      shortcuts: defaultShortcuts,
    })
  }

  /**
   * Récupérer les préférences d'un utilisateur
   */
  async getUserMenuPreferences(userId: string): Promise<UserMenuPreferences | null> {
    this.logger.debug(`Getting menu preferences for user: ${userId}`)

    try {
      return await this.prisma.userMenuPreferences.findUnique({
        where: { userId },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user menu preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer les préférences avec les préférences d'items
   */
  async getUserMenuPreferencesWithItems(userId: string) {
    this.logger.debug(`Getting menu preferences with items for user: ${userId}`)

    try {
      return await this.prisma.userMenuPreferences.findUnique({
        where: { userId },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user menu preferences with items: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer ou créer les préférences d'un utilisateur
   */
  async getOrCreateUserMenuPreferences(userId: string): Promise<UserMenuPreferences> {
    this.logger.debug(`Getting or creating menu preferences for user: ${userId}`)

    let preferences = await this.getUserMenuPreferences(userId)

    if (!preferences) {
      preferences = await this.createDefaultPreferences(userId)
    }

    return preferences
  }

  /**
   * Mettre à jour les préférences
   */
  async updateUserMenuPreferences(
    userId: string,
    data: {
      theme?: string
      layout?: string
      customColors?: Record<string, any>
      shortcuts?: Record<string, any>
    }
  ): Promise<UserMenuPreferences> {
    this.logger.log(`Updating menu preferences for user: ${userId}`)

    try {
      const updateData: any = {}

      if (data.theme !== undefined) updateData.theme = data.theme
      if (data.layout !== undefined) updateData.layout = data.layout
      if (data.customColors) updateData.customColors = data.customColors as Prisma.InputJsonValue
      if (data.shortcuts) updateData.shortcuts = data.shortcuts as Prisma.InputJsonValue

      const preferences = await this.prisma.userMenuPreferences.update({
        where: { userId },
        data: updateData,
      })

      this.logger.log(`Menu preferences updated for user: ${userId}`)
      return preferences
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating user menu preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour le thème
   */
  async updateTheme(userId: string, theme: string): Promise<UserMenuPreferences> {
    this.logger.log(`Updating theme for user ${userId}: ${theme}`)

    return this.updateUserMenuPreferences(userId, { theme })
  }

  /**
   * Mettre à jour le layout
   */
  async updateLayout(userId: string, layout: string): Promise<UserMenuPreferences> {
    this.logger.log(`Updating layout for user ${userId}: ${layout}`)

    return this.updateUserMenuPreferences(userId, { layout })
  }

  /**
   * Mettre à jour les couleurs personnalisées
   */
  async updateCustomColors(userId: string, customColors: Record<string, any>): Promise<UserMenuPreferences> {
    this.logger.log(`Updating custom colors for user: ${userId}`)

    return this.updateUserMenuPreferences(userId, { customColors })
  }

  /**
   * Mettre à jour les raccourcis
   */
  async updateShortcuts(userId: string, shortcuts: Record<string, any>): Promise<UserMenuPreferences> {
    this.logger.log(`Updating shortcuts for user: ${userId}`)

    return this.updateUserMenuPreferences(userId, { shortcuts })
  }

  /**
   * Réinitialiser aux préférences par défaut
   */
  async resetToDefaults(userId: string): Promise<UserMenuPreferences> {
    this.logger.log(`Resetting menu preferences to defaults for user: ${userId}`)

    try {
      // Supprimer les préférences existantes
      await this.deleteUserMenuPreferences(userId)

      // Créer les préférences par défaut
      return await this.createDefaultPreferences(userId)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error resetting user menu preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer les préférences d'un utilisateur
   */
  async deleteUserMenuPreferences(userId: string): Promise<void> {
    this.logger.log(`Deleting menu preferences for user: ${userId}`)

    try {
      await this.prisma.userMenuPreferences.delete({
        where: { userId },
      })

      this.logger.log(`Menu preferences deleted for user: ${userId}`)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error deleting user menu preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Compter le nombre d'utilisateurs avec des préférences personnalisées
   */
  async countUsersWithPreferences(): Promise<number> {
    this.logger.debug('Counting users with menu preferences')

    try {
      return await this.prisma.userMenuPreferences.count()
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error counting users with preferences: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les thèmes utilisés
   */
  async getUsedThemes(): Promise<string[]> {
    this.logger.debug('Getting all used themes')

    try {
      const preferences = await this.prisma.userMenuPreferences.findMany({
        select: { theme: true },
        where: { theme: { not: null } },
        distinct: ['theme'],
      })

      return preferences.map((p) => p.theme).filter((t): t is string => t !== null)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting used themes: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Lister tous les layouts utilisés
   */
  async getUsedLayouts(): Promise<string[]> {
    this.logger.debug('Getting all used layouts')

    try {
      const preferences = await this.prisma.userMenuPreferences.findMany({
        select: { layout: true },
        where: { layout: { not: null } },
        distinct: ['layout'],
      })

      return preferences.map((p) => p.layout).filter((l): l is string => l !== null)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting used layouts: ${err.message}`, err.stack)
      throw error
    }
  }
}
