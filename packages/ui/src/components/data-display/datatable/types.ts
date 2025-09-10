import type React from 'react'
import type { ReactNode } from 'react'

// Types de données supportés
export type DataValue = string | number | boolean | Date | null | undefined

// Types de colonnes
export type ColumnType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'richtext'
  | 'custom'
  | 'formula'

// Type de base pour les données du tableau
export type DataRecord = Record<string, unknown>

// Configuration d'une colonne
export interface ColumnConfig<T = DataRecord> {
  id: string
  key: string
  title: string
  description?: string // Description pour les tooltips
  type: ColumnType
  width?: number
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  sortable?: boolean
  searchable?: boolean
  editable?: boolean
  required?: boolean
  visible?: boolean
  locked?: boolean // Colonne non déplaçable

  // Validation
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: unknown) => string | null
    required?: boolean
    minLength?: number
    maxLength?: number
  }

  // Options pour select/multiselect
  options?: Array<{
    value: DataValue
    label: string
    color?: string
  }>

  // Formatage
  format?: {
    decimals?: number
    currency?: string
    dateFormat?: string
    prefix?: string
    suffix?: string
    transform?: (value: unknown) => string
  }

  // Formule (pour colonnes calculées)
  formula?: {
    expression: string // Ex: "=A1+B1", "=SUM(A:A)", "=IF(A1>0,B1,C1)"
    dependencies: string[] // Colonnes dont dépend cette formule
  }

  // Rendu personnalisé
  render?: (value: unknown, row: T, column: ColumnConfig<T>) => ReactNode

  // Fonction pour obtenir la valeur personnalisée (utile pour des propriétés imbriquées)
  getValue?: (row: T) => unknown

  // Alias pour getValue (compatibilité)
  accessor?: ((row: T) => unknown) | string

  // Actions
  onEdit?: (value: unknown, row: T, column: ColumnConfig<T>) => void
  onValidate?: (value: unknown, row: T, column: ColumnConfig<T>) => string | null
}

// Configuration du tri
export interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

// Configuration des filtres
export interface FilterConfig {
  field: string // Identifiant de la colonne à filtrer
  value: DataValue | Record<string, unknown> // Valeur du filtre (peut être complexe)
  operator?: // Opérateur de comparaison (optionnel pour les filtres complexes)
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'startsWith'
    | 'starts_with'
    | 'endsWith'
    | 'ends_with'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'between'
    | 'in'
    | 'notIn'
    | 'not_in'
    | 'is_empty'
    | 'is_not_empty'
  column?: string // Alias pour field (compatibilité)
}

// Opérateurs de filtrage avancé
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in'
  | 'between'

// Règle de filtrage avancé
export interface AdvancedFilterRule {
  id: string
  field: string // Identifiant de la colonne
  column?: string // Alias pour field (compatibilité)
  operator: FilterOperator
  value: unknown
  value2?: unknown // Pour l'opérateur "between"
  enabled: boolean
}

// Groupe de filtres avancés
export interface AdvancedFilterGroup {
  id: string
  logic: 'AND' | 'OR' // Pour filtres combinés
  condition?: 'AND' | 'OR' // Alias pour logic
  rules: (AdvancedFilterRule | AdvancedFilterGroup)[] // Support des groupes imbriqués
}

// État de sélection
export interface SelectionState {
  selectedRows: Set<string | number>
  selectAll: boolean
}

// Configuration de la pagination
export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
}

// Paramètres utilisateur sauvegardés
export interface TableSettings {
  columns: {
    [columnId: string]: {
      width?: number
      visible?: boolean
      order?: number
    }
  }
  sort?: SortConfig[]
  filters?: FilterConfig[]
  pagination?: {
    pageSize: number
  }
  view?: string // Nom de la vue sauvegardée
}

// Configuration globale de la table
export interface DataTableConfig<T = DataRecord> {
  // Données
  data: T[]
  columns: ColumnConfig<T>[]
  keyField: keyof T | string

  // Identifiants
  tableId?: string // Pour la sauvegarde des paramètres
  userId?: string // Pour isoler les paramètres par utilisateur

  // Fonctionnalités
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  editable?: boolean
  selectable?: boolean
  exportable?: boolean
  pagination?: boolean | PaginationConfig

  // Apparence
  title?: string
  className?: string
  height?: number | string
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  compact?: boolean
  loading?: boolean
  error?: string | null
  emptyMessage?: string

  // Actions et callbacks
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    variant?: 'default' | 'destructive' | 'outline'
    disabled?: (row: T) => boolean
  }>
  onRowClick?: (row: T, index: number) => void
  onRowDoubleClick?: (row: T, index: number) => void
  onCellEdit?: (row: T, column: ColumnConfig<T>, value: unknown) => void
  onSelectionChange?: (selection: SelectionState) => void
  onPaginationChange?: (config: PaginationConfig) => void
  onAddNew?: () => void

  // Paramètres persistants
  settings?: TableSettings
  onSettingsChange?: (settings: TableSettings) => void
}

// Props du composant DataTable (alias de DataTableConfig)
export interface DataTableProps<T = DataRecord>
  extends DataTableConfig<T> {}

// Context pour les formules
export interface FormulaContext<T = DataRecord> {
  row: T
  rowIndex: number
  data: T[]
  columns: ColumnConfig<T>[]
  getValue: (columnId: string, rowIndex?: number) => unknown
}

// Types pour l'export
export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf'
  filename?: string
  includeHeaders?: boolean
  selectedOnly?: boolean
  visibleColumnsOnly?: boolean
}

// Types pour l'import
export interface ImportResult<T = DataRecord> {
  success: boolean
  data: T[]
  errors: Array<{
    row: number
    column: string
    message: string
  }>
  warnings: Array<{
    row: number
    column: string
    message: string
  }>
}
