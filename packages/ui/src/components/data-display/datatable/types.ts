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

// Configuration d'une colonne
export interface ColumnConfig<T = Record<string, unknown>> {
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
  column: string
  value: DataValue
  operator:
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'between'
    | 'in'
    | 'notIn'
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
export interface DataTableConfig<T = Record<string, unknown>> {
  // Données
  data: T[]
  columns: ColumnConfig<T>[]
  keyField: string

  // Identifiants
  tableId?: string // Pour la sauvegarde des paramètres
  userId?: string // Pour isoler les paramètres par utilisateur

  // Fonctionnalités
  sortable?: boolean
  searchable?: boolean
  filterable?: boolean
  editable?: boolean
  selectable?: boolean
  pagination?: boolean | PaginationConfig

  // Actions
  actions?: {
    create?: () => void
    edit?: (row: T) => void
    delete?: (rows: T[]) => void
    export?: (data: T[], format: 'xlsx' | 'csv' | 'pdf') => void
    import?: (data: unknown[]) => void
  }

  // Paramètres
  settings?: TableSettings
  onSettingsChange?: (settings: TableSettings) => void

  // Événements
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  onCellEdit?: (value: unknown, row: T, column: ColumnConfig<T>) => void
  onSelectionChange?: (selection: SelectionState) => void
  onPaginationChange?: (pagination: { page: number; pageSize: number; total: number }) => void

  // Style
  className?: string
  height?: number | string
  striped?: boolean
  bordered?: boolean
  compact?: boolean
}

// Props du composant DataTable (alias de DataTableConfig)
export interface DataTableProps<T = Record<string, unknown>> extends DataTableConfig<T> {}

// Context pour les formules
export interface FormulaContext<T = Record<string, unknown>> {
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
export interface ImportResult<T = Record<string, unknown>> {
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
