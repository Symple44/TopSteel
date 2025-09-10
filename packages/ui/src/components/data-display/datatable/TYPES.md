# DataTable Types Documentation

## Core Types

### DataTableProps<T>

```typescript
interface DataTableProps<T extends Record<string, unknown>> {
  // Required
  data: T[]
  columns: ColumnConfig<T>[]
  keyField: keyof T
  
  // Features
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  selectable?: boolean
  editable?: boolean
  exportable?: boolean
  resizable?: boolean
  reorderable?: boolean
  groupable?: boolean
  
  // Appearance
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
  
  // Configuration
  tableId?: string
  pagination?: boolean | PaginationConfig
  settings?: TableSettings
  defaultSort?: SortConfig[]
  defaultFilters?: FilterConfig[]
  
  // Actions
  actions?: Array<{
    label: string
    onClick: (row: T) => void
    icon?: React.ReactNode
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
    disabled?: boolean | ((row: T) => boolean)
  }>
  
  // Event Handlers
  onRowClick?: (row: T, index: number) => void
  onRowDoubleClick?: (row: T, index: number) => void
  onCellEdit?: (value: unknown, row: T, column: ColumnConfig<T>) => void
  onSelectionChange?: (selection: SelectionState) => void
  onSettingsChange?: (settings: TableSettings) => void
  onPaginationChange?: (config: PaginationConfig) => void
  onAddNew?: () => void
}
```

### ColumnConfig<T>

```typescript
interface ColumnConfig<T extends Record<string, unknown> = Record<string, unknown>> {
  // Identification
  id: string
  key: keyof T | string
  title: string
  description?: string
  
  // Type
  type?: ColumnType
  
  // Dimensions
  width?: number | string
  minWidth?: number
  maxWidth?: number
  
  // Features
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  editable?: boolean
  exportable?: boolean
  resizable?: boolean
  locked?: boolean
  hidden?: boolean
  
  // Rendering
  render?: (value: unknown, row: T, column: ColumnConfig<T>) => React.ReactNode
  headerRender?: () => React.ReactNode
  editRender?: (value: unknown, row: T, onChange: (value: unknown) => void) => React.ReactNode
  
  // Formatting
  formatter?: (value: unknown) => string
  exportFormatter?: (value: unknown) => string
  parser?: (value: string) => unknown
  
  // Validation
  validation?: ColumnValidation
  
  // Alignment & Style
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  className?: string
  headerClassName?: string
  
  // Filtering
  filterType?: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'range'
  filterOptions?: unknown[]
  filterComponent?: React.ComponentType<any>
  
  // Sorting
  sortType?: 'string' | 'number' | 'date' | 'boolean'
  sortComparator?: (a: T, b: T) => number
  
  // Grouping
  groupable?: boolean
  groupFormatter?: (value: unknown) => string
  
  // Metadata
  metadata?: Record<string, unknown>
}
```

### ColumnType

```typescript
type ColumnType = 
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'email'
  | 'url'
  | 'tel'
  | 'color'
  | 'select'
  | 'multiselect'
  | 'tags'
  | 'json'
  | 'markdown'
  | 'html'
  | 'image'
  | 'file'
  | 'currency'
  | 'percentage'
  | 'rating'
  | 'progress'
  | 'status'
  | 'badge'
  | 'avatar'
  | 'icon'
  | 'button'
  | 'link'
  | 'custom'
```

### SelectionState

```typescript
interface SelectionState {
  selectedRows: Set<string | number>
  selectAll: boolean
  selectedData?: unknown[]
}
```

### PaginationConfig

```typescript
interface PaginationConfig {
  pageSize: number
  currentPage: number
  totalItems?: number
  totalPages?: number
  pageSizeOptions?: number[]
  showPageSizeOptions?: boolean
  showPageNumbers?: boolean
  showFirstLast?: boolean
  showPrevNext?: boolean
  showInfo?: boolean
}
```

### SortConfig

```typescript
interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
  priority?: number
}
```

### FilterConfig

```typescript
interface FilterConfig {
  column: string
  operator: FilterOperator
  value: unknown
  type?: FilterType
}

type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_null'
  | 'is_not_null'

type FilterType = 
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'range'
```

### TableSettings

```typescript
interface TableSettings {
  columns?: ColumnSettings[]
  sort?: SortConfig[]
  filters?: FilterConfig[]
  pagination?: PaginationConfig
  grouping?: GroupingConfig
  view?: ViewType
  density?: 'compact' | 'normal' | 'comfortable'
  showToolbar?: boolean
  showSearch?: boolean
  showFilters?: boolean
  showColumnSelector?: boolean
  frozenColumns?: number
  expandedRows?: Set<string | number>
}

interface ColumnSettings {
  id: string
  visible: boolean
  order: number
  width?: number
  locked?: boolean
}
```

### DataTableConfig

```typescript
interface DataTableConfig<T extends Record<string, unknown>> {
  data: T[]
  columns: ColumnConfig<T>[]
  keyField: keyof T
  features?: DataTableFeatures
  appearance?: DataTableAppearance
  handlers?: DataTableHandlers<T>
  settings?: TableSettings
}

interface DataTableFeatures {
  sort?: boolean
  filter?: boolean
  search?: boolean
  select?: boolean
  edit?: boolean
  export?: boolean
  pagination?: boolean | PaginationConfig
  virtualScroll?: boolean
  columnResize?: boolean
  columnReorder?: boolean
  rowReorder?: boolean
  grouping?: boolean
  tree?: boolean
  expandable?: boolean
}

interface DataTableAppearance {
  theme?: 'light' | 'dark' | 'auto'
  variant?: 'default' | 'bordered' | 'striped'
  size?: 'sm' | 'md' | 'lg'
  density?: 'compact' | 'normal' | 'comfortable'
  stickyHeader?: boolean
  stickyColumns?: number
  height?: number | string
  maxHeight?: number | string
  className?: string
  style?: React.CSSProperties
}

interface DataTableHandlers<T> {
  onRowClick?: (row: T, index: number, event: React.MouseEvent) => void
  onRowDoubleClick?: (row: T, index: number, event: React.MouseEvent) => void
  onCellClick?: (value: unknown, row: T, column: ColumnConfig<T>, event: React.MouseEvent) => void
  onCellEdit?: (value: unknown, row: T, column: ColumnConfig<T>) => void | Promise<void>
  onSelectionChange?: (selection: SelectionState) => void
  onSortChange?: (sort: SortConfig[]) => void
  onFilterChange?: (filters: FilterConfig[]) => void
  onPaginationChange?: (pagination: PaginationConfig) => void
  onColumnResize?: (columnId: string, width: number) => void
  onColumnReorder?: (columns: ColumnConfig<T>[]) => void
  onRowReorder?: (rows: T[]) => void
  onExport?: (format: ExportFormat, data: T[]) => void
  onSettingsChange?: (settings: TableSettings) => void
}
```

## Helper Types

### DataTableCompatible<T>

```typescript
// Type pour rendre n'importe quel type compatible avec DataTable
type DataTableCompatible<T> = T & Record<string, unknown>
```

### DataTableData

```typescript
// Type de base pour les données DataTable
type DataTableData = Record<string, unknown>
```

### DataValue

```typescript
// Valeurs possibles dans les cellules
type DataValue = string | number | boolean | Date | null | undefined | Record<string, unknown> | unknown[]
```

## Validation Types

### ColumnValidation

```typescript
interface ColumnValidation {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown, row: Record<string, unknown>) => boolean | string
  message?: string
}
```

## Export Types

### ExportOptions

```typescript
interface ExportOptions {
  format: ExportFormat
  filename?: string
  columns?: string[]
  includeHeaders?: boolean
  delimiter?: string
  dateFormat?: string
  numberFormat?: string
  booleanFormat?: { true: string; false: string }
  nullFormat?: string
  customFormatters?: Record<string, (value: unknown) => string>
}

type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf' | 'xml'
```

### ImportResult

```typescript
interface ImportResult<T = Record<string, unknown>> {
  success: boolean
  data?: T[]
  errors?: Array<{
    row: number
    column?: string
    message: string
  }>
  warnings?: Array<{
    row: number
    column?: string
    message: string
  }>
  metadata?: {
    totalRows: number
    successfulRows: number
    failedRows: number
    duration: number
  }
}
```

## View Types

### ViewType

```typescript
type ViewType = 'table' | 'cards' | 'kanban' | 'calendar' | 'timeline' | 'gallery'
```

### ViewConfig

```typescript
interface ViewConfig {
  type: ViewType
  settings?: Record<string, unknown>
  columns?: string[]
  groupBy?: string
  sortBy?: string
  filterBy?: FilterConfig[]
}
```

## Formula Types

### FormulaContext

```typescript
interface FormulaContext {
  row: Record<string, unknown>
  data: Record<string, unknown>[]
  rowIndex: number
  column: ColumnConfig
  getValue: (key: string) => unknown
  getRowValue: (rowIndex: number, key: string) => unknown
  aggregate: (key: string, operation: AggregateOperation) => number
}

type AggregateOperation = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'mode'
```

## Hook Types

### UseDataTableStateOptions

```typescript
interface UseDataTableStateOptions<T extends Record<string, unknown>> {
  data: T[]
  columns: ColumnConfig<T>[]
  keyField: keyof T
  features?: DataTableFeatures
  initialState?: Partial<DataTableState<T>>
  onStateChange?: (state: DataTableState<T>) => void
}

interface DataTableState<T extends Record<string, unknown>> {
  processedData: T[]
  visibleColumns: ColumnConfig<T>[]
  selection: SelectionState
  sort: SortConfig[]
  filters: FilterConfig[]
  search: string
  pagination: PaginationConfig
  grouping?: GroupingConfig
  expanded: Set<string | number>
  editing?: {
    rowId: string | number
    columnId: string
    value: unknown
  }
}
```

## Usage Examples

### Basic Type-Safe Usage

```typescript
// Define your data type extending Record<string, unknown>
interface UserData extends Record<string, unknown> {
  id: number
  name: string
  email: string
  role: string
  active: boolean
}

// Type-safe columns
const columns: ColumnConfig<UserData>[] = [
  {
    id: 'name',
    key: 'name',
    title: 'Name',
    type: 'text',
    sortable: true
  },
  {
    id: 'email',
    key: 'email',
    title: 'Email',
    type: 'email',
    render: (value, row) => <a href={`mailto:${row.email}`}>{row.email}</a>
  }
]

// Use with DataTable
<DataTable<UserData>
  data={users}
  columns={columns}
  keyField="id"
/>
```

### Using DataTable with Business Types

```typescript
import type { Partner } from '@erp/types' // Now extends Record<string, unknown>
import { DataTable } from '@erp/ui'

const columns: ColumnConfig<Partner>[] = [
  {
    id: 'code',
    key: 'code',
    title: 'Code',
    type: 'text'
  }
]

<DataTable
  data={partners}
  columns={columns}
  keyField="id"
/>
```