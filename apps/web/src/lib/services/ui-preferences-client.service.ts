import type { ReorderableListConfig } from '@erp/ui'

/**
 * Service pour gérer les préférences UI des utilisateurs (version client)
 * Utilise localStorage au lieu de la base de données
 */
export class UIPreferencesService {
  private static getStorageKey(userId: string, componentId: string): string {
    return `ui_pref_${userId}_${componentId}`
  }

  /**
   * Récupère la configuration d'un composant pour un utilisateur
   */
  static async getConfig(
    userId: string,
    componentId: string
  ): Promise<ReorderableListConfig | null> {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const key = UIPreferencesService.getStorageKey(userId, componentId)
      const stored = localStorage.getItem(key)

      if (!stored) {
        return null
      }

      return JSON.parse(stored)
    } catch (_error) {
      return null
    }
  }

  /**
   * Sauvegarde ou met à jour la configuration
   */
  static async saveConfig(
    userId: string,
    componentId: string,
    config: Partial<ReorderableListConfig>
  ): Promise<ReorderableListConfig> {
    if (typeof window === 'undefined') {
      return config as ReorderableListConfig
    }

    try {
      const key = UIPreferencesService.getStorageKey(userId, componentId)
      const existing = await UIPreferencesService.getConfig(userId, componentId)

      const updated = {
        ...existing,
        ...config,
        updatedAt: new Date().toISOString(),
      }

      localStorage.setItem(key, JSON.stringify(updated))

      return updated
    } catch (_error) {
      return config as ReorderableListConfig
    }
  }

  /**
   * Supprime la configuration
   */
  static async deleteConfig(userId: string, componentId: string): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const key = UIPreferencesService.getStorageKey(userId, componentId)
      localStorage.removeItem(key)
    } catch (_error) {}
  }

  /**
   * Récupère toutes les configurations d'un utilisateur
   */
  static async getAllConfigs(userId: string): Promise<ReorderableListConfig[]> {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const configs: ReorderableListConfig[] = []
      const prefix = `ui_pref_${userId}_`

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) {
          const value = localStorage.getItem(key)
          if (value) {
            try {
              configs.push(JSON.parse(value))
            } catch {
              // Ignorer les entrées invalides
            }
          }
        }
      }

      return configs
    } catch (_error) {
      return []
    }
  }

  /**
   * Clone une configuration vers un autre composant
   */
  static async cloneConfig(
    userId: string,
    sourceComponentId: string,
    targetComponentId: string
  ): Promise<ReorderableListConfig | null> {
    const sourceConfig = await UIPreferencesService.getConfig(userId, sourceComponentId)

    if (!sourceConfig) {
      return null
    }

    return await UIPreferencesService.saveConfig(userId, targetComponentId, {
      ...sourceConfig,
      componentId: targetComponentId,
    })
  }

  /**
   * Exporte toutes les configurations en JSON
   */
  static async exportConfigs(userId: string): Promise<string> {
    const configs = await UIPreferencesService.getAllConfigs(userId)
    return JSON.stringify(configs, null, 2)
  }

  /**
   * Importe des configurations depuis JSON
   */
  static async importConfigs(
    userId: string,
    jsonData: string
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = []
    let imported = 0

    try {
      const configs = JSON.parse(jsonData)

      if (!Array.isArray(configs)) {
        throw new Error('Les données doivent être un tableau de configurations')
      }

      for (const config of configs) {
        try {
          if (config.componentId) {
            await UIPreferencesService.saveConfig(userId, config.componentId, config)
            imported++
          }
        } catch (error) {
          errors.push(`Erreur lors de l'import de ${config.componentId}: ${error}`)
        }
      }
    } catch (error) {
      errors.push(`Erreur lors du parsing JSON: ${error}`)
    }

    return { imported, errors }
  }
}
