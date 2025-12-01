/**
 * Import System Types for DataTable
 * Supports CSV and Excel file imports with column mapping and validation
 */

import type { ColumnConfig } from '../types'

// ===== IMPORT FORMATS =====

/**
 * Supported import file formats
 */
export type ImportFormat = 'csv' | 'xlsx' | 'xls'

// ===== IMPORT CONFIGURATION =====

/**
 * Configuration options for importing files
 */
export interface ImportConfig {
  /**
   * File format being imported
   */
  format: ImportFormat

  /**
   * CSV delimiter character
   * @default ','
   */
  delimiter?: string

  /**
   * Whether the first row contains headers
   * @default true
   */
  hasHeader?: boolean

  /**
   * Date format for parsing date columns
   * @default 'YYYY-MM-DD'
   */
  dateFormat?: string

  /**
   * Encoding of the file
   * @default 'UTF-8'
   */
  encoding?: string

  /**
   * Skip empty rows
   * @default true
   */
  skipEmptyRows?: boolean

  /**
   * Maximum number of rows to import
   * @default undefined (no limit)
   */
  maxRows?: number

  /**
   * Quote character for CSV
   * @default '"'
   */
  quoteChar?: string

  /**
   * Escape character for CSV
   * @default '"'
   */
  escapeChar?: string

  /**
   * Trim whitespace from values
   * @default true
   */
  trimValues?: boolean
}

// ===== PARSED DATA =====

/**
 * Raw parsed data from a file
 */
export interface ParsedData {
  /**
   * Headers extracted from the file (if hasHeader is true)
   */
  headers: string[]

  /**
   * Raw data rows as key-value pairs
   */
  rows: Record<string, unknown>[]

  /**
   * Total number of rows in the file (before filtering)
   */
  totalRows: number

  /**
   * Metadata about the parsed file
   */
  metadata: {
    format: ImportFormat
    encoding?: string
    parseTime: number
    errors?: string[]
  }
}

// ===== COLUMN MAPPING =====

/**
 * Maps file columns to target data columns
 */
export interface ColumnMapping {
  /**
   * Source column name from the file
   */
  sourceColumn: string

  /**
   * Target column ID in the data table
   */
  targetColumn: string

  /**
   * Optional transformation function
   */
  transform?: (value: unknown) => unknown

  /**
   * Whether this mapping is required
   * @default false
   */
  required?: boolean
}

/**
 * Complete column mapping configuration
 */
export interface ColumnMappingConfig {
  /**
   * Array of column mappings
   */
  mappings: ColumnMapping[]

  /**
   * Auto-detect mappings based on column names
   * @default true
   */
  autoDetect?: boolean

  /**
   * Case-insensitive matching for auto-detection
   * @default true
   */
  caseInsensitive?: boolean
}

// ===== VALIDATION =====

/**
 * Validation rule for a single field
 */
export interface FieldValidationRule {
  /**
   * Field is required
   */
  required?: boolean

  /**
   * Expected data type
   */
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'phone'

  /**
   * Minimum value (for numbers) or length (for strings)
   */
  min?: number

  /**
   * Maximum value (for numbers) or length (for strings)
   */
  max?: number

  /**
   * Regular expression pattern to match
   */
  pattern?: RegExp

  /**
   * Custom validation function
   * Returns error message if validation fails, null otherwise
   */
  custom?: (value: unknown, row: Record<string, unknown>) => string | null

  /**
   * Allowed values (enum validation)
   */
  enum?: unknown[]

  /**
   * Error message to display when validation fails
   */
  message?: string
}

/**
 * Validation schema for import data
 */
export interface ValidationSchema {
  [fieldName: string]: FieldValidationRule
}

/**
 * Result of validating a single row
 */
export interface ValidationResult {
  /**
   * Whether the row is valid
   */
  valid: boolean

  /**
   * Validation errors for specific fields
   */
  errors: Array<{
    field: string
    message: string
    value?: unknown
  }>
}

/**
 * Result of validating all import data
 */
export interface ImportValidationResult {
  /**
   * Whether all data is valid
   */
  valid: boolean

  /**
   * Total number of rows validated
   */
  totalRows: number

  /**
   * Number of valid rows
   */
  validRows: number

  /**
   * Number of invalid rows
   */
  invalidRows: number

  /**
   * Errors by row index
   */
  errors: Map<number, ValidationResult>

  /**
   * Warnings (non-blocking issues)
   */
  warnings: Array<{
    row: number
    field: string
    message: string
  }>
}

// ===== IMPORT RESULT =====

/**
 * Result of an import operation
 */
export interface ImportResult<T = Record<string, unknown>> {
  /**
   * Whether the import was successful
   */
  success: boolean

  /**
   * Successfully imported data
   */
  data: T[]

  /**
   * Import errors (blocking)
   */
  errors: Array<{
    row: number
    column: string
    message: string
    value?: unknown
  }>

  /**
   * Import warnings (non-blocking)
   */
  warnings: Array<{
    row: number
    column: string
    message: string
    value?: unknown
  }>

  /**
   * Import statistics
   */
  stats: {
    totalRows: number
    successfulRows: number
    failedRows: number
    warningRows: number
    duration: number
  }

  /**
   * Column mappings that were applied
   */
  mappings?: ColumnMapping[]
}

// ===== IMPORT STATE =====

/**
 * State of the import process
 */
export type ImportState =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'mapping'
  | 'validating'
  | 'importing'
  | 'complete'
  | 'error'

/**
 * Progress information for the import
 */
export interface ImportProgress {
  /**
   * Current state
   */
  state: ImportState

  /**
   * Progress percentage (0-100)
   */
  percentage: number

  /**
   * Number of rows processed
   */
  processedRows: number

  /**
   * Total number of rows to process
   */
  totalRows: number

  /**
   * Current operation message
   */
  message?: string
}

// ===== IMPORT DIALOG PROPS =====

/**
 * Props for the ImportDialog component
 */
export interface ImportDialogProps<T = Record<string, unknown>> {
  /**
   * Whether the dialog is open
   */
  open?: boolean

  /**
   * Callback when dialog open state changes
   */
  onOpenChange?: (open: boolean) => void

  /**
   * Target columns for mapping
   */
  columns: ColumnConfig<T>[]

  /**
   * Validation schema for imported data
   */
  validationSchema?: ValidationSchema

  /**
   * Callback when import is complete
   */
  onImport: (result: ImportResult<T>) => void | Promise<void>

  /**
   * Callback when import is cancelled
   */
  onCancel?: () => void

  /**
   * Allowed file formats
   * @default ['csv', 'xlsx', 'xls']
   */
  allowedFormats?: ImportFormat[]

  /**
   * Maximum file size in bytes
   * @default 10485760 (10MB)
   */
  maxFileSize?: number

  /**
   * Default import configuration
   */
  defaultConfig?: Partial<ImportConfig>

  /**
   * Whether to show advanced options
   * @default false
   */
  showAdvancedOptions?: boolean

  /**
   * Custom validation function
   */
  customValidation?: (data: ParsedData) => Promise<ImportValidationResult>

  /**
   * Title for the dialog
   * @default 'Import Data'
   */
  title?: string

  /**
   * Description for the dialog
   */
  description?: string
}
