'use client'

import { useCallback, useMemo, useState } from 'react'

export interface HierarchicalItem {
  id: string
  parent_id?: string | null
  level?: number
  display_order?: number
  children?: HierarchicalItem[]
  [key: string]: any
}

export interface HierarchicalConfig {
  parentField: string
  childrenField: string
  levelField: string
  orderField: string
  maxDepth: number
  allowNesting: boolean
  defaultExpanded: boolean
  expandedNodes: string[]
}

export interface ReorderConfig {
  enableDragDrop: boolean
  allowLevelChange: boolean
  preserveHierarchy: boolean
  autoExpand: boolean
  dragHandleVisible: boolean
  dropIndicatorStyle: 'line' | 'highlight'
}

export interface DisplayConfig {
  showLevelIndicators: boolean
  showConnectionLines: boolean
  indentSize: number
  levelColors: string[]
  compactMode: boolean
  collapsibleGroups: boolean
}

export interface HierarchyFilters {
  showOnlyLevels: number[]
  hideEmptyParents: boolean
  filterPreservesHierarchy: boolean
  searchInChildren: boolean
}

export interface HierarchicalDatatableConfig {
  hierarchyConfig: HierarchicalConfig
  reorderConfig: ReorderConfig
  displayConfig: DisplayConfig
  hierarchyFilters: HierarchyFilters
}

export interface HierarchicalTreeNode<T extends HierarchicalItem = HierarchicalItem> {
  id: string
  item: T
  level: number
  parent?: HierarchicalTreeNode<T>
  children: HierarchicalTreeNode<T>[]
  path: string
  isExpanded: boolean
  hasChildren: boolean
}

// Fonction utilitaire pour construire l'arbre hiérarchique
function buildHierarchicalTree<T extends HierarchicalItem>(
  items: T[],
  config: HierarchicalConfig,
  expandedNodes: Set<string>
): HierarchicalTreeNode<T>[] {
  const { parentField, levelField: _levelField, orderField } = config

  // Créer une map pour un accès rapide
  const itemMap = new Map<string, T>()
  const nodeMap = new Map<string, HierarchicalTreeNode<T>>()

  items.forEach((item) => {
    itemMap.set(item.id, item)
  })

  // Fonction récursive pour construire les nœuds
  const buildNode = (
    item: T,
    level: number,
    parent?: HierarchicalTreeNode<T>,
    path: string = ''
  ): HierarchicalTreeNode<T> => {
    const currentPath = path ? `${path}.${item.id}` : item.id

    const node: HierarchicalTreeNode<T> = {
      id: item.id,
      item,
      level,
      parent,
      children: [],
      path: currentPath,
      isExpanded: expandedNodes.has(item.id),
      hasChildren: false,
    }

    nodeMap.set(item.id, node)
    return node
  }

  // Séparer les éléments racines et enfants
  const rootItems: T[] = []
  const childrenMap = new Map<string, T[]>()

  items.forEach((item) => {
    const parentId = item[parentField as keyof T] as string
    if (!parentId || parentId === null) {
      rootItems.push(item)
    } else {
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, [])
      }
      childrenMap.get(parentId)?.push(item)
    }
  })

  // Trier les éléments par ordre d'affichage
  const sortByOrder = (items: T[]) => {
    return items.sort((a, b) => {
      const orderA = (a[orderField as keyof T] as number) || 0
      const orderB = (b[orderField as keyof T] as number) || 0
      return orderA - orderB
    })
  }

  // Construire l'arbre récursivement
  const buildTreeRecursively = (
    items: T[],
    level: number,
    parent?: HierarchicalTreeNode<T>,
    pathPrefix: string = ''
  ): HierarchicalTreeNode<T>[] => {
    const nodes: HierarchicalTreeNode<T>[] = []

    sortByOrder(items).forEach((item, _index) => {
      const currentPath = pathPrefix ? `${pathPrefix}.${item.id}` : item.id
      const node = buildNode(item, level, parent, currentPath)

      // Construire les enfants
      const children = childrenMap.get(item.id) || []
      if (children.length > 0) {
        node.hasChildren = true
        node.children = buildTreeRecursively(children, level + 1, node, currentPath)
      }

      nodes.push(node)
    })

    return nodes
  }

  return buildTreeRecursively(rootItems, 0)
}

// Fonction pour aplatir l'arbre en liste visible
function flattenVisibleTree<T extends HierarchicalItem>(
  nodes: HierarchicalTreeNode<T>[],
  config: HierarchyFilters
): HierarchicalTreeNode<T>[] {
  const result: HierarchicalTreeNode<T>[] = []
  const { showOnlyLevels, hideEmptyParents } = config

  const traverse = (nodes: HierarchicalTreeNode<T>[]) => {
    nodes.forEach((node) => {
      // Filtrer par niveaux si spécifié
      const shouldShowLevel = showOnlyLevels.length === 0 || showOnlyLevels.includes(node.level)

      // Filtrer les parents vides si configuré
      const shouldShowParent =
        !hideEmptyParents ||
        !node.hasChildren ||
        node.children.some(
          (child) => showOnlyLevels.length === 0 || showOnlyLevels.includes(child.level)
        )

      if (shouldShowLevel && shouldShowParent) {
        result.push(node)
      }

      // Traiter les enfants si le nœud est étendu
      if (node.isExpanded && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(nodes)
  return result
}

export function useHierarchicalReorder<T extends HierarchicalItem = HierarchicalItem>(
  data: T[],
  initialConfig: HierarchicalDatatableConfig,
  onDataChange?: (data: T[]) => void,
  onConfigChange?: (config: HierarchicalDatatableConfig) => void
) {
  const [config, setConfig] = useState<HierarchicalDatatableConfig>(initialConfig)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(config.hierarchyConfig.expandedNodes)
  )
  const [draggedItem, setDraggedItem] = useState<HierarchicalTreeNode<T> | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | 'inside'>('inside')

  // Construire l'arbre hiérarchique
  const tree = useMemo(() => {
    return buildHierarchicalTree(data, config.hierarchyConfig, expandedNodes)
  }, [data, config.hierarchyConfig, expandedNodes])

  // Liste aplatie pour l'affichage
  const flattenedTree = useMemo(() => {
    return flattenVisibleTree(tree, config.hierarchyFilters)
  }, [tree, config.hierarchyFilters])

  // Fonctions de manipulation de l'expansion
  const toggleNodeExpansion = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId)
        } else {
          newSet.add(nodeId)
        }

        // Mettre à jour la configuration
        const newConfig = {
          ...config,
          hierarchyConfig: {
            ...config.hierarchyConfig,
            expandedNodes: Array.from(newSet),
          },
        }
        setConfig(newConfig)
        onConfigChange?.(newConfig)

        return newSet
      })
    },
    [config, onConfigChange]
  )

  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>()

    const collectNodeIds = (nodes: HierarchicalTreeNode<T>[]) => {
      nodes.forEach((node) => {
        if (node.hasChildren) {
          allNodeIds.add(node.id)
          collectNodeIds(node.children)
        }
      })
    }

    collectNodeIds(tree)
    setExpandedNodes(allNodeIds)

    const newConfig = {
      ...config,
      hierarchyConfig: {
        ...config.hierarchyConfig,
        expandedNodes: Array.from(allNodeIds),
      },
    }
    setConfig(newConfig)
    onConfigChange?.(newConfig)
  }, [tree, config, onConfigChange])

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set())

    const newConfig = {
      ...config,
      hierarchyConfig: {
        ...config.hierarchyConfig,
        expandedNodes: [],
      },
    }
    setConfig(newConfig)
    onConfigChange?.(newConfig)
  }, [config, onConfigChange])

  // Fonctions de drag & drop
  const handleDragStart = useCallback(
    (node: HierarchicalTreeNode<T>) => {
      if (!config.reorderConfig.enableDragDrop) return
      setDraggedItem(node)
    },
    [config.reorderConfig.enableDragDrop]
  )

  const handleDragOver = useCallback(
    (targetId: string, position: 'above' | 'below' | 'inside') => {
      if (!draggedItem || draggedItem.id === targetId) return

      setDragOverItem(targetId)
      setDropPosition(position)
    },
    [draggedItem]
  )

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggedItem || !config.reorderConfig.enableDragDrop) return

      const targetNode = flattenedTree.find((n) => n.id === targetId)
      if (!targetNode) return

      // Créer une copie des données pour modification
      const updatedData = [...data]
      const draggedItemData = updatedData.find((item) => item.id === draggedItem.id)
      const targetItemData = updatedData.find((item) => item.id === targetId)

      if (!draggedItemData) return

      const { parentField, orderField } = config.hierarchyConfig

      // Logique de réorganisation selon la position
      if (dropPosition === 'inside') {
        // Déplacer à l'intérieur du target (devenir enfant)
        if (config.reorderConfig.allowLevelChange) {
          draggedItemData[parentField as keyof T] = targetId as unknown
          draggedItemData[orderField as keyof T] = 1 as unknown // Premier enfant

          // Auto-expand le parent si configuré
          if (config.reorderConfig.autoExpand) {
            setExpandedNodes((prev) => new Set([...prev, targetId]))
          }
        }
      } else {
        // Déplacer au même niveau (above/below)
        if (targetItemData) {
          const targetParentId = targetItemData[parentField as keyof T] as string
          const targetOrder = (targetItemData[orderField as keyof T] as number) || 0

          draggedItemData[parentField as keyof T] = targetParentId as unknown

          // Calculer le nouvel ordre
          if (dropPosition === 'above') {
            draggedItemData[orderField as keyof T] = Math.max(0, targetOrder - 1) as unknown
          } else {
            draggedItemData[orderField as keyof T] = (targetOrder + 1) as unknown
          }
        }
      }

      // Décaler les ordres des autres éléments si nécessaire
      const parentId = draggedItemData[parentField as keyof T] as string
      const newOrder = draggedItemData[orderField as keyof T] as number

      updatedData.forEach((item) => {
        if (item.id !== draggedItem.id && item[parentField as keyof T] === parentId) {
          const itemOrder = (item[orderField as keyof T] as number) || 0
          if (dropPosition === 'below' && itemOrder > newOrder - 1) {
            item[orderField as keyof T] = (itemOrder + 1) as unknown
          } else if (dropPosition === 'above' && itemOrder >= newOrder) {
            item[orderField as keyof T] = (itemOrder + 1) as unknown
          }
        }
      })

      onDataChange?.(updatedData)

      // Cleanup
      setDraggedItem(null)
      setDragOverItem(null)
      setDropPosition('inside')
    },
    [draggedItem, dropPosition, flattenedTree, data, config, onDataChange]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setDragOverItem(null)
    setDropPosition('inside')
  }, [])

  // Fonctions de configuration
  const updateConfig = useCallback(
    (newConfig: Partial<HierarchicalDatatableConfig>) => {
      const updatedConfig = { ...config, ...newConfig }
      setConfig(updatedConfig)
      onConfigChange?.(updatedConfig)
    },
    [config, onConfigChange]
  )

  const updateHierarchyFilters = useCallback(
    (filters: Partial<HierarchyFilters>) => {
      updateConfig({
        hierarchyFilters: { ...config.hierarchyFilters, ...filters },
      })
    },
    [config.hierarchyFilters, updateConfig]
  )

  return {
    // Données
    tree,
    flattenedTree,
    config,

    // États du drag & drop
    draggedItem,
    dragOverItem,
    dropPosition,

    // Fonctions d'expansion
    expandedNodes,
    toggleNodeExpansion,
    expandAll,
    collapseAll,

    // Fonctions de drag & drop
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,

    // Fonctions de configuration
    updateConfig,
    updateHierarchyFilters,

    // Utilitaires
    isNodeExpanded: (nodeId: string) => expandedNodes.has(nodeId),
    getNodeById: (nodeId: string) => flattenedTree.find((n) => n.id === nodeId),
    getNodeLevel: (nodeId: string) => flattenedTree.find((n) => n.id === nodeId)?.level || 0,
    hasChildren: (nodeId: string) =>
      flattenedTree.find((n) => n.id === nodeId)?.hasChildren || false,
  }
}
