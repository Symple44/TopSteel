import type { ReorderableListConfig } from '@erp/ui'
import { callBackendApi } from '@/utils/backend-api'

/**
 * Service pour gérer les préférences UI des utilisateurs
 * Utilise l'API backend TypeORM au lieu de Prisma
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
      const response = await callBackendApi(`ui-preferences/reorderable-list/${componentId}`, {
        method: 'GET',
        headers: {
          'X-User-Id': userId, // Pass user ID for server-side auth
        },
      })

      if (!response?.ok) {
        if (response?.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch UI preference: ${response?.status}`)
      }

      const data = await response?.json()
      return data
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
      const response = await callBackendApi(`ui-preferences/reorderable-list/${componentId}`, {
        method: 'POST',
        headers: {
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          theme: config.theme,
          preferences: config.preferences,
          layout: config.layout,
        }),
      })

      if (!response?.ok) {
        throw new Error(`Failed to save UI preference: ${response?.status}`)
      }

      const data = await response?.json()
      return data
    } catch (_error) {
      throw new Error('Failed to save UI preference')
    }
  }

  /**
   * Supprime la configuration d'un composant (reset)
   */
  static async deleteConfig(userId: string, componentId: string): Promise<boolean> {
    try {
      const response = await callBackendApi(`ui-preferences/reorderable-list/${componentId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId,
        },
      })

      if (!response?.ok) {
        if (response?.status === 404) {
          return false
        }
        throw new Error(`Failed to delete UI preference: ${response?.status}`)
      }

      const data = await response?.json()
      return data?.success
    } catch (_error) {
      throw new Error('Failed to delete UI preference')
    }
  }

  /**
   * Récupère toutes les préférences d'un utilisateur
   */
  static async getAllUserConfigs(userId: string): Promise<ReorderableListConfig[]> {
    try {
      const response = await callBackendApi('ui-preferences/reorderable-list', {
        method: 'GET',
        headers: {
          'X-User-Id': userId,
        },
      })

      if (!response?.ok) {
        throw new Error(`Failed to fetch all UI preferences: ${response?.status}`)
      }

      const data = await response?.json()
      return data
    } catch (_error) {
      return []
    }
  }

  /**
   * Clone les préférences d'un utilisateur vers un autre
   */
  static async cloneUserConfigs(sourceUserId: string, targetUserId: string): Promise<number> {
    try {
      const response = await callBackendApi('ui-preferences/reorderable-list/clone', {
        method: 'POST',
        headers: {
          'X-User-Id': targetUserId,
        },
        body: JSON.stringify({
          sourceUserId,
        }),
      })

      if (!response?.ok) {
        throw new Error(`Failed to clone UI preferences: ${response?.status}`)
      }

      const data = await response?.json()
      return data?.clonedCount
    } catch (_error) {
      throw new Error('Failed to clone UI preferences')
    }
  }

  /**
   * Supprime toutes les préférences d'un utilisateur
   */
  static async deleteAllUserConfigs(userId: string): Promise<number> {
    try {
      const response = await callBackendApi('ui-preferences/reorderable-list', {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId,
        },
      })

      if (!response?.ok) {
        throw new Error(`Failed to delete all UI preferences: ${response?.status}`)
      }

      const data = await response?.json()
      return data?.deletedCount
    } catch (_error) {
      throw new Error('Failed to delete all UI preferences')
    }
  }

  /**
   * Exporte les préférences d'un utilisateur
   */
  static async exportUserConfigs(userId: string): Promise<string> {
    try {
      const response = await callBackendApi('ui-preferences/reorderable-list/export', {
        method: 'GET',
        headers: {
          'X-User-Id': userId,
        },
      })

      if (!response?.ok) {
        throw new Error(`Failed to export UI preferences: ${response?.status}`)
      }

      const data = await response?.json()
      return data?.data
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
      const response = await callBackendApi('ui-preferences/reorderable-list/import', {
        method: 'POST',
        headers: {
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          jsonData,
          overwrite,
        }),
      })

      if (!response?.ok) {
        throw new Error(`Failed to import UI preferences: ${response?.status}`)
      }

      const data = await response?.json()
      return data?.importedCount
    } catch (_error) {
      throw new Error('Failed to import UI preferences')
    }
  }
}

// Export default instance
export const uiPreferencesService = UIPreferencesService
