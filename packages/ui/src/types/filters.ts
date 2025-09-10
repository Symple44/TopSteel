/**
 * @fileoverview Advanced filtering system for DataTable components
 * Provides type-safe, extensible filtering capabilities
 */

// ============================================================================
// FILTER OPERATORS
// ============================================================================

/**
 * Filter comparison operators
 */
export type FilterOperator =
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
  | 'is_null'
  | 'is_not_null'
  | 'is_empty'
  | 'is_not_empty'
  | 'regex'

/**
 * Get operators for specific data types
 */
export function getOperatorsForType(dataType: FilterDataType): FilterOperator[] {
  switch (dataType) {
    case 'string':
      return [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'is_empty',
        'is_not_empty',
        'regex',
      ]

    case 'number':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'greater_than_or_equal',
        'less_than',
        'less_than_or_equal',
        'between',
        'is_null',
        'is_not_null',
      ]

    case 'date':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'greater_than_or_equal',
        'less_than',
        'less_than_or_equal',
        'between',
        'is_null',
        'is_not_null',
      ]

    case 'boolean':
      return ['equals', 'not_equals', 'is_null', 'is_not_null']

    case 'select':
      return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null']

    case 'multi_select':
      return ['in', 'not_in', 'is_empty', 'is_not_empty']

    default:
      return ['equals', 'not_equals']
  }
}

// ============================================================================
// FILTER DATA TYPES
// ============================================================================

export type FilterDataType =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multi_select'
  | 'custom'

export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | null
  | undefined
  | [number, number] // For between operator
  | [Date, Date] // For date ranges

// ============================================================================
// BASE FILTER TYPES
// ============================================================================

/**
 * Base filter configuration
 */
export interface BaseFilter {
  id: string
  field: string
  label?: string
  dataType: FilterDataType
  operator: FilterOperator
  value: FilterValue
  isActive?: boolean
  isVisible?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Simple filter (single condition)
 */
export interface SimpleFilter extends BaseFilter {
  type: 'simple'
}

/**
 * Compound filter (multiple conditions)
 */
export interface CompoundFilter {
  type: 'compound'
  id: string
  logic: 'AND' | 'OR'
  filters: FilterType[]
  isActive?: boolean
  isVisible?: boolean
}

/**
 * Custom filter with validation function
 */
export interface CustomFilter extends BaseFilter {
  type: 'custom'
  validator: (value: unknown, filterValue: FilterValue) => boolean
}

/**
 * Main filter type (discriminated union)
 */
export type FilterType = SimpleFilter | CompoundFilter | CustomFilter

// ============================================================================
// FILTER STATE MANAGEMENT
// ============================================================================

/**
 * Filter state for DataTable
 */
export interface FilterState {
  filters: Record<string, FilterType>
  activeFilters: string[]
  globalFilter?: string
  quickFilters?: Record<string, boolean>
}

/**
 * Create initial filter state
 */
export function createInitialFilterState(): FilterState {
  return {
    filters: {},
    activeFilters: [],
    globalFilter: undefined,
    quickFilters: {},
  }
}

/**
 * Filter configuration for columns
 */
export interface ColumnFilterConfig {
  field: string
  label: string
  dataType: FilterDataType
  operators?: FilterOperator[]
  defaultOperator?: FilterOperator
  defaultValue?: FilterValue
  options?: Array<{ label: string; value: string | number | boolean }>
  placeholder?: string
  validation?: (value: FilterValue) => string | null
  customComponent?: React.ComponentType<unknown>
}

// ============================================================================
// FILTER BUILDERS
// ============================================================================

/**
 * Create a simple filter
 */
export function createSimpleFilter(config: Omit<SimpleFilter, 'type'>): SimpleFilter {
  return {
    type: 'simple',
    isActive: true,
    isVisible: true,
    ...config,
  }
}

/**
 * Create a compound filter
 */
export function createCompoundFilter(
  id: string,
  logic: 'AND' | 'OR',
  filters: FilterType[]
): CompoundFilter {
  return {
    type: 'compound',
    id,
    logic,
    filters,
    isActive: true,
    isVisible: true,
  }
}

/**
 * Create a custom filter
 */
export function createCustomFilter(config: Omit<CustomFilter, 'type'>): CustomFilter {
  return {
    type: 'custom',
    isActive: true,
    isVisible: true,
    ...config,
  }
}

// ============================================================================
// FILTER VALIDATORS
// ============================================================================

/**
 * Validate filter value based on operator
 */
export function validateFilterValue(
  operator: FilterOperator,
  value: FilterValue,
  dataType: FilterDataType
): string | null {
  // Null/empty checks
  if (['is_null', 'is_not_null', 'is_empty', 'is_not_empty'].includes(operator)) {
    return null // No value needed
  }

  // Value required for most operators
  if (value === null || value === undefined) {
    if (!['is_null', 'is_not_null'].includes(operator)) {
      return 'Value is required'
    }
  }

  // Between operator requires array of 2 values
  if (operator === 'between') {
    if (!Array.isArray(value) || value.length !== 2) {
      return 'Between operator requires two values'
    }
    if (dataType === 'number' && (typeof value[0] !== 'number' || typeof value[1] !== 'number')) {
      return 'Both values must be numbers'
    }
    if (dataType === 'date' && (!(value[0] instanceof Date) || !(value[1] instanceof Date))) {
      return 'Both values must be dates'
    }
  }

  // In/not_in operators require array
  if (['in', 'not_in'].includes(operator)) {
    if (!Array.isArray(value)) {
      return 'Value must be an array'
    }
    if (value.length === 0) {
      return 'At least one value is required'
    }
  }

  return null
}

// ============================================================================
// FILTER APPLICATORS
// ============================================================================

/**
 * Apply a simple filter to a value
 */
export function applySimpleFilter(filter: SimpleFilter, value: any): boolean {
  const { operator, value: filterValue } = filter

  switch (operator) {
    case 'equals':
      return value === filterValue

    case 'not_equals':
      return value !== filterValue

    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase())

    case 'not_contains':
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase())

    case 'starts_with':
      return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())

    case 'ends_with':
      return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())

    case 'greater_than':
      return filterValue != null && value > filterValue

    case 'greater_than_or_equal':
      return filterValue != null && value >= filterValue

    case 'less_than':
      return filterValue != null && value < filterValue

    case 'less_than_or_equal':
      return filterValue != null && value <= filterValue

    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        return value >= filterValue[0] && value <= filterValue[1]
      }
      return false

    case 'in':
      return Array.isArray(filterValue) && (filterValue as unknown[]).includes(value)

    case 'not_in':
      return Array.isArray(filterValue) && !(filterValue as unknown[]).includes(value)

    case 'is_null':
      return value === null || value === undefined

    case 'is_not_null':
      return value !== null && value !== undefined

    case 'is_empty':
      return value === '' || (Array.isArray(value) && value.length === 0)

    case 'is_not_empty':
      return value !== '' && (!Array.isArray(value) || value.length > 0)

    case 'regex':
      try {
        const regex = new RegExp(String(filterValue))
        return regex.test(String(value))
      } catch {
        return false
      }

    default:
      return true
  }
}

/**
 * Apply a compound filter to a value
 */
export function applyCompoundFilter(filter: CompoundFilter, row: any): boolean {
  if (filter.filters.length === 0) return true

  const results = filter.filters.map((f) => applyFilter(f, row))

  if (filter.logic === 'AND') {
    return results.every(Boolean)
  } else {
    return results.some(Boolean)
  }
}

/**
 * Apply any filter type to a row
 */
export function applyFilter(filter: FilterType, row: any): boolean {
  if (!filter.isActive) return true

  switch (filter.type) {
    case 'simple':
      return applySimpleFilter(filter, row[filter.field])

    case 'compound':
      return applyCompoundFilter(filter, row)

    case 'custom':
      return filter.validator(row[filter.field], filter.value)

    default:
      return true
  }
}

/**
 * Apply all filters to a dataset
 */
export function applyFilters<T extends Record<string, unknown>>(
  data: T[],
  filterState: FilterState
): T[] {
  let filtered = [...data]

  // Apply global filter
  if (filterState.globalFilter) {
    const searchTerm = filterState.globalFilter.toLowerCase()
    filtered = filtered.filter((row) => {
      return Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm))
    })
  }

  // Apply active filters
  filterState.activeFilters.forEach((filterId) => {
    const filter = filterState.filters[filterId]
    if (filter) {
      filtered = filtered.filter((row) => applyFilter(filter, row))
    }
  })

  return filtered
}

// ============================================================================
// FILTER SERIALIZATION
// ============================================================================

/**
 * Serialize filter state to JSON
 */
export function serializeFilterState(state: FilterState): string {
  return JSON.stringify({
    filters: Object.entries(state.filters).reduce(
      (acc, [key, filter]) => {
        // Remove functions for serialization
        if (filter.type === 'custom') {
          const { validator: _validator, ...rest } = filter
          acc[key] = rest
        } else {
          acc[key] = filter
        }
        return acc
      },
      {} as Record<string, unknown>
    ),
    activeFilters: state.activeFilters,
    globalFilter: state.globalFilter,
    quickFilters: state.quickFilters,
  })
}

/**
 * Deserialize filter state from JSON
 */
export function deserializeFilterState(
  json: string,
  customValidators?: Record<string, (value: unknown, filterValue: FilterValue) => boolean>
): FilterState {
  try {
    const parsed = JSON.parse(json)

    // Restore custom validators
    if (customValidators) {
      Object.entries(parsed.filters).forEach(([key, filter]: [string, any]) => {
        if (filter.type === 'custom' && customValidators[key]) {
          filter.validator = customValidators[key]
        }
      })
    }

    return parsed
  } catch {
    return createInitialFilterState()
  }
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const FilterUtils = {
  // Operators
  getOperatorsForType,

  // Builders
  createSimpleFilter,
  createCompoundFilter,
  createCustomFilter,
  createInitialFilterState,

  // Validators
  validateFilterValue,

  // Applicators
  applySimpleFilter,
  applyCompoundFilter,
  applyFilter,
  applyFilters,

  // Serialization
  serializeFilterState,
  deserializeFilterState,
} as const
