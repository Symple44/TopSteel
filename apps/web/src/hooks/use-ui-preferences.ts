'use client'

import { useCallback, useMemo } from 'react'
import { useLocalStorage } from './use-local-storage'

// Types pour les préférences UI
export interface SidebarPreferences {
  isCollapsed: boolean
  expandedItems: string[]
  width: number
}

export interface DataTablePreferences {
  visibleColumns: string[]
  columnOrder: string[]
  columnWidths: Record<string, number>
  sortConfig: Array<{ column: string; direction: 'asc' | 'desc' }>
  filters: Record<string, unknown>
  pageSize: number
  viewMode: 'table' | 'cards' | 'kanban' | 'timeline'
}

export interface UIPreferences {
  sidebar: SidebarPreferences
  dataTables: Record<string, DataTablePreferences>
  theme: 'light' | 'dark' | 'system'
  density: 'compact' | 'comfortable' | 'spacious'
  fontSize: 'small' | 'medium' | 'large'
  animations: boolean
}

// Valeurs par défaut
const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
  isCollapsed: false,
  expandedItems: [],
  width: 260,
}

const DEFAULT_DATATABLE_PREFERENCES: DataTablePreferences = {
  visibleColumns: [],
  columnOrder: [],
  columnWidths: {},
  sortConfig: [],
  filters: {},
  pageSize: 25,
  viewMode: 'table',
}

const DEFAULT_UI_PREFERENCES: UIPreferences = {
  sidebar: DEFAULT_SIDEBAR_PREFERENCES,
  dataTables: {},
  theme: 'system',
  density: 'comfortable',
  fontSize: 'medium',
  animations: true,
}

const STORAGE_KEY = 'topsteel-ui-preferences'

/**
 * Hook pour gérer les préférences UI persistées
 */
export function useUIPreferences() {
  const [preferences, setPreferences, resetPreferences] = useLocalStorage<UIPreferences>(
    STORAGE_KEY,
    DEFAULT_UI_PREFERENCES
  )

  // Mettre à jour une partie des préférences
  const updatePreferences = useCallback(
    (updates: Partial<UIPreferences>) => {
      setPreferences((prev) => ({
        ...prev,
        ...updates,
      }))
    },
    [setPreferences]
  )

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  }
}

/**
 * Hook spécifique pour les préférences de la sidebar
 */
export function useSidebarPreferences() {
  const [preferences, setPreferences] = useLocalStorage<SidebarPreferences>(
    'topsteel-sidebar',
    DEFAULT_SIDEBAR_PREFERENCES
  )

  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      setPreferences((prev) => ({ ...prev, isCollapsed: collapsed }))
    },
    [setPreferences]
  )

  const toggleCollapsed = useCallback(() => {
    setPreferences((prev) => ({ ...prev, isCollapsed: !prev.isCollapsed }))
  }, [setPreferences])

  const toggleExpandedItem = useCallback(
    (itemId: string) => {
      setPreferences((prev) => ({
        ...prev,
        expandedItems: prev.expandedItems.includes(itemId)
          ? prev.expandedItems.filter((id) => id !== itemId)
          : [...prev.expandedItems, itemId],
      }))
    },
    [setPreferences]
  )

  const setExpandedItems = useCallback(
    (items: string[]) => {
      setPreferences((prev) => ({ ...prev, expandedItems: items }))
    },
    [setPreferences]
  )

  const setWidth = useCallback(
    (width: number) => {
      setPreferences((prev) => ({ ...prev, width }))
    },
    [setPreferences]
  )

  return {
    ...preferences,
    setCollapsed,
    toggleCollapsed,
    toggleExpandedItem,
    setExpandedItems,
    setWidth,
  }
}

/**
 * Hook spécifique pour les préférences d'un DataTable
 * @param tableId - Identifiant unique du tableau
 */
export function useDataTablePreferences(tableId: string) {
  const storageKey = `topsteel-datatable-${tableId}`
  const [preferences, setPreferences, resetPreferences] = useLocalStorage<DataTablePreferences>(
    storageKey,
    DEFAULT_DATATABLE_PREFERENCES
  )

  const setVisibleColumns = useCallback(
    (columns: string[]) => {
      setPreferences((prev) => ({ ...prev, visibleColumns: columns }))
    },
    [setPreferences]
  )

  const setColumnOrder = useCallback(
    (order: string[]) => {
      setPreferences((prev) => ({ ...prev, columnOrder: order }))
    },
    [setPreferences]
  )

  const setColumnWidth = useCallback(
    (columnId: string, width: number) => {
      setPreferences((prev) => ({
        ...prev,
        columnWidths: { ...prev.columnWidths, [columnId]: width },
      }))
    },
    [setPreferences]
  )

  const setSortConfig = useCallback(
    (config: Array<{ column: string; direction: 'asc' | 'desc' }>) => {
      setPreferences((prev) => ({ ...prev, sortConfig: config }))
    },
    [setPreferences]
  )

  const setFilters = useCallback(
    (filters: Record<string, unknown>) => {
      setPreferences((prev) => ({ ...prev, filters }))
    },
    [setPreferences]
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      setPreferences((prev) => ({ ...prev, pageSize }))
    },
    [setPreferences]
  )

  const setViewMode = useCallback(
    (viewMode: 'table' | 'cards' | 'kanban' | 'timeline') => {
      setPreferences((prev) => ({ ...prev, viewMode }))
    },
    [setPreferences]
  )

  return {
    ...preferences,
    setVisibleColumns,
    setColumnOrder,
    setColumnWidth,
    setSortConfig,
    setFilters,
    setPageSize,
    setViewMode,
    resetPreferences,
  }
}

/**
 * Hook pour les préférences d'affichage (thème, densité, etc.)
 */
export function useDisplayPreferences() {
  const [preferences, setPreferences] = useLocalStorage<{
    theme: 'light' | 'dark' | 'system'
    density: 'compact' | 'comfortable' | 'spacious'
    fontSize: 'small' | 'medium' | 'large'
    animations: boolean
  }>('topsteel-display', {
    theme: 'system',
    density: 'comfortable',
    fontSize: 'medium',
    animations: true,
  })

  const setTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      setPreferences((prev) => ({ ...prev, theme }))
    },
    [setPreferences]
  )

  const setDensity = useCallback(
    (density: 'compact' | 'comfortable' | 'spacious') => {
      setPreferences((prev) => ({ ...prev, density }))
      // Appliquer la classe sur le body
      document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
      document.body.classList.add(`density-${density}`)
    },
    [setPreferences]
  )

  const setFontSize = useCallback(
    (fontSize: 'small' | 'medium' | 'large') => {
      setPreferences((prev) => ({ ...prev, fontSize }))
      // Appliquer la classe sur le body
      document.body.classList.remove('font-small', 'font-medium', 'font-large')
      document.body.classList.add(`font-${fontSize}`)
    },
    [setPreferences]
  )

  const setAnimations = useCallback(
    (animations: boolean) => {
      setPreferences((prev) => ({ ...prev, animations }))
      // Appliquer ou retirer la classe pour désactiver les animations
      if (!animations) {
        document.body.classList.add('reduce-motion')
      } else {
        document.body.classList.remove('reduce-motion')
      }
    },
    [setPreferences]
  )

  // Appliquer les préférences au montage
  useMemo(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.add(`density-${preferences.density}`)
      document.body.classList.add(`font-${preferences.fontSize}`)
      if (!preferences.animations) {
        document.body.classList.add('reduce-motion')
      }
    }
  }, []) // Exécuté une seule fois au montage

  return {
    ...preferences,
    setTheme,
    setDensity,
    setFontSize,
    setAnimations,
  }
}
