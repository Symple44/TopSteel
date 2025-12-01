// Export principal du système DataTable

// Preset System
export {
  applyPreset,
  comparePresets,
  createCustomPreset,
  DATATABLE_PRESETS,
  getEnabledFeatures,
  getRecommendedPreset,
  hasFeature,
} from './presets'
export type { DataTablePreset, PresetConfig } from './presets'

// UI Components
export { AdvancedFilters } from './AdvancedFilters'
export { ColorRuleManager } from './ColorRuleManager'
export { ColumnFilterAdvanced } from './ColumnFilterAdvanced'
export { ColumnFilterDropdown } from './ColumnFilterDropdown'
export { ColumnFilterDropdownSimple } from './ColumnFilterDropdownSimple'
export { CustomSelect } from './CustomSelect'
// Utilities
export { ClipboardUtils } from './clipboard-utils'
// Main DataTable component - Modern ColumnConfig only
export { DataTable as default, DataTable } from './DataTable'
export { DataTableEmpty } from './DataTableEmpty'
export { DataTableError } from './DataTableError'
export { DataTableExample } from './DataTableExample'
export { DataTableSkeleton } from './DataTableSkeleton'
export { DragDropUtils, useDragDropColumns } from './drag-drop-utils'
export { ExportDialog } from './ExportDialog'
export { ExportUtils } from './export-utils'
export { FormulaEditor } from './FormulaEditor'
export { FormulaEngine } from './formula-engine'
export { GenericCardEditor } from './GenericCardEditor'
export { HierarchicalDataTable } from './HierarchicalDataTable'
export { HierarchicalDataTableExample } from './HierarchicalDataTableExample'
// Import System
export {
  ImportDialog,
  parseCSV,
  parseExcel,
  parseFile,
  detectFormat,
  validateFile,
  getSampleRows,
  validateField,
  validateRow,
  validateImport,
  getRowErrors,
  getAllErrors,
  getErrorsByField,
  getValidationSummary,
  filterValidRows,
  filterInvalidRows,
  useImport,
} from './import'
export type {
  ImportFormat,
  ImportConfig,
  ParsedData,
  ColumnMapping,
  ColumnMappingConfig,
  FieldValidationRule,
  ValidationSchema,
  ValidationResult,
  ImportValidationResult,
  ImportState,
  ImportProgress,
  ImportDialogProps,
  UseImportOptions,
  UseImportReturn,
} from './import'
// Data Adapter System
export {
  LocalAdapter,
  RestAdapter,
  GraphQLAdapter,
  SupabaseAdapter,
  useDataAdapter,
  AdapterError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from './adapters'
export type {
  DataAdapter,
  DataQuery,
  DataResponse,
  FilterValue,
  SortQuery,
  AdapterConfig,
  RestAdapterConfig,
  GraphQLAdapterConfig,
  SupabaseAdapterConfig,
  LocalAdapterConfig,
} from './adapters'
export { InlineEditor } from './InlineEditor'
export { KanbanCardEditor } from './KanbanCardEditor'
export { useKeyboardShortcuts } from './keyboard-shortcuts'
export { RichTextEditor } from './RichTextEditor'
export { RenderUtils } from './render-utils'
export { default as SimpleDataTableExample } from './SimpleExample'
export { SimpleModal } from './SimpleModal'
export { SettingsManager, usePersistedTableSettings } from './settings-manager'
export { TreeGroupingPanel } from './TreeGroupingPanel'
// Types - ColumnConfig is now the primary export (modern interface)
export type {
  ColumnConfig, // Main export - modern interface from types.ts
  ColumnConfig as ColumnConfigAdvanced, // Alias for clarity
  ColumnType,
  DataTableConfig,
  DataTableProps,
  DataValue,
  ExportOptions,
  FilterConfig,
  FormulaContext,
  ImportResult,
  PaginationConfig,
  SelectionState,
  SortConfig,
  TableSettings,
} from './types'
// Hooks
export { useColorRules } from './use-color-rules'
export { useDataViews } from './use-data-views'
export { useHierarchicalPreferences } from './use-hierarchical-preferences'
export { useHierarchicalReorder } from './use-hierarchical-reorder'
export { useRangeSelection } from './use-range-selection'
export { useTreeGrouping } from './use-tree-grouping'
export { ViewSelector } from './ViewSelector'
export { ValidationUtils } from './validation-utils'
// View components
export { CalendarView } from './views/CalendarView'
export { CardsView } from './views/CardsView'
export { KanbanView } from './views/KanbanView'
export { MapView } from './views/MapView'
export type { MapMarker } from './views/MapView'
// MobileDataCard supprimé - pas de support mobile (app mobile séparée)
export { TimelineView } from './views/TimelineView'
