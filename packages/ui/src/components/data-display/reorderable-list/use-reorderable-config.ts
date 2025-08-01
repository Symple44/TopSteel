'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ReorderableListConfig } from './reorderable-list-theme'

// Configuration par défaut
const createDefaultConfig = (componentId: string): ReorderableListConfig => ({
  id: `${componentId}-${Date.now()}`,
  componentId,
  theme: 'default',
  preferences: {
    defaultExpanded: true,
    showLevelIndicators: true,
    showConnectionLines: true,
    enableAnimations: true,
    compactMode: false,
  },
  layout: {
    maxDepth: 10,
    allowNesting: true,
    dragHandlePosition: 'left',
    expandButtonPosition: 'left',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
})

// Hook pour gérer la configuration du ReorderableList
export function useReorderableConfig(componentId: string, userId?: string) {
  const [config, setConfig] = useState<ReorderableListConfig>(() =>
    createDefaultConfig(componentId)
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chargement de la configuration sauvegardée
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Tentative de chargement depuis l'API
      // Note: This should be implemented by the consuming application
      const response = await fetch(`/api/ui-preferences/reorderable-list/${componentId}`)

      if (response.ok) {
        const savedConfig = await response.json()
        setConfig({
          ...savedConfig,
          createdAt: new Date(savedConfig.createdAt),
          updatedAt: new Date(savedConfig.updatedAt),
        })
      } else {
        // Si pas de config sauvegardée, utiliser celle par défaut
        const fallbackConfig = createDefaultConfig(componentId)
        if (userId) {
          fallbackConfig.userId = userId
        }
        setConfig(fallbackConfig)
      }
    } catch (_err) {
      // Fallback vers localStorage en cas d'erreur API
      const localConfig = localStorage.getItem(`reorderable-config-${componentId}`)
      if (localConfig) {
        try {
          const parsed = JSON.parse(localConfig)
          setConfig({
            ...parsed,
            createdAt: new Date(parsed.createdAt),
            updatedAt: new Date(parsed.updatedAt),
          })
        } catch {
          setConfig(createDefaultConfig(componentId))
        }
      } else {
        setConfig(createDefaultConfig(componentId))
      }
      setError('Configuration chargée depuis le cache local')
    } finally {
      setLoading(false)
    }
  }, [componentId, userId])

  // Sauvegarde de la configuration
  const saveConfig = useCallback(
    async (newConfig: Partial<ReorderableListConfig>) => {
      try {
        setSaving(true)
        setError(null)

        const updatedConfig: ReorderableListConfig = {
          ...config,
          ...newConfig,
          updatedAt: new Date(),
        }

        // Sauvegarde via l'API
        // Note: This should be implemented by the consuming application
        const response = await fetch(`/api/ui-preferences/reorderable-list/${componentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedConfig),
        })

        if (response.ok) {
          setConfig(updatedConfig)

          // Sauvegarde également en localStorage comme backup
          localStorage.setItem(`reorderable-config-${componentId}`, JSON.stringify(updatedConfig))
        } else {
          throw new Error('Erreur lors de la sauvegarde')
        }
      } catch (_err) {
        // Fallback vers localStorage
        const updatedConfig: ReorderableListConfig = {
          ...config,
          ...newConfig,
          updatedAt: new Date(),
        }
        localStorage.setItem(`reorderable-config-${componentId}`, JSON.stringify(updatedConfig))
        setConfig(updatedConfig)
        setError('Configuration sauvegardée localement uniquement')
      } finally {
        setSaving(false)
      }
    },
    [config, componentId]
  )

  // Réinitialisation de la configuration
  const resetConfig = useCallback(async () => {
    const defaultConfig = createDefaultConfig(componentId)
    if (userId) {
      defaultConfig.userId = userId
    }
    await saveConfig(defaultConfig)
  }, [componentId, userId, saveConfig])

  // Mise à jour du thème
  const updateTheme = useCallback(
    async (themeId: string) => {
      await saveConfig({ theme: themeId })
    },
    [saveConfig]
  )

  // Mise à jour des préférences
  const updatePreferences = useCallback(
    async (preferences: Partial<ReorderableListConfig['preferences']>) => {
      await saveConfig({
        preferences: {
          ...config.preferences,
          ...preferences,
        },
      })
    },
    [config.preferences, saveConfig]
  )

  // Mise à jour du layout
  const updateLayout = useCallback(
    async (layout: Partial<ReorderableListConfig['layout']>) => {
      await saveConfig({
        layout: {
          ...config.layout,
          ...layout,
        },
      })
    },
    [config.layout, saveConfig]
  )

  // Chargement initial
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return {
    config,
    loading,
    saving,
    error,

    // Actions
    saveConfig,
    resetConfig,
    loadConfig,

    // Actions spécialisées
    updateTheme,
    updatePreferences,
    updateLayout,

    // Getters utiles
    currentTheme: config.theme,
    isCompactMode: config.preferences.compactMode,
    animationsEnabled: config.preferences.enableAnimations,
  }
}