'use client'

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clipboard,
  Copy,
  Download,
  Edit,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Network,
  Palette,
  Plus,
  Search,
  Settings,
  Trash2,
  Type,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../primitives/button'
import { Checkbox } from '../../primitives/checkbox'
import { DropdownItem, DropdownPortal, DropdownSeparator } from '../../primitives/dropdown-portal'
import { Input } from '../../primitives/input'
import { SimpleTooltip } from '../../primitives/tooltip'
import { Badge } from '../badge'

// Simple debounce hook for internal use
const useDebouncedValue = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

import { cn } from '../../../lib/utils'
import AdvancedFilters, { type AdvancedFilterGroup } from './AdvancedFilters'
import { type ColorRule, ColorRuleManager } from './ColorRuleManager'
import { ColumnFilterAdvanced } from './ColumnFilterAdvanced'
import { ClipboardUtils } from './clipboard-utils'
import { DataTableEmpty } from './DataTableEmpty'
import { DataTableError } from './DataTableError'
import { DataTableSkeleton } from './DataTableSkeleton'
import { useDragDropColumns } from './drag-drop-utils'
import { ExportDialog } from './ExportDialog'
import { ExportUtils } from './export-utils'
import { FormulaEngine } from './formula-engine'
import { GenericCardEditor } from './GenericCardEditor'
import { InlineEditor } from './InlineEditor'
import { KanbanCardEditor } from './KanbanCardEditor'
import { useKeyboardShortcuts } from './keyboard-shortcuts'
import { RichTextEditor } from './RichTextEditor'
import { RenderUtils } from './render-utils'
import { usePersistedTableSettings } from './settings-manager'
import { TreeGroupingPanel } from './TreeGroupingPanel'
import type {
  ColumnConfig,
  DataTableConfig,
  FilterConfig,
  SelectionState,
  SortConfig,
  TableSettings,
} from './types'
import { useColorRules } from './use-color-rules'
import { useDataViews } from './use-data-views'
import { useRangeSelection } from './use-range-selection'
import { useTreeGrouping } from './use-tree-grouping'
import { ViewSelector } from './ViewSelector'
import { CalendarView } from './views/CalendarView'
import { CardsView } from './views/CardsView'
import { KanbanView } from './views/KanbanView'
import { TimelineView } from './views/TimelineView'

export interface DataTableProps<T = any> extends DataTableConfig<T> {
  loading?: boolean
  error?: string | null
}

export function DataTable<T = any>({
  data,
  columns: initialColumns,
  keyField,
  tableId,
  userId,
  sortable = true,
  searchable = true,
  filterable = true,
  editable = false,
  selectable = false,
  pagination = false,
  actions,
  settings: initialSettings,
  onSettingsChange,
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
  onSelectionChange,
  onPaginationChange,
  className,
  height,
  striped = true,
  bordered = true,
  compact = false,
  loading = false,
  error = null,
}: DataTableProps<T>) {
  // États
  const [columns, setColumns] = useState<ColumnConfig<T>[]>(initialColumns)
  const [draggedColumn, _setDraggedColumn] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([])
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterGroup[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const [selection, setSelection] = useState<SelectionState>({
    selectedRows: new Set(),
    selectAll: false,
  })

  // Sélection de plages Excel
  const rangeSelection = useRangeSelection()
  const [editingCell, setEditingCell] = useState<{
    row: number
    column: string
  } | null>(null)
  const [focusedCell, setFocusedCell] = useState<{ row: number; column: string } | null>(null)
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [clipboardData, setClipboardData] = useState<string[][] | null>(null)
  const [showPastePreview, setShowPastePreview] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [richTextEditor, setRichTextEditor] = useState<{
    row: number
    column: string
    value: string
  } | null>(null)

  // États pour les règles de couleurs
  const [colorRules, setColorRules] = useState<ColorRule[]>([])
  const [showColorRuleManager, setShowColorRuleManager] = useState(false)

  // États pour le regroupement en arbre
  const [showTreeGroupingPanel, setShowTreeGroupingPanel] = useState(false)

  // États pour l'édition Kanban
  const [showKanbanEditor, setShowKanbanEditor] = useState(false)
  const [editingKanbanCard, setEditingKanbanCard] = useState<any>(null)

  // États pour les éditeurs génériques (Cards, Timeline, Calendar)
  const [showGenericEditor, setShowGenericEditor] = useState(false)
  const [editingGenericItem, setEditingGenericItem] = useState<any>(null)
  const [editingViewType, setEditingViewType] = useState<'cards' | 'timeline' | 'calendar'>('cards')

  // Utiliser les paramètres persistés si tableId est fourni
  // Always call the hook, but pass null values when not needed
  const persistedSettings = usePersistedTableSettings(
    tableId || '',
    tableId ? initialColumns : [],
    tableId ? userId : undefined
  )
  const effectivePersistedSettings = tableId ? persistedSettings : null

  const [localSettings, setLocalSettings] = useState<TableSettings>(
    initialSettings || effectivePersistedSettings?.settings || { columns: {} }
  )

  const settings = effectivePersistedSettings?.settings || localSettings

  const setSettings = (newSettings: TableSettings) => {
    if (effectivePersistedSettings) {
      effectivePersistedSettings.setSettings(newSettings)
    } else {
      setLocalSettings(newSettings)
    }
    onSettingsChange?.(newSettings)
  }

  // Refs
  const tableRef = useRef<HTMLTableElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pageSizeDropdownTriggerRef = useRef<HTMLButtonElement>(null)

  // Drag & Drop pour les colonnes
  const {
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDragLeave,
    handleColumnDrop,
    handleColumnDragEnd,
    canMoveColumn,
  } = useDragDropColumns(
    columns,
    settings,
    (newColumns) => {
      setColumns(newColumns)
    },
    (newSettings) => {
      setSettings(newSettings)
      onSettingsChange?.(newSettings)
    }
  )

  // Mémoriser les colonnes ordonnées et filtrées
  const orderedColumns = useMemo(() => {
    return [...columns]
      .filter((col) => {
        // Vérifier d'abord dans settings, puis fallback sur col.visible
        const settingVisible = settings.columns[col.id]?.visible
        if (settingVisible !== undefined) {
          return settingVisible
        }
        return col.visible !== false
      })
      .sort((a, b) => {
        const orderA = settings.columns[a.id]?.order ?? 999
        const orderB = settings.columns[b.id]?.order ?? 999
        return orderA - orderB
      })
  }, [columns, settings])

  // Fonctions utilitaires de filtrage (définies avant processedData)
  const applyFilter = (value: unknown, filter: FilterConfig): boolean => {
    // Nouveau format de filtre depuis ColumnFilterAdvanced
    if (filter.value && typeof filter.value === 'object') {
      const filterValue = filter.value as any as Record<string, unknown>

      // Filtre par valeurs multiples (checkbox)
      if (filterValue.type === 'values' && Array.isArray(filterValue.values)) {
        // Vérifier si le filtre inclut les valeurs vides
        const includesEmpty = filterValue.values.includes('(Vide)')

        // Vérifier si la valeur actuelle est vide
        const isEmpty =
          value == null ||
          (typeof value === 'string' && value.trim() === '') ||
          (typeof value === 'string' &&
            value.includes('<') &&
            value.replace(/<[^>]*>/g, '').trim() === '')

        if (isEmpty && includesEmpty) {
          return true
        }

        if (!isEmpty) {
          // Pour les booléens, convertir la valeur en texte lisible pour la comparaison
          let stringValue = String(value)
          if (typeof value === 'boolean') {
            stringValue = value ? 'Oui' : 'Non'
          } else if (typeof value === 'string' && value.includes('<')) {
            // Pour les richtext, nettoyer les balises HTML pour la comparaison
            stringValue = value.replace(/<[^>]*>/g, '').trim()
          }
          return filterValue.values.includes(stringValue)
        }

        return false
      }

      // Filtre par plage numérique
      if (filterValue.type === 'range') {
        const numValue = Number(value)
        if (Number.isNaN(numValue)) return false

        if (filterValue.min != null && numValue < (filterValue.min as number)) return false
        if (filterValue.max != null && numValue > (filterValue.max as number)) return false
        return true
      }

      // Filtre par plage de dates
      if (filterValue.type === 'dateRange') {
        const dateValue = new Date(value as string | number | Date)
        if (Number.isNaN(dateValue.getTime())) return false

        if (filterValue.start && dateValue < new Date(filterValue.start as string | number | Date))
          return false
        if (filterValue.end && dateValue > new Date(filterValue.end as string | number | Date))
          return false
        return true
      }
    }

    // Ancien format de filtre (compatibilité)
    switch (filter.operator) {
      case 'equals':
        return value === filter.value
      case 'contains':
        return String(value || '')
          .toLowerCase()
          .includes(String(filter.value).toLowerCase())
      case 'startsWith':
        return String(value || '')
          .toLowerCase()
          .startsWith(String(filter.value).toLowerCase())
      case 'endsWith':
        return String(value || '')
          .toLowerCase()
          .endsWith(String(filter.value).toLowerCase())
      case 'gt':
        return Number(value) > Number(filter.value)
      case 'lt':
        return Number(value) < Number(filter.value)
      case 'gte':
        return Number(value) >= Number(filter.value)
      case 'lte':
        return Number(value) <= Number(filter.value)
      default:
        return true
    }
  }

  const applyAdvancedFilter = (value: any, rule: any, _column: ColumnConfig<T>): boolean => {
    switch (rule.operator) {
      case 'equals':
        return value === rule.value
      case 'not_equals':
        return value !== rule.value
      case 'contains':
        return String(value || '')
          .toLowerCase()
          .includes(String(rule.value || '').toLowerCase())
      case 'not_contains':
        return !String(value || '')
          .toLowerCase()
          .includes(String(rule.value || '').toLowerCase())
      case 'starts_with':
        return String(value || '')
          .toLowerCase()
          .startsWith(String(rule.value || '').toLowerCase())
      case 'ends_with':
        return String(value || '')
          .toLowerCase()
          .endsWith(String(rule.value || '').toLowerCase())
      case 'gt':
        return Number(value) > Number(rule.value)
      case 'gte':
        return Number(value) >= Number(rule.value)
      case 'lt':
        return Number(value) < Number(rule.value)
      case 'lte':
        return Number(value) <= Number(rule.value)
      case 'between':
        return Number(value) >= Number(rule.value) && Number(value) <= Number(rule.value2)
      case 'in': {
        const inValues = String(rule.value)
          .split(',')
          .map((v) => v.trim())
        return inValues.includes(String(value))
      }
      case 'not_in': {
        const notInValues = String(rule.value)
          .split(',')
          .map((v) => v.trim())
        return !notInValues.includes(String(value))
      }
      case 'is_empty':
        return value === null || value === undefined || String(value).trim() === ''
      case 'is_not_empty':
        return value !== null && value !== undefined && String(value).trim() !== ''
      default:
        return true
    }
  }

  // Mémoriser les données filtrées et triées
  const processedData = useMemo(() => {
    let result = [...data]

    // Appliquer la recherche (avec debouncing)
    if (debouncedSearchTerm && searchable) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      result = result.filter((row) => {
        return orderedColumns.some((col) => {
          if (col.searchable === false) return false

          // Utiliser getValue si défini, sinon la clé normale
          const value = col.getValue ? col.getValue(row) : (row as any)[col.key]

          if (value === null || value === undefined) return false

          // Recherche dans les différents types de valeurs
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower)
          }

          if (typeof value === 'number') {
            return value.toString().includes(searchLower)
          }

          if (typeof value === 'boolean') {
            const boolText = value ? 'oui true vrai' : 'non false faux'
            return boolText.includes(searchLower)
          }

          if (value instanceof Date) {
            const dateStr = value.toLocaleDateString('fr-FR')
            return dateStr.toLowerCase().includes(searchLower)
          }

          if (Array.isArray(value)) {
            return value.some((v) => String(v).toLowerCase().includes(searchLower))
          }

          // Fallback pour autres types
          return String(value).toLowerCase().includes(searchLower)
        })
      })
    }

    // Appliquer les filtres
    filters.forEach((filter) => {
      result = result.filter((row) => {
        // Trouver la colonne correspondante pour utiliser getValue si défini
        const filterField = filter.field || filter.column
        const column = orderedColumns.find((col) => col.id === filterField)
        const value = column?.getValue
          ? column.getValue(row)
          : column?.key 
            ? (row as any)[column.key]
            : filterField
              ? (row as any)[filterField]
              : undefined
        return applyFilter(value, filter)
      })
    })

    // Appliquer les filtres avancés
    if (advancedFilters.length > 0) {
      result = result.filter((row) => {
        return advancedFilters.every((group) => {
          if (group.rules.length === 0) return true

          const ruleResults = group.rules
            .filter((rule) => rule.enabled)
            .map((rule) => {
              const column = orderedColumns.find((col) => col.id === rule.column)
              if (!column) return false

              const value = column.getValue ? column.getValue(row) : (row as any)[column.key]
              return applyAdvancedFilter(value, rule, column)
            })

          if (ruleResults.length === 0) return true

          return group.logic === 'OR'
            ? ruleResults.some((result) => result)
            : ruleResults.every((result) => result)
        })
      })
    }

    // Appliquer le tri
    sortConfig.forEach((sort) => {
      result.sort((a, b) => {
        // Trouver la colonne correspondante pour utiliser getValue si défini
        const column = orderedColumns.find((col) => col.id === sort.column)

        let aVal: unknown, bVal: unknown
        if (column?.getValue) {
          aVal = column.getValue(a)
          bVal = column.getValue(b)
        } else {
          aVal = (a as any)[column?.key || sort.column]
          bVal = (b as any)[column?.key || sort.column]
        }

        // Gérer les valeurs null/undefined
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return sort.direction === 'desc' ? 1 : -1
        if (bVal == null) return sort.direction === 'desc' ? -1 : 1

        // Pour les chaînes, nettoyer les balises HTML si nécessaire
        if (typeof aVal === 'string' && aVal.includes('<')) {
          aVal = aVal.replace(/<[^>]*>/g, '').trim()
        }
        if (typeof bVal === 'string' && bVal.includes('<')) {
          bVal = bVal.replace(/<[^>]*>/g, '').trim()
        }

        if (aVal === bVal) return 0

        // Logique de tri simple et fiable
        if ((aVal as any) < (bVal as any)) return sort.direction === 'desc' ? 1 : -1
        if ((aVal as any) > (bVal as any)) return sort.direction === 'desc' ? -1 : 1
        return 0
      })
    })

    return result
  }, [
    data,
    orderedColumns,
    debouncedSearchTerm,
    filters,
    advancedFilters,
    sortConfig,
    searchable,
    applyAdvancedFilter,
    applyFilter,
  ])

  // Calculer les valeurs des formules
  const dataWithFormulas = useMemo(() => {
    return processedData.map((row, rowIndex) => {
      const enhancedRow = { ...row }

      // Calculer les colonnes avec formules
      orderedColumns.forEach((col) => {
        if (col.type === 'formula' && col.formula) {
          const context = {
            row: enhancedRow,
            rowIndex,
            data: processedData,
            columns: orderedColumns,
            getValue: (columnId: string, targetRowIndex?: number) => {
              const targetRow =
                targetRowIndex !== undefined ? processedData[targetRowIndex] : enhancedRow
              const targetColumn = orderedColumns.find((c) => c.id === columnId)
              return targetColumn ? (targetRow as any)[targetColumn.key] : null
            },
          }

          const engine = new FormulaEngine(context)
          const result = engine.evaluate(col.formula.expression)
          ;(enhancedRow as any)[col.key] = result
        }
      })

      return enhancedRow
    })
  }, [processedData, orderedColumns])

  // Hook pour les règles de couleurs
  const colorRuleSystem = useColorRules(dataWithFormulas, orderedColumns, colorRules)

  // Hook pour le regroupement en arbre
  const treeGrouping = useTreeGrouping(dataWithFormulas, orderedColumns)

  // Hook pour les vues alternatives
  const dataViews = useDataViews(dataWithFormulas, orderedColumns, String(keyField))

  // État de pagination
  const paginationConfig = typeof pagination === 'object' ? pagination : null
  const [internalCurrentPage, setInternalCurrentPage] = useState(paginationConfig?.page || 1)
  const [internalPageSize, setInternalPageSize] = useState(paginationConfig?.pageSize || 50)
  const pageSize = paginationConfig?.pageSize || internalPageSize
  const pageSizeOptions = paginationConfig?.pageSizeOptions || [10, 25, 50, 100]

  // Utiliser les props si disponibles, sinon l'état interne
  const currentPage = paginationConfig?.page || internalCurrentPage

  // Fonction pour changer de page
  const handlePageChange = useCallback(
    (page: number) => {
      if (paginationConfig?.page !== undefined && onPaginationChange) {
        // Si contrôlé par le parent, notifier le parent
        onPaginationChange({
          page,
          pageSize,
          total: dataWithFormulas.length,
        })
      } else {
        // Sinon utiliser l'état interne
        setInternalCurrentPage(page)
      }
    },
    [paginationConfig?.page, onPaginationChange, pageSize, dataWithFormulas.length]
  )

  // Alias pour compatibilité avec le code existant
  const setCurrentPage = handlePageChange

  // Synchroniser l'état interne avec les props quand elles changent
  useEffect(() => {
    if (paginationConfig?.page !== undefined) {
      setInternalCurrentPage(paginationConfig.page)
    }
    if (paginationConfig?.pageSize !== undefined) {
      setInternalPageSize(paginationConfig.pageSize)
    }
  }, [paginationConfig?.page, paginationConfig?.pageSize])

  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    if (!pagination) return dataWithFormulas

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return dataWithFormulas.slice(startIndex, endIndex)
  }, [dataWithFormulas, pagination, currentPage, pageSize])

  // Calculer les informations de pagination
  const paginationInfo = useMemo(() => {
    if (!pagination) return null

    const totalItems = dataWithFormulas.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (currentPage - 1) * pageSize + 1
    const endIndex = Math.min(currentPage * pageSize, totalItems)

    return {
      currentPage,
      totalPages,
      pageSize,
      totalItems,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }
  }, [dataWithFormulas.length, currentPage, pageSize, pagination])

  // Réinitialiser la page quand les données changent
  useEffect(() => {
    if (pagination && paginationInfo && currentPage > paginationInfo.totalPages) {
      setCurrentPage(1)
    }
  }, [pagination, paginationInfo, currentPage, setCurrentPage])

  // Mémoriser les statistiques pour éviter les recalculs
  const tableStats = useMemo(() => {
    return {
      totalRows: data.length,
      visibleRows: processedData.length,
      selectedRows: selection.selectedRows.size,
      visibleColumns: orderedColumns.length,
      hasFilters:
        debouncedSearchTerm ||
        filters.length > 0 ||
        advancedFilters.some((group) => group.rules.length > 0),
    }
  }, [
    data.length,
    processedData.length,
    selection.selectedRows.size,
    orderedColumns.length,
    debouncedSearchTerm,
    filters.length,
    advancedFilters,
  ])

  // Gestionnaires d'événements
  const handleSort = useCallback(
    (columnId: string, forceDirection?: 'asc' | 'desc' | null) => {
      if (!sortable) return

      setSortConfig((prev) => {
        const existing = prev.find((s) => s.column === columnId)

        // Si forceDirection est null, supprimer le tri
        if (forceDirection === null) {
          return prev.filter((s) => s.column !== columnId)
        }

        // Si une direction est forcée, l'utiliser
        if (forceDirection === 'asc' || forceDirection === 'desc') {
          if (existing) {
            return prev.map((s) =>
              s.column === columnId ? { ...s, direction: forceDirection } : s
            )
          } else {
            return [...prev, { column: columnId, direction: forceDirection }]
          }
        }

        // Si forceDirection est undefined, utiliser la logique de cycle (clics sur en-têtes)
        if (forceDirection === undefined) {
          // Utiliser la logique de cycle normal
          if (existing) {
            if (existing.direction === 'desc') {
              return prev.map((s) =>
                s.column === columnId ? { ...s, direction: 'asc' as const } : s
              )
            } else {
              return prev.filter((s) => s.column !== columnId)
            }
          } else {
            return [...prev, { column: columnId, direction: 'desc' as const }]
          }
        }

        // Cas par défaut
        return prev
      })
    },
    [sortable]
  )

  const handleCellEdit = useCallback(
    (rowIndex: number, columnId: string, newValue: any) => {
      if (!editable) return

      const column = orderedColumns.find((col) => col.id === columnId)
      const row = dataWithFormulas[rowIndex]

      if (column && onCellEdit) {
        onCellEdit(newValue, row, column)
      }

      setEditingCell(null)
    },
    [editable, orderedColumns, dataWithFormulas, onCellEdit]
  )

  const handleExport = useCallback(
    (format: 'xlsx' | 'csv' | 'pdf') => {
      ExportUtils.exportToExcel(dataWithFormulas, orderedColumns, {
        format,
        filename: `export_${new Date().toISOString().split('T')[0]}.${format}`,
        visibleColumnsOnly: true,
      })
    },
    [dataWithFormulas, orderedColumns]
  )

  const handleColumnVisibilityToggle = useCallback(
    (columnId: string) => {
      const newSettings = {
        ...settings,
        columns: {
          ...settings.columns,
          [columnId]: {
            ...settings.columns[columnId],
            visible: !(settings.columns[columnId]?.visible ?? true),
          },
        },
      }
      setSettings(newSettings)
      onSettingsChange?.(newSettings)
    },
    [settings, setSettings, onSettingsChange]
  )

  // Gestionnaires pour copier-coller (définis avant keyboardActions)
  const handleCopySelection = useCallback(async () => {
    if (selection.selectedRows.size === 0) return

    const selectedData = dataWithFormulas.filter((_, index) =>
      selection.selectedRows.has((dataWithFormulas[index] as any)[keyField])
    )

    const clipboardText = ClipboardUtils.dataToClipboard(selectedData, orderedColumns)
    const success = await ClipboardUtils.copyToClipboard(clipboardText)

    if (success) {
    }
  }, [selection, dataWithFormulas, orderedColumns, keyField])

  const handlePaste = useCallback(async (event?: ClipboardEvent) => {
    let clipboardText: string | null = null

    // Si on a un événement paste, l'utiliser (plus fiable)
    if (event) {
      clipboardText = ClipboardUtils.handlePasteEvent(event)
    } else {
      // Sinon essayer de lire le clipboard (peut échouer)
      clipboardText = await ClipboardUtils.readFromClipboard()
    }

    if (!clipboardText) {
      return
    }

    const pastedData = ClipboardUtils.parseClipboardData(clipboardText)
    if (pastedData.length === 0) return

    setClipboardData(pastedData)
    setShowPastePreview(true)
  }, [])

  const handleConfirmPaste = useCallback(
    (hasHeaders: boolean = true) => {
      if (!clipboardData) return

      const validationResult = ClipboardUtils.validatePastedData(
        clipboardData,
        orderedColumns,
        hasHeaders
      )

      if (validationResult.errors.length > 0) {
        return
      }

      setClipboardData(null)
      setShowPastePreview(false)
    },
    [clipboardData, orderedColumns]
  )

  // Gestionnaires pour les raccourcis clavier Excel
  const keyboardActions = useMemo(
    () => ({
      onArrowKey: (direction: 'up' | 'down' | 'left' | 'right', shiftKey: boolean) => {
        if (!focusedCell) return

        const { row: currentRow, column: currentColumn } = focusedCell
        const columnIndex = orderedColumns.findIndex((col) => col.id === currentColumn)

        let newRow = currentRow
        let newColumnIndex = columnIndex

        switch (direction) {
          case 'up':
            newRow = Math.max(0, currentRow - 1)
            break
          case 'down':
            newRow = Math.min(dataWithFormulas.length - 1, currentRow + 1)
            break
          case 'left':
            newColumnIndex = Math.max(0, columnIndex - 1)
            break
          case 'right':
            newColumnIndex = Math.min(orderedColumns.length - 1, columnIndex + 1)
            break
        }

        const newColumn = orderedColumns[newColumnIndex]?.id || currentColumn
        const newPosition = { row: newRow, column: newColumn }

        setFocusedCell(newPosition)

        if (shiftKey) {
          // Étendre la sélection
          rangeSelection.extendSelection(newPosition)
        } else {
          // Commencer nouvelle sélection
          rangeSelection.startSelection(newPosition)
        }
      },

      onSelectAll: () => {
        // En mode pagination, sélectionner toutes les données visibles (dataWithFormulas)
        // ou seulement la page courante selon le comportement souhaité
        const allRowKeys = dataWithFormulas.map((row, index) => (row as any)[keyField] || index)
        setSelection({
          selectedRows: new Set(allRowKeys),
          selectAll: true,
        })
      },

      onCopy: () => {
        if (rangeSelection.selection.ranges.length > 0 || rangeSelection.selection.activeRange) {
          rangeSelection.copyToClipboard(dataWithFormulas, orderedColumns)
        } else {
          handleCopySelection()
        }
      },

      onPaste: () => {},

      onFillDown: () => {
        rangeSelection.fillDown(
          dataWithFormulas,
          orderedColumns.map((col) => ({ id: col.id, key: col.key })),
          handleCellEdit
        )
      },

      onFillRight: () => {
        rangeSelection.fillRight(
          dataWithFormulas,
          orderedColumns.map((col) => ({ id: col.id, key: col.key })),
          handleCellEdit
        )
      },

      onEditCell: (rowIndex: number, columnId: string) => {
        setEditingCell({ row: rowIndex, column: columnId })
      },

      onCancelEdit: () => {
        setEditingCell(null)
      },

      onCreate: () => {
        actions?.create?.()
      },

      onExport: () => {
        handleExport('xlsx')
      },

      onTabNavigation: (forward: boolean) => {
        if (!focusedCell) {
          // Si pas de cellule focalisée, commencer par la première
          const firstCell = { row: 0, column: orderedColumns[0]?.id || '' }
          setFocusedCell(firstCell)
          rangeSelection.startSelection(firstCell)
          return
        }

        const { row: currentRow, column: currentColumn } = focusedCell
        const columnIndex = orderedColumns.findIndex((col) => col.id === currentColumn)

        let newRow = currentRow
        let newColumnIndex = columnIndex

        if (forward) {
          // Tab : colonne suivante
          newColumnIndex++
          if (newColumnIndex >= orderedColumns.length) {
            // Fin de ligne, passer à la ligne suivante, première colonne
            newColumnIndex = 0
            newRow++
            if (newRow >= dataWithFormulas.length) {
              // Fin du tableau, rester sur la dernière cellule
              newRow = dataWithFormulas.length - 1
              newColumnIndex = orderedColumns.length - 1
            }
          }
        } else {
          // Shift+Tab : colonne précédente
          newColumnIndex--
          if (newColumnIndex < 0) {
            // Début de ligne, passer à la ligne précédente, dernière colonne
            newColumnIndex = orderedColumns.length - 1
            newRow--
            if (newRow < 0) {
              // Début du tableau, rester sur la première cellule
              newRow = 0
              newColumnIndex = 0
            }
          }
        }

        const newColumn = orderedColumns[newColumnIndex]?.id || currentColumn
        const newPosition = { row: newRow, column: newColumn }

        setFocusedCell(newPosition)
        rangeSelection.startSelection(newPosition)

        // Si la cellule est éditable, commencer l'édition
        const targetColumn = orderedColumns.find((col) => col.id === newColumn)
        if (editable && targetColumn?.editable) {
          setEditingCell(newPosition)
        }
      },

      onEnterNavigation: () => {
        if (!focusedCell) return

        const { row: currentRow, column: currentColumn } = focusedCell

        // Enter : ligne suivante, même colonne
        let newRow = currentRow + 1
        if (newRow >= dataWithFormulas.length) {
          newRow = 0 // Retour au début
        }

        const newPosition = { row: newRow, column: currentColumn }
        setFocusedCell(newPosition)
        rangeSelection.startSelection(newPosition)

        // Si la cellule est éditable, commencer l'édition
        const targetColumn = orderedColumns.find((col) => col.id === currentColumn)
        if (editable && targetColumn?.editable) {
          setEditingCell(newPosition)
        }
      },
    }),
    [
      focusedCell,
      orderedColumns,
      dataWithFormulas,
      rangeSelection,
      keyField,
      handleCopySelection,
      handleCellEdit,
      actions,
      handleExport,
      editable,
    ]
  )

  // Configurer les raccourcis clavier
  useKeyboardShortcuts({}, keyboardActions, true, tableRef as any)

  // Fonctions pour l'édition Kanban
  const handleKanbanCardEdit = useCallback((card: any) => {
    setEditingKanbanCard(card)
    setShowKanbanEditor(true)
  }, [])

  const handleKanbanCardSave = useCallback(
    (updatedCard: any) => {
      // Mettre à jour les données
      const rowIndex = dataWithFormulas.findIndex(
        (row) => (row as any)[keyField] === (updatedCard.originalData as any)[keyField]
      )

      if (rowIndex !== -1 && actions?.edit) {
        actions.edit(updatedCard.originalData)
      }

      setShowKanbanEditor(false)
      setEditingKanbanCard(null)
    },
    [dataWithFormulas, keyField, actions]
  )

  const handleKanbanEditorClose = useCallback(() => {
    setShowKanbanEditor(false)
    setEditingKanbanCard(null)
  }, [])

  // Fonctions pour l'édition générique (Cards, Timeline, Calendar)
  const handleGenericItemEdit = useCallback(
    (item: any, viewType: 'cards' | 'timeline' | 'calendar') => {
      setEditingGenericItem(item)
      setEditingViewType(viewType)
      setShowGenericEditor(true)
    },
    []
  )

  const handleGenericItemSave = useCallback(
    (updatedItem: any) => {
      // Mettre à jour les données
      const rowIndex = dataWithFormulas.findIndex(
        (row) => (row as any)[keyField] === (updatedItem.originalData as any)[keyField]
      )

      if (rowIndex !== -1 && actions?.edit) {
        actions.edit(updatedItem.originalData)
      }

      setShowGenericEditor(false)
      setEditingGenericItem(null)
    },
    [dataWithFormulas, keyField, actions]
  )

  const handleGenericEditorClose = useCallback(() => {
    setShowGenericEditor(false)
    setEditingGenericItem(null)
  }, [])

  // Gestionnaire d'événements clavier pour les actions de base
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            if (selection.selectedRows.size > 0) {
              e.preventDefault()
              handleCopySelection()
            }
            break
          case 'v':
            // Ne pas intercepter Ctrl+V, laisser le navigateur déclencher l'événement paste
            break
        }
      }
    },
    [selection, handleCopySelection]
  )

  // Rendu d'une cellule
  const renderCell = useCallback(
    (value: any, row: T, column: ColumnConfig<T>, rowIndex: number) => {
      // Utiliser getValue si défini, sinon utiliser la valeur par défaut
      const cellValue = column.getValue ? column.getValue(row) : value

      const isEditing = editingCell?.row === rowIndex && editingCell?.column === column.id

      if (isEditing && editable && column.editable) {
        return (
          <InlineEditor
            value={cellValue}
            row={row}
            column={column}
            onSave={(newValue) => handleCellEdit(rowIndex, column.id, newValue)}
            onCancel={() => setEditingCell(null)}
            autoFocus
            allColumns={orderedColumns}
            sampleData={dataWithFormulas.slice(0, 10)} // Échantillon pour les tests de formules
            onTabNavigation={keyboardActions.onTabNavigation}
            onOpenRichTextEditor={() => {
              if (column.type === 'richtext') {
                setEditingCell(null) // Fermer l'inline editor
                setRichTextEditor({
                  row: rowIndex,
                  column: column.id,
                  value: cellValue || '',
                })
              }
            }}
          />
        )
      }

      if (column.render) {
        const rendered = column.render(cellValue, row, column)
        // S'assurer que le rendu personnalisé est sécurisé pour React
        return RenderUtils.isReactSafe(rendered)
          ? rendered
          : RenderUtils.safeRender(rendered, column as ColumnConfig<Record<string, unknown>>)
      }

      // Formatage par défaut selon le type
      if (column.format) {
        if (column.format.transform) {
          return column.format.transform(value)
        }

        if (typeof value === 'number') {
          let formatted = value.toString()
          if (column.format.decimals !== undefined) {
            formatted = value.toFixed(column.format.decimals)
          }
          if (column.format.prefix) formatted = column.format.prefix + formatted
          if (column.format.suffix) formatted = formatted + column.format.suffix
          return formatted
        }
      }

      if (column.type === 'boolean') {
        return <Checkbox checked={Boolean(value)} disabled />
      }

      if (column.type === 'select' && column.options) {
        const option = column.options.find((opt) => opt.value === value)
        return option ? (
          <Badge variant="outline" style={{ backgroundColor: option.color }}>
            {option.label}
          </Badge>
        ) : (
          String(value || '')
        )
      }

      if (column.type === 'date' || column.type === 'datetime') {
        if (value instanceof Date) {
          return column.type === 'date'
            ? value.toLocaleDateString('fr-FR')
            : value.toLocaleString('fr-FR')
        }
        return String(value || '')
      }

      if (column.type === 'richtext') {
        // Nettoyage HTML basique pour la sécurité
        const sanitizeHtml = (html: string): string => {
          if (!html) return ''
          return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/on\w+\s*=\s*'[^']*'/gi, '')
            .replace(/javascript:/gi, '')
        }

        const sanitizedValue = value
          ? sanitizeHtml(value)
          : '<span class="text-muted-foreground italic">Aucun contenu</span>'

        return (
          <div
            className="group relative max-w-xs overflow-hidden richtext-cell"
            style={{
              maxHeight: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: sanitizedValue }} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const rowIndex = dataWithFormulas.findIndex((r) => r === row)
                setRichTextEditor({
                  row: rowIndex,
                  column: column.id,
                  value: value || '',
                })
              }}
              className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white p-1 rounded shadow-sm border"
              title="Ouvrir l'éditeur de texte riche"
            >
              <Type className="h-3 w-3 text-blue-600" />
            </button>
          </div>
        )
      }

      // Conversion sécurisée pour tous les autres types
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') {
        // Pour les objets complexes, essayer JSON.stringify ou retourner [Object]
        try {
          return JSON.stringify(value)
        } catch {
          return '[Object]'
        }
      }

      // Utiliser le rendu sécurisé par défaut
      return RenderUtils.makeReactSafe(cellValue, column as ColumnConfig<Record<string, unknown>>)
    },
    [
      editingCell,
      editable,
      handleCellEdit,
      dataWithFormulas.findIndex,
      dataWithFormulas.slice,
      keyboardActions.onTabNavigation,
      orderedColumns,
    ]
  )

  // Effet pour focus sur l'input d'édition
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  // Effet pour les raccourcis clavier
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Gestionnaire d'événement paste pour le clipboard
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => {
      // Vérifier si le focus est dans le tableau
      const activeElement = document.activeElement
      const tableElement = tableRef.current

      if (
        tableElement &&
        (tableElement.contains(activeElement) || activeElement === tableElement)
      ) {
        e.preventDefault()
        handlePaste(e)
      }
    }

    document.addEventListener('paste', handlePasteEvent)
    return () => document.removeEventListener('paste', handlePasteEvent)
  }, [handlePaste])

  // Fermer le dropdown de pagination au clic externe
  useEffect(() => {
    if (pageSizeDropdownOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (!target.closest('[data-pagesize-dropdown]')) {
          setPageSizeDropdownOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [pageSizeDropdownOpen])

  // Marquer le composant comme monté pour les portals
  useEffect(() => {
    setMounted(true)
  }, [])

  // Early returns pour les états spéciaux
  if (loading) {
    return <DataTableSkeleton rows={5} columns={orderedColumns.length} className={className} />
  }

  if (error) {
    return <DataTableError error={error} className={className} />
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Styles pour drag & drop, rich text et améliorations esthétiques */}
      <style>{`
        /* Drag & Drop */
        .column-dragging {
          opacity: 0.5;
          cursor: move;
        }
        
        .column-draggable {
          cursor: move;
        }
        
        .column-draggable:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .drag-over {
          border-left: 3px solid #3b82f6;
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        /* Améliorations esthétiques du tableau */
        .datatable-enhanced {
          --grid-color: hsl(var(--border));
          --header-bg: hsl(var(--muted));
          --header-border: hsl(var(--border));
          --row-hover: hsl(var(--accent) / 0.1);
          --row-selected: hsl(var(--primary) / 0.1);
        }
        
        /* Quadrillage vertical léger */
        .datatable-enhanced table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .datatable-enhanced th,
        .datatable-enhanced td {
          border-right: 1px solid var(--grid-color);
          position: relative;
        }
        
        .datatable-enhanced th:last-child,
        .datatable-enhanced td:last-child {
          border-right: none;
        }
        
        /* En-têtes avec fond non transparent */
        .datatable-enhanced thead th {
          background: var(--header-bg) !important;
          border-bottom: 2px solid var(--header-border) !important;
          backdrop-filter: none;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        /* Amélioration des lignes */
        .datatable-enhanced tbody tr {
          transition: background-color 0.15s ease;
          border-bottom: 1px solid var(--grid-color);
        }
        
        .datatable-enhanced tbody tr:hover {
          background-color: var(--row-hover) !important;
        }
        
        .datatable-enhanced tbody tr.selected {
          background-color: var(--row-selected) !important;
        }
        
        /* Amélioration des cellules */
        .datatable-enhanced td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        
        .datatable-enhanced th {
          padding: 16px;
          font-weight: 600;
          color: #374151;
          text-align: left;
        }
        
        /* Styles pour les liens dans les cellules rich text */
        .richtext-cell a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          transition: all 0.15s ease;
          font-weight: 500;
          padding: 1px 2px;
          border-radius: 2px;
          display: inline;
        }
        
        .richtext-cell a:hover {
          color: #1d4ed8;
          background-color: #dbeafe;
          text-decoration: none;
          transform: translateY(-0.5px);
        }
        
        .richtext-cell a::after {
          content: "↗";
          font-size: 0.6em;
          margin-left: 1px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        
        .richtext-cell a:hover::after {
          opacity: 0.7;
        }
        
        .column-locked {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>

      {/* Barre d'outils */}
      <div className="flex items-center justify-between mb-3 gap-2 datatable-toolbar">
        <div className="flex items-center gap-1.5">
          {/* Recherche */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className={cn(
                  'pl-9 w-64 transition-all duration-200',
                  searchTerm !== debouncedSearchTerm && 'pr-10'
                )}
              />
              {/* Indicateur de recherche en cours */}
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {actions?.create && (
            <SimpleTooltip content="Ajouter un élément" triggerAsChild>
              <Button onClick={actions.create} size="sm" className="h-7 w-7 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </SimpleTooltip>
          )}

          {/* Bouton éditeur rich text */}
          {focusedCell &&
            (() => {
              const column = orderedColumns.find((c) => c.id === focusedCell.column)
              if (column?.type === 'richtext' && editable && column.editable) {
                return (
                  <SimpleTooltip content="Ouvrir l'éditeur Rich Text" triggerAsChild>
                    <Button
                      onClick={() => {
                        const row = dataWithFormulas[focusedCell.row]
                        const cellValue = column.getValue
                          ? column.getValue(row)
                          : (row as any)[column.key]
                        setRichTextEditor({
                          row: focusedCell.row,
                          column: focusedCell.column,
                          value: cellValue || '',
                        })
                      }}
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                    >
                      <Type className="h-3 w-3" />
                    </Button>
                  </SimpleTooltip>
                )
              }
              return null
            })()}

          {selection.selectedRows.size > 0 && (
            <>
              <SimpleTooltip
                content={`Copier ${selection.selectedRows.size} élément(s) sélectionné(s)`}
                triggerAsChild
              >
                <Button
                  onClick={handleCopySelection}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </SimpleTooltip>

              {actions?.delete && (
                <SimpleTooltip
                  content={`Supprimer ${selection.selectedRows.size} élément(s) sélectionné(s)`}
                  triggerAsChild
                >
                  <Button
                    onClick={() => {
                      const selectedData = dataWithFormulas.filter((_, index) =>
                        selection.selectedRows.has((dataWithFormulas[index] as any)[keyField])
                      )
                      actions.delete?.(selectedData)
                    }}
                    variant="destructive"
                    size="sm"
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </SimpleTooltip>
              )}
            </>
          )}

          {editable && (
            <SimpleTooltip content="Coller depuis le presse-papiers" triggerAsChild>
              <Button
                onClick={() => handlePaste()}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
              >
                <Clipboard className="h-3 w-3" />
              </Button>
            </SimpleTooltip>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Règles de couleurs */}
          <SimpleTooltip
            content={`Gestion des règles de couleurs ${colorRuleSystem.activeRules > 0 ? `(${colorRuleSystem.activeRules} actives)` : ''}`}
            triggerAsChild
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorRuleManager(true)}
              className="h-7 w-7 p-0 relative"
            >
              <Palette className="h-3 w-3" />
              {colorRuleSystem.activeRules > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {colorRuleSystem.activeRules}
                </span>
              )}
            </Button>
          </SimpleTooltip>

          <SimpleTooltip
            content={`Groupement en arbre ${treeGrouping.isGrouped ? `(${treeGrouping.groupingColumns.length} colonnes groupées)` : ''}`}
            triggerAsChild
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTreeGroupingPanel(true)}
              className="h-7 w-7 p-0 relative"
            >
              <Network className="h-3 w-3" />
              {treeGrouping.isGrouped && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {treeGrouping.groupingColumns.length}
                </span>
              )}
            </Button>
          </SimpleTooltip>

          {/* Sélecteur de vues */}
          <ViewSelector
            currentView={dataViews.currentView}
            onViewChange={dataViews.setCurrentView}
            availableViews={dataViews.getAvailableViews()}
            columns={orderedColumns}
            viewConfigs={dataViews.viewConfigs}
            onViewConfigUpdate={dataViews.updateViewConfig}
          />

          {/* Export */}
          <DropdownPortal
            align="end"
            trigger={
              <SimpleTooltip content="Options d'export" triggerAsChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                  <Download className="h-3 w-3" />
                </Button>
              </SimpleTooltip>
            }
          >
            <DropdownItem onClick={() => handleExport('xlsx')}>Export rapide Excel</DropdownItem>
            <DropdownItem onClick={() => handleExport('csv')}>Export rapide CSV</DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export avancé...
            </DropdownItem>
          </DropdownPortal>

          {/* Paramètres des colonnes */}
          <DropdownPortal
            align="end"
            className="min-w-[200px] max-h-[400px] overflow-y-auto"
            trigger={
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Colonnes
              </Button>
            }
          >
            {columns.map((column) => {
              // Déterminer si la colonne est visible (même logique que orderedColumns)
              const settingVisible = settings.columns[column.id]?.visible
              const isVisible =
                settingVisible !== undefined ? settingVisible : column.visible !== false

              return (
                <DropdownItem
                  key={column.id}
                  onClick={() => handleColumnVisibilityToggle(column.id)}
                  className={
                    isVisible
                      ? 'text-foreground font-medium hover:bg-accent/50 hover:text-accent-foreground'
                      : 'text-muted-foreground font-medium hover:bg-muted hover:text-foreground'
                  }
                >
                  {isVisible ? (
                    <Eye className="h-4 w-4 mr-2 text-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-2 text-muted-foreground" />
                  )}
                  <span className="flex-1">{column.title}</span>
                  {isVisible && <div className="ml-2 w-2 h-2 bg-foreground rounded-full" />}
                </DropdownItem>
              )
            })}

            {persistedSettings && (
              <>
                <DropdownSeparator />
                <DropdownItem
                  onClick={() => persistedSettings.resetSettings()}
                  className="text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                >
                  <span className="text-sm">Réinitialiser</span>
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const exported = persistedSettings.exportSettings()
                    const blob = new Blob([JSON.stringify(exported, null, 2)], {
                      type: 'application/json',
                    })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `datatable-settings-${tableId || 'export'}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                >
                  <span className="text-sm">Exporter paramètres</span>
                </DropdownItem>
              </>
            )}
          </DropdownPortal>

          {/* Filtres avancés */}
          <AdvancedFilters
            columns={orderedColumns}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
          />
        </div>
      </div>

      {/* Contenu principal - Vue conditionnelle */}
      <div className="relative border rounded-lg datatable-enhanced-container" style={{ height }}>
        <div className="overflow-auto h-full datatable-content">
          {dataViews.currentView === 'table' ? (
            // Vue tableau traditionnelle
            <table
              ref={tableRef}
              className={cn(
                'w-full datatable-enhanced',
                striped && 'table-striped',
                bordered && 'table-bordered',
                compact && 'table-compact'
              )}
            >
              <thead className="sticky top-0 datatable-header">
                <tr>
                  {selectable && (
                    <th className="w-12 p-2 bg-muted">
                      <Checkbox
                        checked={selection.selectAll}
                        onCheckedChange={(checked: any) => {
                          const newSelection = {
                            selectedRows: checked
                              ? new Set(dataWithFormulas.map((row) => (row as any)[keyField]))
                              : new Set(),
                            selectAll: !!checked,
                          }
                          setSelection(newSelection)
                          onSelectionChange?.(newSelection)
                        }}
                      />
                    </th>
                  )}

                  {orderedColumns.map((column, columnIndex) => (
                    <th
                      key={column.id}
                      className={cn(
                        'group p-2 text-left font-medium text-muted-foreground relative bg-muted',
                        column.sortable && sortable && 'cursor-pointer hover:bg-muted/80',
                        'select-none',
                        canMoveColumn(column) && 'cursor-move',
                        column.locked && 'opacity-60'
                      )}
                      style={{
                        width: settings.columns[column.id]?.width || column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                      }}
                      draggable={canMoveColumn(column)}
                      onDragStart={handleColumnDragStart(column.id, columnIndex)}
                      onDragOver={handleColumnDragOver}
                      onDragLeave={handleColumnDragLeave}
                      onDrop={handleColumnDrop(column.id, columnIndex)}
                      onDragEnd={handleColumnDragEnd}
                      onClick={() => column.sortable && !draggedColumn && handleSort(column.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {canMoveColumn(column) && (
                            <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                          )}
                          <SimpleTooltip
                            content={
                              <div className="text-center">
                                <div className="font-medium">{column.title}</div>
                                {column.description && (
                                  <div className="text-xs opacity-80 mt-1">
                                    {column.description}
                                  </div>
                                )}
                                <div className="text-xs opacity-60 mt-1">
                                  {column.sortable && 'Triable • '}
                                  {column.searchable && 'Recherchable • '}
                                  {column.editable && 'Éditable • '}
                                  Type: {column.type}
                                </div>
                              </div>
                            }
                            side="bottom"
                            delayDuration={700}
                          >
                            <span className="cursor-help">{column.title}</span>
                          </SimpleTooltip>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Filtre rapide de colonne */}
                          <ColumnFilterAdvanced
                            column={column as any}
                            data={dataWithFormulas}
                            currentSort={
                              sortConfig.find((s) => s.column === column.id)?.direction || null
                            }
                            currentFilters={filters.find((f) => (f.field || f.column) === column.id)?.value}
                            onSort={(direction) => handleSort(column.id, direction)}
                            onFilter={(filter) => {
                              if (filter) {
                                setFilters((prev) => [
                                  ...prev.filter((f) => (f.field || f.column) !== column.id),
                                  { field: column.id, value: filter, operator: 'equals' as const },
                                ])
                              } else {
                                setFilters((prev) => prev.filter((f) => (f.field || f.column) !== column.id))
                              }
                            }}
                          />

                          {/* Indicateur de tri */}
                          {column.sortable && sortable && (
                            <div className="ml-1">
                              {sortConfig.find((s) => s.column === column.id)?.direction ===
                                'asc' && <ChevronUp className="h-4 w-4" />}
                              {sortConfig.find((s) => s.column === column.id)?.direction ===
                                'desc' && <ChevronDown className="h-4 w-4" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}

                  {actions && <th className="w-20 p-2 bg-muted">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {(treeGrouping.isGrouped ? treeGrouping.tree.flatList : paginatedData).map(
                  (item, itemIndex) => {
                    // Si c'est un nœud de groupe
                    if (treeGrouping.isGroupNode(item)) {
                      const groupNode = item
                      return (
                        <tr
                          key={groupNode.id}
                          className="bg-muted/20 font-medium border-t-2 border-muted"
                        >
                          <td
                            colSpan={
                              orderedColumns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                            }
                            className="p-3"
                          >
                            <button
                              type="button"
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded p-1 w-full text-left"
                              onClick={() => treeGrouping.toggleNodeExpansion(groupNode.id)}
                              style={{ paddingLeft: `${groupNode.level * 20}px` }}
                            >
                              {groupNode.isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {groupNode.column.title}
                              </Badge>
                              <span>{groupNode.groupLabel}</span>
                              <Badge variant="secondary" className="text-xs ml-auto">
                                {groupNode.items.length +
                                  groupNode.children.reduce(
                                    (sum, child) => sum + child.items.length,
                                    0
                                  )}{' '}
                                éléments
                              </Badge>
                            </button>
                          </td>
                        </tr>
                      )
                    }

                    // Si c'est un élément de données normal
                    const row = item as T
                    const originalRowIndex = dataWithFormulas.findIndex((r) => r === row)
                    const rowIndex = treeGrouping.isGrouped ? originalRowIndex : itemIndex

                    return (
                      <tr
                        key={(row as any)[keyField] || rowIndex}
                        className={cn(
                          'hover:bg-muted/50 cursor-pointer',
                          selection.selectedRows.has((row as any)[keyField]) && 'bg-primary/10',
                          // Highlight des plages sélectionnées Excel
                          rangeSelection.selection.ranges.some((_range) =>
                            rangeSelection.isCellInActiveRange(
                              rowIndex,
                              orderedColumns[0]?.id || '',
                              orderedColumns.map((c) => c.id)
                            )
                          ) && 'bg-blue-100/50',
                          rangeSelection.selection.activeRange &&
                            rangeSelection.isCellInActiveRange(
                              rowIndex,
                              orderedColumns[0]?.id || '',
                              orderedColumns.map((c) => c.id)
                            ) &&
                            'bg-blue-200/50'
                        )}
                        onClick={() => {
                          onRowClick?.(row)
                          setFocusedCell({ row: rowIndex, column: orderedColumns[0]?.id || '' })
                        }}
                        onDoubleClick={() => onRowDoubleClick?.(row)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onRowClick?.(row)
                            setFocusedCell({ row: rowIndex, column: orderedColumns[0]?.id || '' })
                          }
                        }}
                        aria-label={`Select row ${rowIndex + 1}`}
                      >
                        {selectable && (
                          <td
                            className="p-2"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                              }
                            }}
                          >
                            <Checkbox
                              checked={selection.selectedRows.has((row as any)[keyField])}
                              onCheckedChange={(checked: any) => {
                                const newSelected = new Set(selection.selectedRows)
                                if (checked) {
                                  newSelected.add((row as any)[keyField])
                                } else {
                                  newSelected.delete((row as any)[keyField])
                                }

                                const newSelection = {
                                  selectedRows: newSelected,
                                  selectAll: newSelected.size === dataWithFormulas.length,
                                }
                                setSelection(newSelection)
                                onSelectionChange?.(newSelection)
                              }}
                            />
                          </td>
                        )}

                        {orderedColumns.map((column, _columnIndex) => (
                          // biome-ignore lint/a11y/noNoninteractiveTabindex: This td is highly interactive with click and keyboard handlers
                          <td
                            key={column.id}
                            className={cn(
                              'p-2 border-t relative',
                              editable && column.editable && 'cursor-text',
                              // Styles pour sélection Excel
                              rangeSelection.isCellSelected(
                                rowIndex,
                                column.id,
                                orderedColumns.map((c) => c.id)
                              ) && 'bg-blue-100',
                              rangeSelection.isCellInActiveRange(
                                rowIndex,
                                column.id,
                                orderedColumns.map((c) => c.id)
                              ) && 'bg-blue-200/70',
                              focusedCell?.row === rowIndex &&
                                focusedCell?.column === column.id &&
                                'ring-2 ring-blue-500'
                            )}
                            style={{
                              ...(colorRuleSystem.getCellStyle(originalRowIndex, column.id) && {
                                backgroundColor: colorRuleSystem.getCellStyle(
                                  originalRowIndex,
                                  column.id
                                )?.backgroundColor,
                                color: colorRuleSystem.getCellStyle(originalRowIndex, column.id)
                                  ?.color,
                              }),
                            }}
                            onClick={(e) => {
                              e.stopPropagation()

                              const cellPosition = { row: rowIndex, column: column.id }
                              setFocusedCell(cellPosition)

                              if (e.shiftKey) {
                                rangeSelection.extendSelection(cellPosition)
                              } else if (e.ctrlKey || e.metaKey) {
                                rangeSelection.startSelection(cellPosition, true)
                              } else {
                                rangeSelection.startSelection(cellPosition)
                              }

                              if (
                                editable &&
                                column.editable &&
                                !e.shiftKey &&
                                !e.ctrlKey &&
                                !e.metaKey
                              ) {
                                setEditingCell({ row: rowIndex, column: column.id })
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                const cellPosition = { row: rowIndex, column: column.id }
                                setFocusedCell(cellPosition)
                                rangeSelection.startSelection(cellPosition)

                                if (editable && column.editable && e.key === 'Enter') {
                                  setEditingCell({ row: rowIndex, column: column.id })
                                }
                              }
                            }}
                            tabIndex={0}
                            onMouseDown={(e) => {
                              const cellPosition = { row: rowIndex, column: column.id }
                              if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                                rangeSelection.startSelection(cellPosition)
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (e.buttons === 1) {
                                // Si le bouton gauche est pressé
                                rangeSelection.extendSelection({ row: rowIndex, column: column.id })
                              }
                            }}
                            onMouseUp={() => {
                              rangeSelection.endSelection()
                            }}
                          >
                            {renderCell(
                              column.getValue ? column.getValue(row) : (row as any)[column.key],
                              row,
                              column,
                              rowIndex
                            )}
                          </td>
                        ))}

                        {actions && (
                          <td
                            className="p-2 border-t"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                              }
                            }}
                          >
                            <DropdownPortal
                              align="end"
                              side="bottom"
                              trigger={
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-1">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              }
                            >
                              {actions.edit && (
                                <DropdownItem onClick={() => actions.edit?.(row)}>
                                  <Edit className="h-3 w-3 mr-2" />
                                  Modifier
                                </DropdownItem>
                              )}
                              {actions.delete && (
                                <DropdownItem
                                  onClick={() => actions.delete?.([row])}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Supprimer
                                </DropdownItem>
                              )}
                            </DropdownPortal>
                          </td>
                        )}
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>
          ) : dataViews.currentView === 'kanban' ? (
            // Vue Kanban
            <div className="p-4">
              <KanbanView
                columns={dataViews.kanbanData}
                onCardClick={(card) => onRowClick?.(card.originalData)}
                onCardEdit={handleKanbanCardEdit}
                onCardDelete={(card) => actions?.delete?.([card.originalData])}
                onAddCard={actions?.create}
              />
            </div>
          ) : dataViews.currentView === 'cards' ? (
            // Vue Cartes
            <div className="p-4">
              <CardsView
                cards={dataViews.cardsData}
                cardsPerRow={dataViews.viewConfigs.cards.settings.cards?.cardsPerRow || 3}
                onCardClick={(card) => onRowClick?.(card.originalData)}
                onCardEdit={(card) => handleGenericItemEdit(card, 'cards')}
                onCardDelete={(card) => actions?.delete?.([card.originalData])}
              />
            </div>
          ) : dataViews.currentView === 'timeline' ? (
            // Vue Timeline
            <div className="p-4">
              <TimelineView
                items={dataViews.timelineData}
                onItemClick={(item) => onRowClick?.(item.originalData)}
                onItemEdit={(item) => handleGenericItemEdit(item, 'timeline')}
                onItemDelete={(item) => actions?.delete?.([item.originalData])}
              />
            </div>
          ) : dataViews.currentView === 'calendar' ? (
            // Vue Calendar
            <div className="p-4">
              <CalendarView
                events={dataViews.calendarData}
                onEventClick={(event) => onRowClick?.(event.originalData)}
                onEventEdit={(event) => handleGenericItemEdit(event, 'calendar')}
                onEventDelete={(event) => actions?.delete?.([event.originalData])}
              />
            </div>
          ) : null}

          {dataWithFormulas.length === 0 && dataViews.currentView === 'table' && (
            <DataTableEmpty
              searchTerm={debouncedSearchTerm}
              onClearSearch={() => setSearchTerm('')}
              action={
                actions?.create
                  ? {
                      label: 'Ajouter un élément',
                      onClick: actions.create,
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Statistiques et Pagination */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {tableStats.hasFilters && tableStats.visibleRows !== tableStats.totalRows
              ? `${tableStats.visibleRows} sur ${tableStats.totalRows} résultats`
              : `${tableStats.totalRows} résultats`}
          </span>
          {tableStats.selectedRows > 0 && (
            <span className="text-primary font-medium">
              {tableStats.selectedRows} sélectionné{tableStats.selectedRows > 1 ? 's' : ''}
            </span>
          )}
          {tableStats.hasFilters && (
            <span className="text-blue-600">
              Filtré{debouncedSearchTerm && ` • Recherche: "${debouncedSearchTerm}"`}
            </span>
          )}
        </div>

        {pagination && paginationInfo && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {paginationInfo.startIndex}-{paginationInfo.endIndex} sur{' '}
                {paginationInfo.totalItems}
              </span>
              <div data-pagesize-dropdown className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Lignes:</span>
                <div className="relative">
                  <button
                    ref={pageSizeDropdownTriggerRef}
                    type="button"
                    onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                    className="flex items-center justify-between whitespace-nowrap rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-14 h-6"
                  >
                    <span className="block truncate text-left">
                      {paginationConfig?.pageSize || internalPageSize}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={!paginationInfo.hasPrevPage}
                className="h-6 px-2 text-xs"
              >
                Premier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!paginationInfo.hasPrevPage}
                className="h-6 px-2 text-xs"
              >
                Préc.
              </Button>

              <div className="flex items-center gap-1">
                <span className="text-xs">Page</span>
                <Input
                  type="number"
                  min="1"
                  max={paginationInfo.totalPages}
                  value={currentPage}
                  onChange={(e: any) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= paginationInfo.totalPages) {
                      setCurrentPage(page)
                    }
                  }}
                  className="w-12 h-6 text-center text-xs"
                />
                <span className="text-xs">sur {paginationInfo.totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!paginationInfo.hasNextPage}
                className="h-6 px-2 text-xs"
              >
                Suiv.
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(paginationInfo.totalPages)}
                disabled={!paginationInfo.hasNextPage}
                className="h-6 px-2 text-xs"
              >
                Dernier
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de prévisualisation du collage */}
      {showPastePreview && clipboardData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Prévisualisation du collage</h3>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked={true}
                  onChange={(_e: any) => {
                    // Mettre à jour la prévisualisation selon le statut des en-têtes
                  }}
                />
                La première ligne contient les en-têtes
              </label>
            </div>

            <div className="border rounded max-h-64 overflow-auto mb-4">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    {clipboardData[0]?.map((header, index) => (
                      <th key={`header-${header}-${index}`} className="p-2 text-left border-b">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clipboardData.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setClipboardData(null)
                  setShowPastePreview(false)
                }}
              >
                Annuler
              </Button>
              <Button onClick={() => handleConfirmPaste(true)}>Confirmer le collage</Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue d'export avancé */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        data={dataWithFormulas}
        columns={orderedColumns}
        filename={tableId || 'export'}
      />

      {/* Éditeur de texte riche */}
      {richTextEditor && (
        <RichTextEditor
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setRichTextEditor(null)
            }
          }}
          initialContent={richTextEditor.value}
          onSave={(content) => {
            // Sauvegarder le contenu
            handleCellEdit(richTextEditor.row, richTextEditor.column, content)
            setRichTextEditor(null)
          }}
          placeholder="Éditer le texte..."
        />
      )}

      {/* Gestionnaire de règles de couleurs */}
      <ColorRuleManager
        open={showColorRuleManager}
        onOpenChange={setShowColorRuleManager}
        columns={orderedColumns}
        rules={colorRules}
        onRulesChange={setColorRules}
      />

      {/* Panneau de regroupement en arbre */}
      <TreeGroupingPanel
        open={showTreeGroupingPanel}
        onOpenChange={setShowTreeGroupingPanel}
        columns={orderedColumns}
        config={treeGrouping.config}
        onConfigChange={() => {}} // Géré par les fonctions individuelles
        onAddColumn={treeGrouping.addGroupingColumn}
        onRemoveColumn={treeGrouping.removeGroupingColumn}
        onReorderColumns={treeGrouping.reorderGroupingColumns}
        onExpandAll={treeGrouping.expandAll}
        onCollapseAll={treeGrouping.collapseAll}
        onClearGrouping={treeGrouping.clearGrouping}
      />

      {/* Éditeur de cartes Kanban */}
      <KanbanCardEditor
        card={editingKanbanCard}
        isOpen={showKanbanEditor}
        onClose={handleKanbanEditorClose}
        onSave={handleKanbanCardSave}
        columns={dataViews.kanbanData}
        tableColumns={orderedColumns as ColumnConfig<Record<string, unknown>>[]}
        kanbanSettings={dataViews.viewConfigs.kanban.settings.kanban || {}}
        keyField={String(keyField)}
      />

      {/* Éditeur générique pour Cards, Timeline, Calendar */}
      <GenericCardEditor
        item={editingGenericItem}
        isOpen={showGenericEditor}
        onClose={handleGenericEditorClose}
        onSave={handleGenericItemSave}
        tableColumns={orderedColumns as ColumnConfig<Record<string, unknown>>[]}
        keyField={String(keyField)}
        title={
          editingViewType === 'cards'
            ? 'Modifier la carte'
            : editingViewType === 'timeline'
              ? "Modifier l'événement"
              : "Modifier l'événement calendrier"
        }
        viewType={editingViewType}
      />

      {/* PageSize Dropdown Portal */}
      {pageSizeDropdownOpen &&
        mounted &&
        pageSizeDropdownTriggerRef.current &&
        (() => {
          const triggerRect = pageSizeDropdownTriggerRef.current?.getBoundingClientRect()
          const dropdownHeight = Math.min(pageSizeOptions.length * 40 + 8, 240) // 40px par option + padding, max 240px
          const viewportHeight = window.innerHeight
          const spaceBelow = viewportHeight - triggerRect.bottom
          const spaceAbove = triggerRect.top

          // Déterminer si on affiche en dessous ou au-dessus
          const showAbove = spaceBelow < dropdownHeight + 10 && spaceAbove > spaceBelow

          const style: React.CSSProperties = {
            left: triggerRect.left,
            width: Math.max(triggerRect.width, 64),
            maxHeight: showAbove ? Math.min(240, spaceAbove - 10) : Math.min(240, spaceBelow - 10),
          }

          if (showAbove) {
            style.bottom = viewportHeight - triggerRect.top + 4
          } else {
            style.top = triggerRect.bottom + 4
          }

          return createPortal(
            <div
              data-pagesize-dropdown
              className="fixed z-[99999] bg-background border border-border rounded-md shadow-xl overflow-auto min-w-[64px]"
              style={style}
            >
              {pageSizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()

                    const newPageSize = size
                    // Recalculer la page courante pour maintenir la position approximative
                    const currentFirstItem = (currentPage - 1) * pageSize + 1
                    const newPage = Math.ceil(currentFirstItem / newPageSize)

                    // Toujours notifier le parent du changement de pagination
                    onPaginationChange?.({
                      page: newPage,
                      pageSize: newPageSize,
                      total: paginationInfo?.totalItems || 0,
                    })

                    // Si pas de contrôle parent, mettre à jour l'état interne
                    if (!paginationConfig?.page) {
                      setInternalCurrentPage(newPage)
                    }

                    // Toujours mettre à jour la taille de page interne
                    setInternalPageSize(newPageSize)

                    setPageSizeDropdownOpen(false)
                  }}
                  className="flex w-full items-center px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  <Check
                    className={`mr-1.5 h-3 w-3 ${(paginationConfig?.pageSize || internalPageSize) === size ? 'opacity-100' : 'opacity-0'}`}
                  />
                  {size}
                </button>
              ))}
            </div>,
            document.body
          )
        })()}
    </div>
  )
}

export default DataTable
