import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UiPreferencesReorderableList } from '../../../api/entities/ui-preferences-reorderable-list.entity'

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

@Injectable()
export class UIPreferencesReorderableListService {
  constructor(
    @InjectRepository(UiPreferencesReorderableList, 'auth')
    private readonly repository: Repository<UiPreferencesReorderableList>
  ) {}

  /**
   * Récupère la configuration d'un composant pour un utilisateur
   */
  async getConfig(userId: string, componentId: string): Promise<ReorderableListConfig | null> {
    try {
      const preference = await this.repository.findOne({
        where: {
          user_id: userId,
          component_id: componentId,
        },
      })

      if (!preference) {
        return null
      }

      return {
        id: preference.id,
        userId: preference.user_id,
        componentId: preference.component_id,
        theme: preference.theme,
        preferences: preference.preferences,
        layout: preference.layout,
        createdAt: preference.created_at,
        updatedAt: preference.updated_at,
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
    try {
      const existingPreference = await this.repository.findOne({
        where: {
          user_id: userId,
          component_id: componentId,
        },
      })

      let preference: UiPreferencesReorderableList

      if (existingPreference) {
        // Update existing
        Object.assign(existingPreference, {
          theme: config.theme || existingPreference.theme,
          preferences: config.preferences || existingPreference.preferences,
          layout: config.layout || existingPreference.layout,
          updated_at: new Date(),
        })
        preference = await this.repository.save(existingPreference)
      } else {
        // Create new
        const newPreference = this.repository.create({
          user_id: userId,
          component_id: componentId,
          theme: config.theme || 'default',
          preferences: config.preferences || {
            defaultExpanded: true,
            showLevelIndicators: true,
            showConnectionLines: true,
            enableAnimations: true,
            compactMode: false,
            customColors: {},
          },
          layout: config.layout || {
            maxDepth: 10,
            allowNesting: true,
            dragHandlePosition: 'left',
            expandButtonPosition: 'left',
          },
        })
        preference = await this.repository.save(newPreference)
      }

      return {
        id: preference.id,
        userId: preference.user_id,
        componentId: preference.component_id,
        theme: preference.theme,
        preferences: preference.preferences,
        layout: preference.layout,
        createdAt: preference.created_at,
        updatedAt: preference.updated_at,
      }
    } catch (_error) {
      throw new Error('Failed to save UI preference')
    }
  }

  /**
   * Supprime la configuration d'un composant (reset)
   */
  async deleteConfig(userId: string, componentId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({
        user_id: userId,
        component_id: componentId,
      })
      return result.affected ? result.affected > 0 : false
    } catch (_error) {
      throw new Error('Failed to delete UI preference')
    }
  }

  /**
   * Récupère toutes les préférences d'un utilisateur
   */
  async getAllUserConfigs(userId: string): Promise<ReorderableListConfig[]> {
    try {
      const preferences = await this.repository.find({
        where: { user_id: userId },
        order: { updated_at: 'DESC' },
      })

      return preferences.map((pref) => ({
        id: pref.id,
        userId: pref.user_id,
        componentId: pref.component_id,
        theme: pref.theme,
        preferences: pref.preferences,
        layout: pref.layout,
        createdAt: pref.created_at,
        updatedAt: pref.updated_at,
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
      const result = await this.repository.delete({ user_id: userId })
      return result.affected || 0
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
