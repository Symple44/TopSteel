'use client'

import { useCallback, useMemo, useState } from 'react'
import type { ColumnConfig } from './types'

export interface GroupNode<T = any> {
  id: string
  level: number
  groupValue: any
  groupLabel: string
  isExpanded: boolean
  items: T[]
  children: GroupNode<T>[]
  parent?: GroupNode<T>
  column: ColumnConfig<T>
}

export interface TreeGroupingConfig {
  columns: string[] // IDs des colonnes pour le regroupement, dans l'ordre
  expanded: Set<string> // IDs des nœuds étendus
}

export function useTreeGrouping<T = any>(
  data: T[],
  columns: ColumnConfig<T>[],
  initialConfig: TreeGroupingConfig = { columns: [], expanded: new Set() }
) {
  const [config, setConfig] = useState<TreeGroupingConfig>(initialConfig)

  // Construire l'arbre de regroupement
  const tree = useMemo(() => {
    if (config.columns.length === 0) {
      return { roots: [], flatList: data }
    }

    // Obtenir les colonnes de regroupement dans l'ordre
    const groupColumns = config.columns
      .map((colId) => columns.find((c) => c.id === colId))
      .filter(Boolean) as ColumnConfig<T>[]

    if (groupColumns.length === 0) {
      return { roots: [], flatList: data }
    }

    const nodeMap = new Map<string, GroupNode<T>>()
    const roots: GroupNode<T>[] = []

    // Fonction pour créer une clé unique pour un groupe
    const createGroupKey = (columnId: string, value: unknown, level: number) => {
      return `${level}_${columnId}_${String(value)}`
    }

    // Fonction pour obtenir la valeur d'affichage d'un groupe
    const getGroupLabel = (_column: ColumnConfig<T>, value: any) => {
      if (value === null || value === undefined) return 'Vide'
      if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
      if (Array.isArray(value)) return value.join(', ')
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }

    // Traiter chaque élément de données
    data.forEach((item) => {
      let currentParent: GroupNode<T> | undefined

      groupColumns.forEach((column, level) => {
        const value = column.getValue ? column.getValue(item) : (item as unknown)[column.key]
        const groupKey = createGroupKey(column.id, value, level)

        let node = nodeMap.get(groupKey)

        if (!node) {
          // Créer un nouveau nœud de groupe
          node = {
            id: groupKey,
            level,
            groupValue: value,
            groupLabel: getGroupLabel(column, value),
            isExpanded: config.expanded.has(groupKey),
            items: [],
            children: [],
            parent: currentParent,
            column,
          }

          nodeMap.set(groupKey, node)

          // Ajouter aux enfants du parent ou aux racines
          if (currentParent) {
            currentParent.children.push(node)
          } else {
            roots.push(node)
          }
        }

        // Ajouter l'élément au nœud final
        if (level === groupColumns.length - 1) {
          node.items.push(item)
        }

        currentParent = node
      })
    })

    // Trier les nœuds à chaque niveau
    const sortNodes = (nodes: GroupNode<T>[]) => {
      nodes.sort((a, b) => {
        // Tri par label de groupe
        return String(a.groupLabel).localeCompare(String(b.groupLabel))
      })

      // Récursivement trier les enfants
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          sortNodes(node.children)
        }
      })
    }

    sortNodes(roots)

    // Créer une liste plate pour l'affichage
    const flatList: (T | GroupNode<T>)[] = []

    const addToFlatList = (node: GroupNode<T>) => {
      flatList.push(node)

      if (node.isExpanded) {
        // Ajouter les enfants d'abord
        node.children.forEach(addToFlatList)

        // Puis les éléments finaux
        node.items.forEach((item) => {
          flatList.push(item)
        })
      }
    }

    roots.forEach(addToFlatList)

    return { roots, flatList }
  }, [data, columns, config])

  // Fonctions de manipulation
  const addGroupingColumn = useCallback((columnId: string) => {
    setConfig((prev) => ({
      ...prev,
      columns: prev.columns.includes(columnId) ? prev.columns : [...prev.columns, columnId],
    }))
  }, [])

  const removeGroupingColumn = useCallback((columnId: string) => {
    setConfig((prev) => ({
      ...prev,
      columns: prev.columns.filter((id) => id !== columnId),
    }))
  }, [])

  const reorderGroupingColumns = useCallback((oldIndex: number, newIndex: number) => {
    setConfig((prev) => {
      const newColumns = [...prev.columns]
      const [removed] = newColumns.splice(oldIndex, 1)
      newColumns.splice(newIndex, 0, removed)
      return { ...prev, columns: newColumns }
    })
  }, [])

  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setConfig((prev) => {
      const newExpanded = new Set(prev.expanded)
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId)
      } else {
        newExpanded.add(nodeId)
      }
      return { ...prev, expanded: newExpanded }
    })
  }, [])

  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>()

    const collectNodeIds = (node: GroupNode<T>) => {
      allNodeIds.add(node.id)
      node.children.forEach(collectNodeIds)
    }

    tree.roots.forEach(collectNodeIds)

    setConfig((prev) => ({ ...prev, expanded: allNodeIds }))
  }, [tree.roots])

  const collapseAll = useCallback(() => {
    setConfig((prev) => ({ ...prev, expanded: new Set() }))
  }, [])

  const clearGrouping = useCallback(() => {
    setConfig({ columns: [], expanded: new Set() })
  }, [])

  return {
    config,
    tree,
    isGrouped: config.columns.length > 0,
    groupingColumns: config.columns,
    addGroupingColumn,
    removeGroupingColumn,
    reorderGroupingColumns,
    toggleNodeExpansion,
    expandAll,
    collapseAll,
    clearGrouping,
    isGroupNode: (item: unknown): item is GroupNode<T> => {
      return item && typeof item === 'object' && 'groupLabel' in item && 'level' in item
    },
  }
}
