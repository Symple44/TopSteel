import { type NextRequest, NextResponse } from 'next/server'
import { verifyAuthHelper } from '@/lib/auth-helper'

// Types pour les préférences hiérarchiques
interface HierarchicalConfig {
  parentField: string
  childrenField: string
  levelField: string
  orderField: string
  maxDepth: number
  allowNesting: boolean
  defaultExpanded: boolean
  expandedNodes: string[]
}

interface ReorderConfig {
  enableDragDrop: boolean
  allowLevelChange: boolean
  preserveHierarchy: boolean
  autoExpand: boolean
  dragHandleVisible: boolean
  dropIndicatorStyle: 'line' | 'highlight'
}

interface DisplayConfig {
  showLevelIndicators: boolean
  showConnectionLines: boolean
  indentSize: number
  levelColors: string[]
  compactMode: boolean
  collapsibleGroups: boolean
}

interface HierarchyFilters {
  showOnlyLevels: number[]
  hideEmptyParents: boolean
  filterPreservesHierarchy: boolean
  searchInChildren: boolean
}

interface HierarchicalDatatableConfig {
  hierarchyConfig: HierarchicalConfig
  reorderConfig: ReorderConfig
  displayConfig: DisplayConfig
  hierarchyFilters: HierarchyFilters
}

// Configuration par défaut
const defaultConfig: HierarchicalDatatableConfig = {
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

// GET - Récupérer les préférences hiérarchiques pour une table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId } = await params

    // Simuler la récupération depuis la base de données
    // En production, remplacer par une vraie requête DB
    const mockPreferences = {
      id: `pref-mock-user-${tableId}`,
      user_id: 'mock-user',
      table_id: tableId,
      ...defaultConfig,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse?.json(mockPreferences)
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour les préférences hiérarchiques
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId } = await params
    const updates = (await request?.json()) as Partial<HierarchicalDatatableConfig>

    // Valider les données
    if (!updates || typeof updates !== 'object') {
      return NextResponse?.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Simuler la mise à jour en base de données
    // En production, remplacer par une vraie requête DB
    const updatedPreferences = {
      id: `pref-mock-user-${tableId}`,
      user_id: 'mock-user',
      table_id: tableId,
      ...defaultConfig,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    return NextResponse?.json(updatedPreferences)
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer de nouvelles préférences hiérarchiques
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId } = await params
    const config = (await request?.json()) as HierarchicalDatatableConfig

    // Simuler la création en base de données
    // En production, remplacer par une vraie requête DB
    const newPreferences = {
      id: `pref-mock-user-${tableId}-${Date.now()}`,
      user_id: 'mock-user',
      table_id: tableId,
      ...config,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse?.json(newPreferences, { status: 201 })
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer les préférences hiérarchiques
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const auth = await verifyAuthHelper(request)
    if (!auth?.isValid) {
      return NextResponse?.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { tableId: _tableId } = await params

    return NextResponse?.json({ success: true })
  } catch (_error) {
    return NextResponse?.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
