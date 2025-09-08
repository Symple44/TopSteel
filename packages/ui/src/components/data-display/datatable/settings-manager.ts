import React from 'react'
import type { ColumnConfig, TableSettings } from './types'

/**
 * Gestionnaire pour la sauvegarde et le chargement des paramètres utilisateur
 */
export class SettingsManager {
  private static readonly STORAGE_PREFIX = 'datatable-settings-'
  private static readonly DEFAULT_EXPIRY_DAYS = 30

  /**
   * Sauvegarde les paramètres pour une table donnée
   */
  static saveSettings(tableId: string, settings: TableSettings, userId?: string): void {
    try {
      const key = SettingsManager.getStorageKey(tableId, userId)
      const data = {
        settings,
        timestamp: Date.now(),
        version: '1.0',
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data))
      }
    } catch (_error) {}
  }

  /**
   * Charge les paramètres pour une table donnée
   */
  static loadSettings(tableId: string, userId?: string): TableSettings | null {
    try {
      const key = SettingsManager.getStorageKey(tableId, userId)

      if (typeof window === 'undefined') {
        return null
      }

      const stored = localStorage.getItem(key)
      if (!stored) return null

      const data = JSON.parse(stored)

      // Vérifier l'expiration
      if (SettingsManager.isExpired(data.timestamp)) {
        SettingsManager.removeSettings(tableId, userId)
        return null
      }

      return data.settings as TableSettings
    } catch (_error) {
      return null
    }
  }

  /**
   * Supprime les paramètres pour une table donnée
   */
  static removeSettings(tableId: string, userId?: string): void {
    try {
      const key = SettingsManager.getStorageKey(tableId, userId)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (_error) {}
  }

  /**
   * Liste toutes les tables avec des paramètres sauvegardés
   */
  static listSavedTables(userId?: string): string[] {
    try {
      if (typeof window === 'undefined') {
        return []
      }

      const tables: string[] = []
      const prefix = SettingsManager.getStoragePrefix(userId)

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) {
          const tableId = key.replace(prefix, '')
          tables.push(tableId)
        }
      }

      return tables
    } catch (_error) {
      return []
    }
  }

  /**
   * Nettoie les paramètres expirés
   */
  static cleanupExpiredSettings(): void {
    try {
      if (typeof window === 'undefined') {
        return
      }

      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(SettingsManager.STORAGE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const data = JSON.parse(stored)
              if (SettingsManager.isExpired(data.timestamp)) {
                keysToRemove.push(key)
              }
            }
          } catch {
            // Supprimer les données corrompues
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
      })
    } catch (_error) {}
  }

  /**
   * Exporte tous les paramètres utilisateur
   */
  static exportSettings(userId?: string): object {
    try {
      const settings: Record<string, unknown> = {}
      const prefix = SettingsManager.getStoragePrefix(userId)

      if (typeof window === 'undefined') {
        return settings
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) {
          const tableId = key.replace(prefix, '')
          const stored = localStorage.getItem(key)
          if (stored) {
            settings[tableId] = JSON.parse(stored)
          }
        }
      }

      return settings
    } catch (_error) {
      return {}
    }
  }

  /**
   * Importe des paramètres utilisateur
   */
  static importSettings(settingsData: Record<string, unknown>, userId?: string): void {
    try {
      Object.entries(settingsData).forEach(([tableId, data]) => {
        SettingsManager.saveSettings(tableId, data.settings, userId)
      })
    } catch (_error) {}
  }

  /**
   * Génère la clé de stockage
   */
  private static getStorageKey(tableId: string, userId?: string): string {
    return `${SettingsManager.getStoragePrefix(userId)}${tableId}`
  }

  /**
   * Génère le préfixe de stockage
   */
  private static getStoragePrefix(userId?: string): string {
    return userId ? `${SettingsManager.STORAGE_PREFIX}${userId}-` : SettingsManager.STORAGE_PREFIX
  }

  /**
   * Vérifie si les paramètres sont expirés
   */
  private static isExpired(timestamp: number): boolean {
    const now = Date.now()
    const expiryTime = SettingsManager.DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    return now - timestamp > expiryTime
  }

  /**
   * Fusionne des paramètres par défaut avec des paramètres sauvegardés
   */
  static mergeSettings(
    defaultSettings: Partial<TableSettings>,
    savedSettings: TableSettings | null
  ): TableSettings {
    if (!savedSettings) {
      return {
        columns: {},
        ...defaultSettings,
      } as TableSettings
    }

    return {
      ...defaultSettings,
      ...savedSettings,
      columns: {
        ...defaultSettings.columns,
        ...savedSettings.columns,
      },
    }
  }

  /**
   * Crée des paramètres par défaut basés sur la configuration des colonnes
   */
  static createDefaultSettings<T>(columns: ColumnConfig<T>[]): TableSettings {
    const columnSettings: TableSettings['columns'] = {}

    columns.forEach((column, index) => {
      columnSettings[column.id] = {
        visible: column.visible !== false,
        width: column.width,
        order: index,
      }
    })

    return {
      columns: columnSettings,
    }
  }

  /**
   * Valide que les paramètres sont compatibles avec les colonnes actuelles
   */
  static validateSettings<T>(settings: TableSettings, columns: ColumnConfig<T>[]): TableSettings {
    const validatedSettings: TableSettings = {
      ...settings,
      columns: {},
    }

    // Valider et nettoyer les paramètres de colonnes
    columns.forEach((column, index) => {
      const existingSettings = settings.columns[column.id]

      validatedSettings.columns[column.id] = {
        visible:
          existingSettings?.visible !== undefined
            ? existingSettings.visible
            : column.visible !== false,
        width: existingSettings?.width || column.width,
        order: existingSettings?.order !== undefined ? existingSettings.order : index,
      }
    })

    // Supprimer les paramètres de colonnes qui n'existent plus
    Object.keys(settings.columns).forEach((columnId) => {
      if (!columns.find((col) => col.id === columnId)) {
        delete validatedSettings.columns[columnId]
      }
    })

    return validatedSettings
  }
}

/**
 * Hook pour utiliser les paramètres avec sauvegarde automatique
 */
export const usePersistedTableSettings = <T>(
  tableId: string,
  columns: ColumnConfig<T>[],
  userId?: string,
  autoSave: boolean = true
) => {
  const [settings, setSettingsState] = React.useState<TableSettings>(() => {
    const defaultSettings = SettingsManager.createDefaultSettings(columns)
    const savedSettings = SettingsManager.loadSettings(tableId, userId)

    if (savedSettings) {
      return SettingsManager.validateSettings(
        SettingsManager.mergeSettings(defaultSettings, savedSettings),
        columns
      )
    }

    return defaultSettings
  })

  const setSettings = React.useCallback(
    (newSettings: TableSettings) => {
      const validatedSettings = SettingsManager.validateSettings(newSettings, columns)
      setSettingsState(validatedSettings)

      if (autoSave) {
        SettingsManager.saveSettings(tableId, validatedSettings, userId)
      }
    },
    [tableId, columns, userId, autoSave]
  )

  const resetSettings = React.useCallback(() => {
    const defaultSettings = SettingsManager.createDefaultSettings(columns)
    setSettingsState(defaultSettings)
    SettingsManager.removeSettings(tableId, userId)
  }, [tableId, columns, userId])

  const exportSettings = React.useCallback(() => {
    return SettingsManager.exportSettings(userId)
  }, [userId])

  const importSettings = React.useCallback(
    (settingsData: Record<string, unknown>) => {
      SettingsManager.importSettings(settingsData, userId)
      // Recharger les paramètres après l'import
      const reloadedSettings = SettingsManager.loadSettings(tableId, userId)
      if (reloadedSettings) {
        setSettingsState(SettingsManager.validateSettings(reloadedSettings, columns))
      }
    },
    [tableId, columns, userId]
  )

  return {
    settings,
    setSettings,
    resetSettings,
    exportSettings,
    importSettings,
  }
}

// Nettoyage automatique au chargement (si dans un navigateur)
if (typeof window !== 'undefined') {
  // Nettoyer les paramètres expirés une fois par session
  const cleanupKey = 'datatable-cleanup-done'
  if (!sessionStorage.getItem(cleanupKey)) {
    SettingsManager.cleanupExpiredSettings()
    sessionStorage.setItem(cleanupKey, 'true')
  }
}
