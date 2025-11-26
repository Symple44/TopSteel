import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'

export interface ReorderableListPreferences {
  defaultExpanded: boolean
  showLevelIndicators: boolean
  showConnectionLines: boolean
  enableAnimations: boolean
  compactMode: boolean
  customColors: Record<string, string>
}

export interface ReorderableListLayout {
  maxDepth: number
  allowNesting: boolean
  dragHandlePosition: 'left' | 'right'
  expandButtonPosition: 'left' | 'right'
}

export type ReorderableListTheme = 'default' | 'compact' | 'modern' | 'minimal' | 'colorful'

export interface ReorderableListConfig {
  id?: string
  userId: string
  componentId: string
  theme?: ReorderableListTheme
  preferences?: ReorderableListPreferences
  layout?: ReorderableListLayout
  createdAt?: Date
  updatedAt?: Date
}

/**
 * UIPreferencesReorderableListService - Clean Prisma implementation
 * Gère les préférences UI pour les composants de liste réordonnables
 */
@Injectable()
export class UIPreferencesReorderableListService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère la configuration d'un composant pour un utilisateur
   */
  async getConfig(userId: string, componentId: string): Promise<ReorderableListConfig | null> {
    try {
      const preference = await this.prisma.uiPreferencesReorderableList.findUnique({
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

      return {
        id: preference.id,
        userId: preference.userId,
        componentId: preference.componentId,
        theme: preference.theme as ReorderableListTheme,
        preferences: preference.preferences as unknown as ReorderableListPreferences,
        layout: preference.layout as unknown as ReorderableListLayout,
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
  async saveConfig(
    userId: string,
    componentId: string,
    config: Partial<ReorderableListConfig>
  ): Promise<ReorderableListConfig> {
    const defaultPreferences: ReorderableListPreferences = {
      defaultExpanded: true,
      showLevelIndicators: true,
      showConnectionLines: true,
      enableAnimations: true,
      compactMode: false,
      customColors: {},
    }

    const defaultLayout: ReorderableListLayout = {
      maxDepth: 10,
      allowNesting: true,
      dragHandlePosition: 'left',
      expandButtonPosition: 'left',
    }

    const preference = await this.prisma.uiPreferencesReorderableList.upsert({
      where: {
        userId_componentId: {
          userId,
          componentId,
        },
      },
      update: {
        theme: config.theme || 'default',
        preferences: (config.preferences || defaultPreferences) as any,
        layout: (config.layout || defaultLayout) as any,
      },
      create: {
        userId,
        componentId,
        theme: config.theme || 'default',
        preferences: (config.preferences || defaultPreferences) as any,
        layout: (config.layout || defaultLayout) as any,
      },
    })

    return {
      id: preference.id,
      userId: preference.userId,
      componentId: preference.componentId,
      theme: preference.theme as ReorderableListTheme,
      preferences: preference.preferences as unknown as ReorderableListPreferences,
      layout: preference.layout as unknown as ReorderableListLayout,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    }
  }

  /**
   * Supprime la configuration d'un composant (reset)
   */
  async deleteConfig(userId: string, componentId: string): Promise<boolean> {
    try {
      await this.prisma.uiPreferencesReorderableList.delete({
        where: {
          userId_componentId: {
            userId,
            componentId,
          },
        },
      })
      return true
    } catch (_error) {
      return false
    }
  }

  /**
   * Récupère toutes les préférences d'un utilisateur
   */
  async getAllUserConfigs(userId: string): Promise<ReorderableListConfig[]> {
    try {
      const preferences = await this.prisma.uiPreferencesReorderableList.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      })

      return preferences.map((pref) => ({
        id: pref.id,
        userId: pref.userId,
        componentId: pref.componentId,
        theme: pref.theme as ReorderableListTheme,
        preferences: pref.preferences as unknown as ReorderableListPreferences,
        layout: pref.layout as unknown as ReorderableListLayout,
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
  async cloneUserConfigs(sourceUserId: string, targetUserId: string): Promise<number> {
    try {
      const sourceConfigs = await this.getAllUserConfigs(sourceUserId)

      let clonedCount = 0
      for (const config of sourceConfigs) {
        await this.saveConfig(targetUserId, config.componentId, {
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
  async deleteAllUserConfigs(userId: string): Promise<number> {
    try {
      const result = await this.prisma.uiPreferencesReorderableList.deleteMany({
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
  async exportUserConfigs(userId: string): Promise<string> {
    try {
      const configs = await this.getAllUserConfigs(userId)
      return JSON.stringify(configs, null, 2)
    } catch (_error) {
      throw new Error('Failed to export UI preferences')
    }
  }

  /**
   * Importe les préférences pour un utilisateur
   */
  async importUserConfigs(
    userId: string,
    jsonData: string,
    overwrite: boolean = false
  ): Promise<number> {
    try {
      const configs = JSON.parse(jsonData) as ReorderableListConfig[]

      if (overwrite) {
        await this.deleteAllUserConfigs(userId)
      }

      let importedCount = 0
      for (const config of configs) {
        if (config.componentId) {
          await this.saveConfig(userId, config.componentId, {
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
