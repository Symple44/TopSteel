'use client'

import { useCallback, useEffect, useState } from 'react'
import type { HierarchicalDatatableConfig, HierarchicalItem } from './use-hierarchical-reorder'

interface HierarchyOrderItem {
  item_id: string
  parent_id?: string | null
  display_order: number
  level: number
  path: string
}

export function useHierarchicalPreferences(
  tableId: string,
  _userId?: string,
  apiConfig?: {
    loadPreferences?: (tableId: string) => Promise<any>
    loadHierarchyOrder?: (tableId: string) => Promise<any>
    savePreferences?: (tableId: string, config: HierarchicalDatatableConfig) => Promise<any>
    saveHierarchyOrder?: (tableId: string, order: HierarchyOrderItem[]) => Promise<any>
  }
) {
  const [config, setConfig] = useState<HierarchicalDatatableConfig | null>(null)
  const [hierarchyOrder, setHierarchyOrder] = useState<HierarchyOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les préférences depuis l'API
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!apiConfig?.loadPreferences || !apiConfig?.loadHierarchyOrder) {
        // No API config provided, use defaults
        setConfig(null)
        setHierarchyOrder([])
        setLoading(false)
        return
      }

      const [preferencesResponse, orderResponse] = await Promise.all([
        apiConfig.loadPreferences(tableId),
        apiConfig.loadHierarchyOrder(tableId),
      ])

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json()
        setConfig({
          hierarchyConfig: preferencesData.hierarchyConfig,
          reorderConfig: preferencesData.reorderConfig,
          displayConfig: preferencesData.displayConfig,
          hierarchyFilters: preferencesData.hierarchyFilters,
        })
      } else {
        setConfig(getDefaultConfig())
      }

      if (orderResponse.ok) {
        const orderData = await orderResponse.json()
        setHierarchyOrder(orderData.items || [])
      } else {
        setHierarchyOrder([])
      }
    } catch (_err) {
      setError('Erreur lors du chargement des préférences')
      setConfig(getDefaultConfig())
      setHierarchyOrder([])
    } finally {
      setLoading(false)
    }
  }, [tableId, apiConfig])

  // Sauvegarder les préférences
  const savePreferences = useCallback(
    async (newConfig: HierarchicalDatatableConfig) => {
      try {
        if (apiConfig?.savePreferences) {
          const response = await apiConfig.savePreferences(tableId, newConfig)
          if (response.ok) {
            setConfig(newConfig)
          } else {
            throw new Error('Erreur lors de la sauvegarde des préférences')
          }
        } else {
          // No API config, just update local state
          setConfig(newConfig)
        }
      } catch (_err) {
        setError('Erreur lors de la sauvegarde des préférences')
      }
    },
    [tableId, apiConfig]
  )

  // Sauvegarder l'ordre hiérarchique
  const saveHierarchyOrder = useCallback(
    async (items: HierarchyOrderItem[]) => {
      try {
        if (apiConfig?.saveHierarchyOrder) {
          const response = await apiConfig.saveHierarchyOrder(tableId, items)
          if (response.ok) {
            setHierarchyOrder(items)
          } else {
            throw new Error("Erreur lors de la sauvegarde de l'ordre hiérarchique")
          }
        } else {
          // No API config, just update local state
          setHierarchyOrder(items)
        }
      } catch (_err) {
        setError("Erreur lors de la sauvegarde de l'ordre hiérarchique")
      }
    },
    [tableId, apiConfig]
  )

  // Appliquer l'ordre hiérarchique aux données
  const applyHierarchyOrder = useCallback(
    <T extends HierarchicalItem>(data: T[]): T[] => {
      if (hierarchyOrder.length === 0) {
        return data
      }

      // Créer une map des ordres
      const orderMap = new Map<string, HierarchyOrderItem>()
      hierarchyOrder.forEach((order) => {
        orderMap.set(order.item_id, order)
      })

      // Appliquer l'ordre aux données
      return data
        .map((item) => {
          const order = orderMap.get(item.id)
          if (order) {
            return {
              ...item,
              parent_id: order.parent_id,
              display_order: order.display_order,
              level: order.level,
            }
          }
          return item
        })
        .sort((a, b) => {
          const orderA = orderMap.get(a.id)?.display_order || 0
          const orderB = orderMap.get(b.id)?.display_order || 0
          return orderA - orderB
        })
    },
    [hierarchyOrder]
  )

  // Mettre à jour l'ordre hiérarchique à partir des données modifiées
  const updateHierarchyFromData = useCallback(
    <T extends HierarchicalItem>(data: T[]) => {
      const newHierarchyOrder: HierarchyOrderItem[] = data.map((item) => ({
        item_id: item.id,
        parent_id: item.parent_id || null,
        display_order: item.display_order || 0,
        level: item.level || 0,
        path: generatePath(item, data),
      }))

      saveHierarchyOrder(newHierarchyOrder)
    },
    [saveHierarchyOrder]
  )

  // Charger les préférences au montage
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return {
    config,
    hierarchyOrder,
    loading,
    error,
    savePreferences,
    saveHierarchyOrder,
    applyHierarchyOrder,
    updateHierarchyFromData,
    reloadPreferences: loadPreferences,
  }
}

// Configuration par défaut
function getDefaultConfig(): HierarchicalDatatableConfig {
  return {
    hierarchyConfig: {
      parentField: 'parent_id',
      childrenField: 'children',
      levelField: 'level',
      orderField: 'display_order',
      maxDepth: 10,
      allowNesting: true,
      defaultExpanded: true,
      expandedNodes: [],
    },
    reorderConfig: {
      enableDragDrop: true,
      allowLevelChange: true,
      preserveHierarchy: true,
      autoExpand: true,
      dragHandleVisible: true,
      dropIndicatorStyle: 'line',
    },
    displayConfig: {
      showLevelIndicators: true,
      showConnectionLines: true,
      indentSize: 24,
      levelColors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      compactMode: false,
      collapsibleGroups: true,
    },
    hierarchyFilters: {
      showOnlyLevels: [],
      hideEmptyParents: false,
      filterPreservesHierarchy: true,
      searchInChildren: true,
    },
  }
}

// Fonction utilitaire pour générer le chemin hiérarchique
function generatePath<T extends HierarchicalItem>(item: T, allItems: T[]): string {
  if (!item.parent_id) {
    return (item.display_order || 0).toString()
  }

  const parent = allItems.find((i) => i.id === item.parent_id)
  if (!parent) {
    return (item.display_order || 0).toString()
  }

  const parentPath = generatePath(parent, allItems)
  return `${parentPath}.${item.display_order || 0}`
}
