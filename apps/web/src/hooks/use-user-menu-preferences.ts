'use client'

import { useCallback, useEffect, useState } from 'react'
import { callClientApi } from '../utils/backend-api'

export interface UserMenuPreferences {
  id: string
  userId: string
  baseConfigId?: string
  useCustomLayout: boolean
  layoutType: 'standard' | 'compact' | 'expanded' | 'minimal'
  showIcons: boolean
  showBadges: boolean
  allowCollapse: boolean
  theme: 'light' | 'dark' | 'auto'
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  favoriteItems?: string[]
  hiddenItems?: string[]
  pinnedItems?: string[]
  customOrder?: Record<string, number>
  shortcuts?: Array<{
    key: string
    href: string
    title: string
  }>
}

export interface MenuItemAction {
  action: 'favorite' | 'unfavorite' | 'hide' | 'show' | 'pin' | 'unpin' | 'reorder'
  menuItemId: string
  value?: unknown
}

export interface UpdatePreferencesDto {
  useCustomLayout?: boolean
  layoutType?: 'standard' | 'compact' | 'expanded' | 'minimal'
  showIcons?: boolean
  showBadges?: boolean
  allowCollapse?: boolean
  theme?: 'light' | 'dark' | 'auto'
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
}

export function useUserMenuPreferences() {
  const [preferences, setPreferences] = useState<UserMenuPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await callClientApi('user/menu-preferences')
      const data = await response?.json()

      if (data?.success) {
        setPreferences(data?.data)
      } else {
        setError('Erreur lors du chargement des préférences')
      }
    } catch (_err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePreferences = useCallback(async (updates: UpdatePreferencesDto) => {
    try {
      const response = await callClientApi('user/menu-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response?.json()

      if (data?.success) {
        setPreferences(data?.data)
        return true
      } else {
        setError('Erreur lors de la mise à jour')
        return false
      }
    } catch (_err) {
      setError('Erreur de connexion')
      return false
    }
  }, [])

  const resetPreferences = useCallback(async () => {
    try {
      const response = await callClientApi('user/menu-preferences/reset', {
        method: 'POST',
      })

      const data = await response?.json()

      if (data?.success) {
        setPreferences(data?.data)
        return true
      } else {
        setError('Erreur lors de la réinitialisation')
        return false
      }
    } catch (_err) {
      setError('Erreur de connexion')
      return false
    }
  }, [])

  // Actions sur les items de menu
  const executeMenuItemAction = useCallback(
    async (action: MenuItemAction) => {
      try {
        const response = await callClientApi('user/menu-preferences/items/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        })

        if (response?.ok) {
          await loadPreferences() // Recharger les préférences
          return true
        } else {
          setError("Erreur lors de l'action sur l'item")
          return false
        }
      } catch (_err) {
        setError('Erreur de connexion')
        return false
      }
    },
    [loadPreferences]
  )

  // Favoris
  const toggleFavorite = useCallback(
    async (itemId: string, isFavorite: boolean) => {
      return await executeMenuItemAction({
        action: isFavorite ? 'favorite' : 'unfavorite',
        menuItemId: itemId,
      })
    },
    [executeMenuItemAction]
  )

  // Épingler/Désépingler
  const togglePin = useCallback(
    async (itemId: string, isPinned: boolean) => {
      return await executeMenuItemAction({
        action: isPinned ? 'pin' : 'unpin',
        menuItemId: itemId,
      })
    },
    [executeMenuItemAction]
  )

  // Masquer/Afficher
  const toggleVisibility = useCallback(
    async (itemId: string, isVisible: boolean) => {
      return await executeMenuItemAction({
        action: isVisible ? 'show' : 'hide',
        menuItemId: itemId,
      })
    },
    [executeMenuItemAction]
  )

  // Réorganiser les items
  const reorderItems = useCallback(
    async (items: Array<{ itemId: string; order: number }>) => {
      try {
        const response = await callClientApi('user/menu-preferences/items/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        })

        if (response?.ok) {
          await loadPreferences()
          return true
        } else {
          setError('Erreur lors de la réorganisation')
          return false
        }
      } catch (_err) {
        setError('Erreur de connexion')
        return false
      }
    },
    [loadPreferences]
  )

  // Raccourcis
  const addShortcut = useCallback(
    async (shortcut: { key: string; href: string; title: string }) => {
      try {
        const response = await callClientApi('user/menu-preferences/shortcuts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shortcut),
        })

        if (response?.ok) {
          await loadPreferences()
          return true
        } else {
          setError("Erreur lors de l'ajout du raccourci")
          return false
        }
      } catch (_err) {
        setError('Erreur de connexion')
        return false
      }
    },
    [loadPreferences]
  )

  const removeShortcut = useCallback(
    async (key: string) => {
      try {
        const response = await callClientApi(`user/menu-preferences/shortcuts/${key}`, {
          method: 'DELETE',
        })

        if (response?.ok) {
          await loadPreferences()
          return true
        } else {
          setError('Erreur lors de la suppression du raccourci')
          return false
        }
      } catch (_err) {
        setError('Erreur de connexion')
        return false
      }
    },
    [loadPreferences]
  )

  // Templates
  const applyTemplate = useCallback(
    async (templateType: 'minimal' | 'business' | 'admin' | 'developer') => {
      try {
        const response = await callClientApi(`user/menu-preferences/templates/${templateType}`, {
          method: 'POST',
        })

        const data = await response?.json()

        if (data?.success) {
          setPreferences(data?.data)
          return true
        } else {
          setError("Erreur lors de l'application du template")
          return false
        }
      } catch (_err) {
        setError('Erreur de connexion')
        return false
      }
    },
    []
  )

  // Import/Export
  const exportPreferences = useCallback(async () => {
    try {
      window.open('/api/user/menu-preferences/export', '_blank')
      return true
    } catch (_err) {
      setError("Erreur lors de l'export")
      return false
    }
  }, [])

  const importPreferences = useCallback(async (importData: Record<string, unknown>) => {
    try {
      const response = await callClientApi('user/menu-preferences/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      })

      const data = await response?.json()

      if (data?.success) {
        setPreferences(data?.data)
        return true
      } else {
        setError("Erreur lors de l'import")
        return false
      }
    } catch (_err) {
      setError('Erreur de connexion')
      return false
    }
  }, [])

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  // Fonctions utilitaires
  const isItemFavorite = useCallback(
    (itemId: string) => {
      return preferences?.favoriteItems?.includes(itemId) || false
    },
    [preferences]
  )

  const isItemHidden = useCallback(
    (itemId: string) => {
      return preferences?.hiddenItems?.includes(itemId) || false
    },
    [preferences]
  )

  const isItemPinned = useCallback(
    (itemId: string) => {
      return preferences?.pinnedItems?.includes(itemId) || false
    },
    [preferences]
  )

  const getItemOrder = useCallback(
    (itemId: string) => {
      return preferences?.customOrder?.[itemId] ?? 999
    },
    [preferences]
  )

  return {
    preferences,
    loading,
    error,

    // Actions principales
    updatePreferences,
    resetPreferences,
    loadPreferences,

    // Actions sur les items
    executeMenuItemAction,
    toggleFavorite,
    togglePin,
    toggleVisibility,
    reorderItems,

    // Raccourcis
    addShortcut,
    removeShortcut,

    // Templates
    applyTemplate,

    // Import/Export
    exportPreferences,
    importPreferences,

    // Utilitaires
    isItemFavorite,
    isItemHidden,
    isItemPinned,
    getItemOrder,
  }
}
