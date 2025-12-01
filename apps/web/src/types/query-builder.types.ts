/**
 * Comprehensive TypeScript interfaces for Query Builder components
 *
 * This file defines all the types needed across the Query Builder system
 * to replace 'unknown' and 'any' types while maintaining compatibility
 * with both frontend components and backend entities.
 *
 * Created to resolve TypeScript type inconsistencies in Query Builder components.
 */

// ============================================================================
// Core Data Interfaces - Matching Backend Entity Structure
// ============================================================================

/**
 * Main Query Builder data structure
 * Matches the backend QueryBuilder entity and contains all query configuration
 */
export interface QueryBuilderData {
  /** Unique identifier for the query builder */
  id?: string
  /** Display name for the query builder */
  name: string
  /** Optional description */
  description: string
  /** Database connection identifier */
  database: string
  /** Main table name for the query */
  mainTable: string
  /** Whether this query is publicly accessible */
  isPublic: boolean
  /** Maximum number of rows to return (optional) */
  maxRows?: number
  /** UI and execution settings */
  settings: QueryBuilderSettings
  /** Selected columns configuration */
  columns: QueryBuilderColumn[]
  /** Table joins configuration */
  joins: QueryBuilderJoin[]
  /** Calculated/computed fields */
  calculatedFields: QueryBuilderCalculatedField[]
  /** Layout configuration for display */
  layout: Record<string, unknown>
  /** Creation metadata */
  createdAt?: Date | string
  /** Last update metadata */
  updatedAt?: Date | string
  /** Creator user ID */
  createdById?: string
}

/**
 * Query Builder column configuration
 * Comprehensive interface that matches backend entity structure
 * while supporting all frontend usage patterns
 */
export interface QueryBuilderColumn {
  /** Unique identifier */
  id?: string
  /** Reference to parent query builder */
  queryBuilderId?: string
  /** Source table name */
  tableName: string
  /** Source column name */
  columnName: string
  /** Display alias for the column */
  alias: string
  /** User-friendly label for display */
  label: string
  /** Optional description */
  description?: string
  /** Data type (text, number, date, boolean, etc.) */
  dataType: string
  /** Whether this is a primary key column */
  isPrimaryKey?: boolean
  /** Whether this is a foreign key column */
  isForeignKey?: boolean
  /** Whether column should be visible in results */
  isVisible: boolean
  /** Whether column can be filtered */
  isFilterable: boolean
  /** Whether column can be sorted */
  isSortable: boolean
  /** Whether column can be used for grouping */
  isGroupable?: boolean
  /** Display order in results */
  displayOrder: number
  /** Optional column width for display */
  width?: number
  /** Formatting configuration */
  format?: QueryBuilderColumnFormat
  /** Aggregation configuration */
  aggregation?: QueryBuilderColumnAggregation

  // Compatibility properties for different usage patterns
  /** Legacy compatibility - same as columnName */
  name?: string
  /** Legacy compatibility - same as dataType */
  type?: string
}

/**
 * Column formatting options
 */
export interface QueryBuilderColumnFormat {
  type?: 'date' | 'number' | 'currency' | 'percentage' | 'boolean' | 'custom'
  pattern?: string
  prefix?: string
  suffix?: string
  decimals?: number
}

/**
 * Column aggregation options
 */
export interface QueryBuilderColumnAggregation {
  enabled?: boolean
  type?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

/**
 * Query Builder join configuration
 * Defines how tables are joined together
 */
export interface QueryBuilderJoin {
  /** Unique identifier */
  id?: string
  /** Reference to parent query builder */
  queryBuilderId?: string
  /** Source table name */
  fromTable: string
  /** Source column name */
  fromColumn: string
  /** Target table name */
  toTable: string
  /** Target column name */
  toColumn: string
  /** Type of join operation */
  joinType: JoinType
  /** Table alias for the joined table */
  alias: string
  /** Display order for joins */
  order?: number
}

/**
 * Available join types
 */
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

/**
 * Query Builder calculated field configuration
 * For computed columns based on expressions
 */
export interface QueryBuilderCalculatedField {
  /** Unique identifier */
  id?: string
  /** Reference to parent query builder */
  queryBuilderId?: string
  /** Technical name for the calculated field */
  name: string
  /** User-friendly label for display */
  label: string
  /** Optional description */
  description?: string
  /** SQL expression or formula */
  expression: string
  /** Result data type */
  dataType: string
  /** Whether field should be visible in results */
  isVisible: boolean
  /** Display order in results */
  displayOrder: number
  /** Formatting configuration */
  format?: QueryBuilderColumnFormat
  /** Dependencies on other columns */
  dependencies?: string[]
}

/**
 * Query Builder UI and execution settings
 */
export interface QueryBuilderSettings {
  /** Enable pagination in results */
  enablePagination: boolean
  /** Default page size */
  pageSize: number
  /** Enable column sorting */
  enableSorting: boolean
  /** Enable result filtering */
  enableFiltering: boolean
  /** Enable data export */
  enableExport: boolean
  /** Available export formats */
  exportFormats: string[]
  /** Row actions configuration (navigation buttons, etc.) */
  rowActions?: RowActionsSettings
}

// ============================================================================
// Row Actions Configuration
// ============================================================================

/**
 * Row actions settings container
 */
export interface RowActionsSettings {
  /** Whether row actions are enabled */
  enabled: boolean
  /** List of configured actions */
  actions: RowActionConfig[]
}

/**
 * Individual row action configuration
 * Allows defining navigation buttons and other actions on DataTable rows
 */
export interface RowActionConfig {
  /** Unique identifier for the action */
  id: string
  /** Display label for the action button */
  label: string
  /** Icon name (from Lucide icons) */
  icon?: string
  /** Action type */
  type: RowActionType
  /**
   * URL template for navigation actions
   * Supports placeholders like {id}, {user_id} that will be replaced with row data
   * Example: "/admin/users/{id}" or "/orders/{order_id}/details"
   */
  target?: string
  /**
   * Field name to use as the primary identifier
   * Used when target URL needs an ID field
   */
  idField?: string
  /** Button variant for styling */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /** Condition to disable the action */
  disabled?: RowActionDisabledCondition
  /** Required permissions to show this action */
  permissions?: string[]
  /** Required roles to show this action */
  roles?: string[]
  /** Confirmation message before executing (for destructive actions) */
  confirmMessage?: string
}

/**
 * Types of row actions
 */
export type RowActionType =
  | 'navigation'  // Navigate to another page
  | 'modal'       // Open a modal/dialog
  | 'callback'    // Execute a callback function
  | 'delete'      // Delete the row
  | 'edit'        // Edit the row inline
  | 'external'    // Open external URL

/**
 * Condition for disabling a row action
 */
export interface RowActionDisabledCondition {
  /** Field name to check */
  field: string
  /** Operator for comparison */
  operator: 'equals' | 'not_equals' | 'is_null' | 'is_not_null' | 'contains'
  /** Value to compare against */
  value?: unknown
}

/**
 * Helper function to build URL from template and row data
 * Replaces {fieldName} placeholders with actual values from the row
 *
 * @example
 * buildActionUrl("/users/{id}/edit", { id: "123", name: "John" })
 * // Returns: "/users/123/edit"
 */
export function buildActionUrl(template: string, row: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = row[key]
    return value !== undefined && value !== null ? String(value) : ''
  })
}

/**
 * Helper function to evaluate if an action should be disabled
 */
export function isActionDisabled(
  condition: RowActionDisabledCondition | undefined,
  row: Record<string, unknown>
): boolean {
  if (!condition) return false

  const fieldValue = row[condition.field]

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value
    case 'not_equals':
      return fieldValue !== condition.value
    case 'is_null':
      return fieldValue === null || fieldValue === undefined
    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined
    case 'contains':
      return typeof fieldValue === 'string' &&
             typeof condition.value === 'string' &&
             fieldValue.includes(condition.value)
    default:
      return false
  }
}

// ============================================================================
// Component-Specific Interfaces
// ============================================================================

/**
 * Props for QueryBuilderInterface component
 */
export interface QueryBuilderInterfaceProps {
  /** Query builder ID ('new' for creating new) */
  queryBuilderId: string
  /** Initial data for the query builder */
  initialData?: Partial<QueryBuilderData>
}

/**
 * Props for QuerySettings component
 */
export interface QuerySettingsProps {
  /** Current settings object (QueryBuilderData) */
  settings: QueryBuilderData
  /** Callback for settings changes */
  onSettingsChange: (updates: Partial<QueryBuilderData>) => void
}

/**
 * Table schema information from backend
 */
export interface DatabaseTable {
  /** Table name */
  name: string
  /** Database schema */
  schema: string
  /** Table type (table, view, etc.) */
  type: string
  /** Table description */
  description: string
  /** Available columns */
  columns: DatabaseColumn[]
}

/**
 * Column schema information from backend
 */
export interface DatabaseColumn {
  /** Column name */
  name: string
  /** Data type */
  type: string
  /** Whether column allows null values */
  nullable: boolean
  /** Whether this is a primary key */
  primary?: boolean
  /** Default value if any */
  default?: string
}

/**
 * Selected column in visual query builder
 */
export interface SelectedColumn {
  /** Source table */
  table: string
  /** Source column */
  column: string
  /** Optional alias */
  alias?: string
  /** Optional aggregation function */
  aggregation?: AggregationFunction
}

/**
 * Available aggregation functions
 */
export type AggregationFunction = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'

/**
 * Filter configuration for query results
 */
export interface QueryBuilderFilter {
  /** Column to filter on */
  column: string
  /** Filter operator */
  operator: FilterOperator
  /** Filter value */
  value: string | number | boolean | null
  /** Logical operator to combine with next filter */
  logicalOperator?: 'AND' | 'OR'
}

/**
 * Available filter operators
 */
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'is_null'
  | 'is_not_null'
  | 'in'
  | 'not_in'

// ============================================================================
// Data Preview Interfaces
// ============================================================================

/**
 * Props for DataTablePreview component
 */
export interface DataTablePreviewProps {
  /** Raw data to display */
  data: PreviewDataRow[] | null
  /** Column configurations */
  columns?: QueryBuilderColumn[]
  /** Calculated field configurations */
  calculatedFields?: QueryBuilderCalculatedField[]
  /** Layout configuration */
  layout?: Record<string, unknown>
  /** Display settings */
  settings?: {
    settings: QueryBuilderSettings
  }
}

/**
 * Data row structure for preview table
 */
export interface PreviewDataRow extends Record<string, unknown> {
  /** Optional row identifier */
  id?: string | number
}

/**
 * Column configuration for DataTable component
 */
export interface PreviewColumn {
  /** Column identifier */
  id: string
  /** Data key in row object */
  key: string
  /** Display title */
  title: string
  /** Column description */
  description: string
  /** Data type for formatting */
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime'
  /** Column width */
  width: number
  /** Whether column is sortable */
  sortable: boolean
  /** Whether column is searchable */
  searchable: boolean
  /** Custom render function */
  render?: (value: unknown, row: PreviewDataRow, column: PreviewColumn) => string
}

// ============================================================================
// API Interfaces
// ============================================================================

/**
 * Query execution parameters
 */
export interface QueryExecutionParams {
  /** Current page number */
  page?: number
  /** Number of rows per page */
  pageSize?: number
  /** Sort configuration */
  sort?: QuerySortConfig
  /** Filter configuration */
  filters?: QueryBuilderFilter[]
}

/**
 * Sort configuration
 */
export interface QuerySortConfig {
  /** Column to sort by */
  column: string
  /** Sort direction */
  direction: 'ASC' | 'DESC'
}

/**
 * Query execution result
 */
export interface QueryExecutionResult {
  /** Result data rows */
  data: PreviewDataRow[]
  /** Total number of rows (for pagination) */
  total: number
  /** Current page number */
  page?: number
  /** Number of rows per page */
  pageSize?: number
  /** Total number of pages */
  totalPages?: number
  /** Execution time in milliseconds */
  executionTime: number
  /** Generated SQL query (optional) */
  query?: string
  /** Error message if execution failed */
  error?: string
}

/**
 * Import/Export data structure
 */
export interface QueryBuilderImportData {
  /** Query builder configuration */
  queryBuilder: Partial<QueryBuilderData>
  /** Metadata about the export */
  metadata?: {
    exportedAt: string
    exportedBy?: string
    version: string
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Update type for query builder modifications
 * Allows partial updates to any QueryBuilderData property
 */
export type QueryBuilderUpdate = Partial<QueryBuilderData>

/**
 * Column update type
 * Allows partial updates to column configuration
 */
export type QueryBuilderColumnUpdate = Partial<QueryBuilderColumn>

/**
 * Type guard to check if an object is a QueryBuilderColumn
 */
export function isQueryBuilderColumn(obj: unknown): obj is QueryBuilderColumn {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'tableName' in obj &&
    'columnName' in obj &&
    'alias' in obj &&
    typeof (obj as QueryBuilderColumn).tableName === 'string' &&
    typeof (obj as QueryBuilderColumn).columnName === 'string' &&
    typeof (obj as QueryBuilderColumn).alias === 'string'
  )
}

/**
 * Type guard to check if an object is a QueryBuilderCalculatedField
 */
export function isQueryBuilderCalculatedField(obj: unknown): obj is QueryBuilderCalculatedField {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'expression' in obj &&
    typeof (obj as QueryBuilderCalculatedField).name === 'string' &&
    typeof (obj as QueryBuilderCalculatedField).expression === 'string'
  )
}

// ============================================================================
// Legacy Compatibility Types
// ============================================================================

/**
 * Legacy column interface for backward compatibility
 * Maps to QueryBuilderColumn with different property names
 */
export interface LegacyColumn {
  name: string
  type: string
  label?: string
  tableName?: string
  columnName?: string
  alias?: string
  dataType?: string
  description?: string
  isVisible?: boolean
  displayOrder?: number
}

/**
 * Utility function to convert QueryBuilderColumn to LegacyColumn format
 */
export function toLegacyColumn(column: QueryBuilderColumn): LegacyColumn {
  return {
    name: column.columnName,
    type: column.dataType,
    label: column.label,
    tableName: column.tableName,
    columnName: column.columnName,
    alias: column.alias,
    dataType: column.dataType,
    description: column.description,
    isVisible: column.isVisible,
    displayOrder: column.displayOrder,
  }
}

/**
 * Utility function to convert LegacyColumn to QueryBuilderColumn format
 */
export function fromLegacyColumn(column: LegacyColumn): QueryBuilderColumn {
  return {
    tableName: column.tableName || '',
    columnName: column.columnName || column.name,
    alias: column.alias || column.name,
    label: column.label || column.name,
    dataType: column.dataType || column.type,
    description: column.description,
    isVisible: column.isVisible ?? true,
    isFilterable: true,
    isSortable: true,
    displayOrder: column.displayOrder || 0,
  }
}
