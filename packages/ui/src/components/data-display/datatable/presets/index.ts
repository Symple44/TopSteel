/**
 * DataTable Preset System
 * Provides predefined configurations for common table use cases
 */

/**
 * Available preset types
 */
export type DataTablePreset = 'minimal' | 'standard' | 'advanced' | 'full'

/**
 * Configuration interface containing all DataTable boolean/config props
 */
export interface PresetConfig {
  // Core features
  sortable: boolean
  searchable: boolean
  filterable: boolean
  editable: boolean
  selectable: boolean
  exportable: boolean
  pagination: boolean

  // Advanced features
  virtualize?: boolean
  virtualizeThreshold: number
  estimatedRowHeight: number
  searchDebounceMs: number

  // Appearance
  striped: boolean
  bordered: boolean
  hoverable: boolean
  compact: boolean

  // Header features
  showSearch: boolean
  showFilters: boolean
  showExport: boolean
  showColumnToggle: boolean
  showAddNew: boolean

  // Footer features
  showPagination: boolean
  showSelection: boolean
  showSizeChanger: boolean
  pageSizeOptions: number[]
}

/**
 * Predefined preset configurations
 */
export const DATATABLE_PRESETS: Record<DataTablePreset, PresetConfig> = {
  /**
   * MINIMAL PRESET
   * Basic table display with no extra features
   * Use case: Simple read-only data display, embedded tables
   */
  minimal: {
    // Core features - all disabled
    sortable: false,
    searchable: false,
    filterable: false,
    editable: false,
    selectable: false,
    exportable: false,
    pagination: false,

    // Advanced features
    virtualize: undefined, // Auto-detect based on data size
    virtualizeThreshold: 100,
    estimatedRowHeight: 48,
    searchDebounceMs: 300,

    // Appearance
    striped: true,
    bordered: true,
    hoverable: false,
    compact: false,

    // Header features
    showSearch: false,
    showFilters: false,
    showExport: false,
    showColumnToggle: false,
    showAddNew: false,

    // Footer features
    showPagination: false,
    showSelection: false,
    showSizeChanger: false,
    pageSizeOptions: [10, 25, 50, 100],
  },

  /**
   * STANDARD PRESET
   * Typical CRUD table with basic features
   * Use case: Most admin panels, user management, standard data tables
   */
  standard: {
    // Core features - basics enabled
    sortable: true,
    searchable: true,
    filterable: false,
    editable: false,
    selectable: false,
    exportable: false,
    pagination: true,

    // Advanced features
    virtualize: undefined, // Auto-detect based on data size
    virtualizeThreshold: 100,
    estimatedRowHeight: 48,
    searchDebounceMs: 300,

    // Appearance
    striped: true,
    bordered: true,
    hoverable: true,
    compact: false,

    // Header features
    showSearch: true,
    showFilters: false,
    showExport: false,
    showColumnToggle: true,
    showAddNew: false,

    // Footer features
    showPagination: true,
    showSelection: false,
    showSizeChanger: true,
    pageSizeOptions: [10, 25, 50, 100],
  },

  /**
   * ADVANCED PRESET
   * Full-featured table with filters and export
   * Use case: Data analysis, reporting, advanced admin panels
   */
  advanced: {
    // Core features - most enabled
    sortable: true,
    searchable: true,
    filterable: true,
    editable: false,
    selectable: true,
    exportable: true,
    pagination: true,

    // Advanced features
    virtualize: undefined, // Auto-detect based on data size
    virtualizeThreshold: 100,
    estimatedRowHeight: 48,
    searchDebounceMs: 300,

    // Appearance
    striped: true,
    bordered: true,
    hoverable: true,
    compact: false,

    // Header features
    showSearch: true,
    showFilters: true,
    showExport: true,
    showColumnToggle: true,
    showAddNew: false,

    // Footer features
    showPagination: true,
    showSelection: true,
    showSizeChanger: true,
    pageSizeOptions: [10, 25, 50, 100, 250],
  },

  /**
   * FULL PRESET
   * All features enabled including editing
   * Use case: Spreadsheet-like interfaces, complex data management
   */
  full: {
    // Core features - all enabled
    sortable: true,
    searchable: true,
    filterable: true,
    editable: true,
    selectable: true,
    exportable: true,
    pagination: true,

    // Advanced features
    virtualize: true, // Force enable for performance
    virtualizeThreshold: 50, // Lower threshold for full-featured tables
    estimatedRowHeight: 48,
    searchDebounceMs: 300,

    // Appearance
    striped: true,
    bordered: true,
    hoverable: true,
    compact: false,

    // Header features
    showSearch: true,
    showFilters: true,
    showExport: true,
    showColumnToggle: true,
    showAddNew: true,

    // Footer features
    showPagination: true,
    showSelection: true,
    showSizeChanger: true,
    pageSizeOptions: [10, 25, 50, 100, 250, 500],
  },
}

/**
 * Apply a preset configuration with optional overrides
 * @param preset - The preset type to apply
 * @param overrides - Optional partial configuration to override preset values
 * @returns Complete preset configuration with overrides applied
 *
 * @example
 * ```tsx
 * // Use standard preset with export enabled
 * const config = applyPreset('standard', { exportable: true })
 *
 * // Use minimal preset with custom styling
 * const config = applyPreset('minimal', { striped: false, compact: true })
 * ```
 */
export function applyPreset(
  preset: DataTablePreset,
  overrides?: Partial<PresetConfig>
): PresetConfig {
  const baseConfig = DATATABLE_PRESETS[preset]

  if (!baseConfig) {
    throw new Error(`Invalid preset: ${preset}. Available presets: minimal, standard, advanced, full`)
  }

  return {
    ...baseConfig,
    ...overrides,
  }
}

/**
 * Get the default preset configuration for a specific use case
 * @param useCase - Description of the use case
 * @returns Recommended preset name
 *
 * @example
 * ```tsx
 * const preset = getRecommendedPreset('read-only') // Returns 'minimal'
 * const preset = getRecommendedPreset('crud') // Returns 'standard'
 * ```
 */
export function getRecommendedPreset(
  useCase: 'read-only' | 'crud' | 'data-analysis' | 'spreadsheet'
): DataTablePreset {
  const recommendations: Record<typeof useCase, DataTablePreset> = {
    'read-only': 'minimal',
    'crud': 'standard',
    'data-analysis': 'advanced',
    'spreadsheet': 'full',
  }

  return recommendations[useCase] || 'standard'
}

/**
 * Utility to compare two preset configurations
 * @param preset1 - First preset name
 * @param preset2 - Second preset name
 * @returns Object containing differences between presets
 */
export function comparePresets(
  preset1: DataTablePreset,
  preset2: DataTablePreset
): Partial<Record<keyof PresetConfig, { preset1: any; preset2: any }>> {
  const config1 = DATATABLE_PRESETS[preset1]
  const config2 = DATATABLE_PRESETS[preset2]

  const differences: Partial<Record<keyof PresetConfig, { preset1: any; preset2: any }>> = {}

  for (const key in config1) {
    const typedKey = key as keyof PresetConfig
    if (config1[typedKey] !== config2[typedKey]) {
      differences[typedKey] = {
        preset1: config1[typedKey],
        preset2: config2[typedKey],
      }
    }
  }

  return differences
}

/**
 * Check if a preset has a specific feature enabled
 * @param preset - Preset to check
 * @param feature - Feature key to check
 * @returns Boolean indicating if feature is enabled
 */
export function hasFeature(
  preset: DataTablePreset,
  feature: keyof PresetConfig
): boolean {
  const config = DATATABLE_PRESETS[preset]
  return Boolean(config[feature])
}

/**
 * Get a list of all enabled features for a preset
 * @param preset - Preset to analyze
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(preset: DataTablePreset): Array<keyof PresetConfig> {
  const config = DATATABLE_PRESETS[preset]
  return Object.entries(config)
    .filter(([_, value]) => value === true)
    .map(([key]) => key as keyof PresetConfig)
}

/**
 * Create a custom preset by merging multiple presets
 * @param basePreset - Base preset to start from
 * @param additions - Features to enable from other presets
 * @returns Custom preset configuration
 *
 * @example
 * ```tsx
 * // Start with minimal, add search and export from standard
 * const custom = createCustomPreset('minimal', {
 *   searchable: true,
 *   exportable: true,
 *   showSearch: true,
 *   showExport: true,
 * })
 * ```
 */
export function createCustomPreset(
  basePreset: DataTablePreset,
  additions: Partial<PresetConfig>
): PresetConfig {
  return applyPreset(basePreset, additions)
}
