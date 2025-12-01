/**
 * useImport Hook
 * Manages the complete import process including file handling, parsing, mapping, and validation
 */

import { useState, useCallback, useEffect } from 'react'
import type {
  ImportConfig,
  ImportFormat,
  ParsedData,
  ColumnMapping,
  ValidationSchema,
  ImportValidationResult,
  ImportProgress,
  ImportResult,
  ImportState,
} from './types'
import { parseFile, validateFile } from './parsers'
import { validateImport, filterValidRows, getAllErrors } from './validators'
import type { ColumnConfig } from '../types'

// ===== HOOK OPTIONS =====

export interface UseImportOptions<T = Record<string, unknown>> {
  /**
   * Target columns for mapping
   */
  columns: ColumnConfig<T>[]

  /**
   * Validation schema
   */
  validationSchema?: ValidationSchema

  /**
   * Allowed file formats
   */
  allowedFormats?: ImportFormat[]

  /**
   * Maximum file size in bytes
   */
  maxFileSize?: number

  /**
   * Default import configuration
   */
  defaultConfig?: Partial<ImportConfig>

  /**
   * Auto-detect column mappings
   */
  autoMapColumns?: boolean

  /**
   * Callback when import state changes
   */
  onStateChange?: (state: ImportState) => void

  /**
   * Callback when progress updates
   */
  onProgress?: (progress: ImportProgress) => void
}

// ===== HOOK RETURN TYPE =====

export interface UseImportReturn<T = Record<string, unknown>> {
  /**
   * Current import state
   */
  state: ImportState

  /**
   * Import progress information
   */
  progress: ImportProgress

  /**
   * Currently selected file
   */
  file: File | null

  /**
   * Parsed data from file
   */
  parsedData: ParsedData | null

  /**
   * Preview rows (first 5 by default)
   */
  preview: Record<string, unknown>[]

  /**
   * Column mappings
   */
  columnMapping: ColumnMapping[]

  /**
   * Validation result
   */
  validationResult: ImportValidationResult | null

  /**
   * Whether import is in progress
   */
  isImporting: boolean

  /**
   * Error message if any
   */
  error: string | null

  /**
   * Select a file for import
   */
  selectFile: (file: File) => Promise<void>

  /**
   * Set column mappings
   */
  setColumnMapping: (mappings: ColumnMapping[]) => void

  /**
   * Add or update a single column mapping
   */
  updateColumnMapping: (sourceColumn: string, targetColumn: string) => void

  /**
   * Remove a column mapping
   */
  removeColumnMapping: (sourceColumn: string) => void

  /**
   * Auto-detect column mappings
   */
  autoDetectMappings: () => void

  /**
   * Validate the current data
   */
  validateData: () => ImportValidationResult | null

  /**
   * Execute the import
   */
  executeImport: () => Promise<ImportResult<T>>

  /**
   * Reset the import state
   */
  reset: () => void

  /**
   * Update import configuration
   */
  updateConfig: (config: Partial<ImportConfig>) => void
}

// ===== HOOK IMPLEMENTATION =====

export function useImport<T = Record<string, unknown>>(
  options: UseImportOptions<T>
): UseImportReturn<T> {
  const {
    columns,
    validationSchema,
    allowedFormats = ['csv', 'xlsx', 'xls'],
    maxFileSize = 10 * 1024 * 1024, // 10MB
    defaultConfig,
    autoMapColumns = true,
    onStateChange,
    onProgress,
  } = options

  // State
  const [state, setState] = useState<ImportState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([])
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ImportProgress>({
    state: 'idle',
    percentage: 0,
    processedRows: 0,
    totalRows: 0,
  })
  const [config, setConfig] = useState<Partial<ImportConfig>>(
    defaultConfig || {
      hasHeader: true,
      delimiter: ',',
      skipEmptyRows: true,
      trimValues: true,
    }
  )

  // Update state and notify
  const updateState = useCallback(
    (newState: ImportState) => {
      setState(newState)
      setProgress(prev => ({ ...prev, state: newState }))
      onStateChange?.(newState)
    },
    [onStateChange]
  )

  // Update progress and notify
  const updateProgress = useCallback(
    (update: Partial<ImportProgress>) => {
      setProgress(prev => {
        const newProgress = { ...prev, ...update }
        onProgress?.(newProgress)
        return newProgress
      })
    },
    [onProgress]
  )

  // Select and parse file
  const selectFile = useCallback(
    async (selectedFile: File) => {
      try {
        updateState('uploading')
        setError(null)

        // Validate file
        const validation = validateFile(selectedFile, { allowedFormats, maxFileSize })
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        setFile(selectedFile)
        updateState('parsing')
        updateProgress({ percentage: 10, message: 'Parsing file...' })

        // Parse file
        const parsed = await parseFile(selectedFile, config)
        setParsedData(parsed)

        updateProgress({
          percentage: 50,
          totalRows: parsed.totalRows,
          message: `Parsed ${parsed.totalRows} rows`,
        })

        // Auto-detect mappings if enabled
        if (autoMapColumns) {
          const mappings = detectColumnMappings(parsed.headers, columns)
          setColumnMapping(mappings)
        }

        updateState('mapping')
        updateProgress({ percentage: 60, message: 'Column mapping ready' })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to parse file'
        setError(errorMessage)
        updateState('error')
        updateProgress({ percentage: 0, message: errorMessage })
      }
    },
    [allowedFormats, maxFileSize, config, autoMapColumns, columns, updateState, updateProgress]
  )

  // Update column mapping
  const updateColumnMapping = useCallback(
    (sourceColumn: string, targetColumn: string) => {
      setColumnMapping(prev => {
        const existing = prev.find(m => m.sourceColumn === sourceColumn)
        if (existing) {
          return prev.map(m => (m.sourceColumn === sourceColumn ? { ...m, targetColumn } : m))
        }
        return [...prev, { sourceColumn, targetColumn }]
      })
    },
    []
  )

  // Remove column mapping
  const removeColumnMapping = useCallback((sourceColumn: string) => {
    setColumnMapping(prev => prev.filter(m => m.sourceColumn !== sourceColumn))
  }, [])

  // Auto-detect mappings
  const autoDetectMappings = useCallback(() => {
    if (!parsedData) return
    const mappings = detectColumnMappings(parsedData.headers, columns)
    setColumnMapping(mappings)
  }, [parsedData, columns])

  // Validate data
  const validateData = useCallback((): ImportValidationResult | null => {
    if (!parsedData || !validationSchema) return null

    updateState('validating')
    updateProgress({ percentage: 70, message: 'Validating data...' })

    const result = validateImport(parsedData, validationSchema)
    setValidationResult(result)

    updateProgress({
      percentage: 90,
      message: result.valid
        ? `Validation passed: ${result.validRows} rows valid`
        : `Validation failed: ${result.invalidRows} errors`,
    })

    return result
  }, [parsedData, validationSchema, updateState, updateProgress])

  // Execute import
  const executeImport = useCallback(async (): Promise<ImportResult<T>> => {
    if (!parsedData) {
      throw new Error('No data to import')
    }

    const startTime = performance.now()
    updateState('importing')
    updateProgress({ percentage: 0, processedRows: 0, message: 'Starting import...' })

    try {
      // Validate if schema provided
      let validation: ImportValidationResult | null = validationResult
      if (validationSchema && !validation) {
        validation = validateData()
      }

      // Apply column mappings
      const mappedData = applyColumnMappings(parsedData.rows, columnMapping)

      // Filter valid rows if validation was performed
      const dataToImport = validation ? filterValidRows(parsedData, validation) : mappedData
      const errors = validation ? getAllErrors(validation) : []

      const result: ImportResult<T> = {
        success: !validation || validation.valid,
        data: dataToImport as T[],
        errors: errors.map(e => ({
          row: e.row,
          column: e.field,
          message: e.message,
          value: e.value,
        })),
        warnings: (validation?.warnings || []).map(w => ({
          row: w.row,
          column: w.field,
          message: w.message,
        })),
        stats: {
          totalRows: parsedData.totalRows,
          successfulRows: dataToImport.length,
          failedRows: errors.length,
          warningRows: validation?.warnings.length || 0,
          duration: performance.now() - startTime,
        },
        mappings: columnMapping,
      }

      updateState('complete')
      updateProgress({
        percentage: 100,
        processedRows: parsedData.totalRows,
        message: 'Import completed',
      })

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed'
      setError(errorMessage)
      updateState('error')
      throw err
    }
  }, [parsedData, validationSchema, validationResult, columnMapping, validateData, updateState, updateProgress])

  // Reset
  const reset = useCallback(() => {
    setFile(null)
    setParsedData(null)
    setColumnMapping([])
    setValidationResult(null)
    setError(null)
    updateState('idle')
    updateProgress({
      percentage: 0,
      processedRows: 0,
      totalRows: 0,
      message: undefined,
    })
  }, [updateState, updateProgress])

  // Update config
  const updateConfig = useCallback((newConfig: Partial<ImportConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Auto-validate when data or schema changes
  useEffect(() => {
    if (parsedData && validationSchema && state === 'mapping') {
      validateData()
    }
  }, [parsedData, validationSchema, state, validateData])

  return {
    state,
    progress,
    file,
    parsedData,
    preview: parsedData ? parsedData.rows.slice(0, 5) : [],
    columnMapping,
    validationResult,
    isImporting: state === 'importing' || state === 'parsing' || state === 'validating',
    error,
    selectFile,
    setColumnMapping,
    updateColumnMapping,
    removeColumnMapping,
    autoDetectMappings,
    validateData,
    executeImport,
    reset,
    updateConfig,
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Auto-detect column mappings based on header names
 */
function detectColumnMappings<T>(
  sourceHeaders: string[],
  targetColumns: ColumnConfig<T>[]
): ColumnMapping[] {
  const mappings: ColumnMapping[] = []

  sourceHeaders.forEach(header => {
    // Try exact match first
    let match = targetColumns.find(col => col.key === header || col.title === header)

    // Try case-insensitive match
    if (!match) {
      const headerLower = header.toLowerCase()
      match = targetColumns.find(
        col =>
          col.key.toLowerCase() === headerLower ||
          col.title.toLowerCase() === headerLower
      )
    }

    // Try fuzzy match (remove spaces, underscores, hyphens)
    if (!match) {
      const headerNormalized = normalizeString(header)
      match = targetColumns.find(
        col =>
          normalizeString(col.key) === headerNormalized ||
          normalizeString(col.title) === headerNormalized
      )
    }

    if (match) {
      mappings.push({
        sourceColumn: header,
        targetColumn: match.key,
      })
    }
  })

  return mappings
}

/**
 * Normalize string for fuzzy matching
 */
function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[\s_-]/g, '')
}

/**
 * Apply column mappings to data rows
 */
function applyColumnMappings(
  rows: Record<string, unknown>[],
  mappings: ColumnMapping[]
): Record<string, unknown>[] {
  return rows.map(row => {
    const mappedRow: Record<string, unknown> = {}

    mappings.forEach(mapping => {
      const value = row[mapping.sourceColumn]
      const finalValue = mapping.transform ? mapping.transform(value) : value
      mappedRow[mapping.targetColumn] = finalValue
    })

    return mappedRow
  })
}
