import type { ReorderableListConfig } from '@erp/ui'
import { prisma } from '@/lib/prisma'

/**
 * Service pour gérer les préférences UI des utilisateurs
 * Stockage en base de données avec cache Redis optionnel
 */
export class UIPreferencesService {
  /**
   * Récupère la configuration d'un composant pour un utilisateur
   */
  static async getConfig(
    userId: string,
    componentId: string
  ): Promise<ReorderableListConfig | null> {
    try {
      const preference = await prisma.uiPreference.findUnique({
        where: {
          userId_componentId: {
            userId,
            componentId,
          },
        },
      })

      if (!preference) {
        return null
      }

      // Construire l'objet de configuration
      return {
        id: preference.id,
        userId: preference.userId,
        componentId: preference.componentId,
        theme: preference.theme as any,
        preferences: preference.preferences as any,
        layout: preference.layout as any,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      }
    } catch (_error) {
      return null
    }
  }

  /**
   * Sauvegarde ou met à jour la configuration d'un composant
   */
  static async saveConfig(
    userId: string,
    componentId: string,
    config: Partial<ReorderableListConfig>
  ): Promise<ReorderableListConfig> {
    try {
      const preference = await prisma.uiPreference.upsert({
        where: {
          userId_componentId: {
            userId,
            componentId,
          },
        },
        update: {
          theme: config.theme || {},
          preferences: config.preferences || {},
          layout: config.layout || {},
          updatedAt: new Date(),
        },
        create: {
          userId,
          componentId,
          theme: config.theme || {},
          preferences: config.preferences || {},
          layout: config.layout || {},
        },
      })

      return {
        id: preference.id,
        userId: preference.userId,
        componentId: preference.componentId,
        theme: preference.theme as any,
        preferences: preference.preferences as any,
        layout: preference.layout as any,
        createdAt: preference.createdAt,
        updatedAt: preference.updatedAt,
      }
    } catch (_error) {
      throw new Error('Failed to save UI preference')
    }
  }

  /**
   * Supprime la configuration d'un composant (reset)
   */
  static async deleteConfig(userId: string, componentId: string): Promise<boolean> {
    try {
      await prisma.uiPreference.delete({
        where: {
          userId_componentId: {
            userId,
            componentId,
          },
        },
      })
      return true
    } catch (error) {
      // Si l'erreur est "Record not found", c'est OK
      if ((error as any).code === 'P2025') {
        return false
      }
      throw new Error('Failed to delete UI preference')
    }
  }

  /**
   * Récupère toutes les préférences d'un utilisateur
   */
  static async getAllUserConfigs(userId: string): Promise<ReorderableListConfig[]> {
    try {
      const preferences = await prisma.uiPreference.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      })

      return preferences.map((pref) => ({
        id: pref.id,
        userId: pref.userId,
        componentId: pref.componentId,
        theme: pref.theme as any,
        preferences: pref.preferences as any,
        layout: pref.layout as any,
        createdAt: pref.createdAt,
        updatedAt: pref.updatedAt,
      }))
    } catch (_error) {
      return []
    }
  }

  /**
   * Clone les préférences d'un utilisateur vers un autre
   */
  static async cloneUserConfigs(sourceUserId: string, targetUserId: string): Promise<number> {
    try {
      const sourceConfigs = await UIPreferencesService.getAllUserConfigs(sourceUserId)

      let clonedCount = 0
      for (const config of sourceConfigs) {
        await UIPreferencesService.saveConfig(targetUserId, config.componentId, {
          theme: config.theme,
          preferences: config.preferences,
          layout: config.layout,
        })
        clonedCount++
      }

      return clonedCount
    } catch (_error) {
      throw new Error('Failed to clone UI preferences')
    }
  }

  /**
   * Supprime toutes les préférences d'un utilisateur
   */
  static async deleteAllUserConfigs(userId: string): Promise<number> {
    try {
      const result = await prisma.uiPreference.deleteMany({
        where: { userId },
      })
      return result.count
    } catch (_error) {
      throw new Error('Failed to delete all UI preferences')
    }
  }

  /**
   * Exporte les préférences d'un utilisateur
   */
  static async exportUserConfigs(userId: string): Promise<string> {
    try {
      const configs = await UIPreferencesService.getAllUserConfigs(userId)
      return JSON.stringify(configs, null, 2)
    } catch (_error) {
      throw new Error('Failed to export UI preferences')
    }
  }

  /**
   * Importe les préférences pour un utilisateur
   */
  static async importUserConfigs(
    userId: string,
    jsonData: string,
    overwrite: boolean = false
  ): Promise<number> {
    try {
      const configs = JSON.parse(jsonData) as ReorderableListConfig[]

      if (overwrite) {
        await UIPreferencesService.deleteAllUserConfigs(userId)
      }

      let importedCount = 0
      for (const config of configs) {
        if (config.componentId) {
          await UIPreferencesService.saveConfig(userId, config.componentId, {
            theme: config.theme,
            preferences: config.preferences,
            layout: config.layout,
          })
          importedCount++
        }
      }

      return importedCount
    } catch (_error) {
      throw new Error('Failed to import UI preferences')
    }
  }
}
