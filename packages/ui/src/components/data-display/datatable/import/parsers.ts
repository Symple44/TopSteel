/**
 * File Parsers for CSV and Excel
 * Handles parsing of different file formats into a common structure
 */

import * as XLSX from 'xlsx'
import type { ImportConfig, ParsedData, ImportFormat } from './types'

// ===== CSV PARSER =====

/**
 * Parse CSV file using Papa Parse (assumed to be installed)
 * Falls back to basic parsing if Papa Parse is not available
 */
export async function parseCSV(file: File, config: ImportConfig): Promise<ParsedData> {
  const startTime = performance.now()

  try {
    // Try to use Papa Parse if available
    if (typeof window !== 'undefined' && 'Papa' in window) {
      return await parseCSVWithPapa(file, config)
    }

    // Fallback to basic CSV parsing
    return await parseCSVBasic(file, config)
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    const parseTime = performance.now() - startTime
    console.log(`CSV parsing completed in ${parseTime.toFixed(2)}ms`)
  }
}

/**
 * Parse CSV using Papa Parse library
 */
async function parseCSVWithPapa(file: File, config: ImportConfig): Promise<ParsedData> {
  const startTime = performance.now()

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Papa = (window as any).Papa

    Papa.parse(file, {
      header: config.hasHeader !== false,
      delimiter: config.delimiter || ',',
      quoteChar: config.quoteChar || '"',
      escapeChar: config.escapeChar || '"',
      skipEmptyLines: config.skipEmptyRows !== false,
      transformHeader: config.trimValues !== false ? (header: string) => header.trim() : undefined,
      transform: config.trimValues !== false ? (value: string) => value.trim() : undefined,
      complete: (results: { data: Record<string, unknown>[]; meta: { fields?: string[] } }) => {
        const parseTime = performance.now() - startTime
        const rows = config.maxRows ? results.data.slice(0, config.maxRows) : results.data

        resolve({
          headers: results.meta.fields || [],
          rows,
          totalRows: results.data.length,
          metadata: {
            format: 'csv',
            encoding: config.encoding,
            parseTime,
          },
        })
      },
      error: (error: Error) => {
        reject(new Error(`Papa Parse error: ${error.message}`))
      },
    })
  })
}

/**
 * Basic CSV parser fallback (no external dependencies)
 */
async function parseCSVBasic(file: File, config: ImportConfig): Promise<ParsedData> {
  const startTime = performance.now()
  const text = await file.text()

  const delimiter = config.delimiter || ','
  const hasHeader = config.hasHeader !== false
  const trimValues = config.trimValues !== false

  const lines = text.split(/\r?\n/).filter(line => {
    if (config.skipEmptyRows !== false) {
      return line.trim().length > 0
    }
    return true
  })

  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  // Parse headers
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine, delimiter, trimValues)

  // Parse data rows
  const dataLines = hasHeader ? lines.slice(1) : lines
  const rows = dataLines.map(line => {
    const values = parseCSVLine(line, delimiter, trimValues)
    const row: Record<string, unknown> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || null
    })

    return row
  })

  const limitedRows = config.maxRows ? rows.slice(0, config.maxRows) : rows
  const parseTime = performance.now() - startTime

  return {
    headers,
    rows: limitedRows,
    totalRows: rows.length,
    metadata: {
      format: 'csv',
      encoding: config.encoding,
      parseTime,
    },
  }
}

/**
 * Parse a single CSV line
 */
function parseCSVLine(line: string, delimiter: string, trim: boolean): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      // End of value
      values.push(trim ? current.trim() : current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last value
  values.push(trim ? current.trim() : current)

  return values
}

// ===== EXCEL PARSER =====

/**
 * Parse Excel file using XLSX library
 */
export async function parseExcel(file: File, config: ImportConfig): Promise<ParsedData> {
  const startTime = performance.now()

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false,
    })

    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('Excel file contains no sheets')
    }

    const worksheet = workbook.Sheets[firstSheetName]
    if (!worksheet) {
      throw new Error(`Sheet "${firstSheetName}" not found`)
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      header: config.hasHeader !== false ? undefined : 1,
      defval: null,
      blankrows: config.skipEmptyRows === false,
      raw: false, // Get formatted values
      dateNF: config.dateFormat || 'yyyy-mm-dd',
    })

    // Extract headers
    const headers = config.hasHeader !== false
      ? Object.keys(jsonData[0] || {})
      : Array.from({ length: Object.keys(jsonData[0] || {}).length }, (_, i) => `Column ${i + 1}`)

    // Trim values if needed
    let rows = jsonData
    if (config.trimValues !== false) {
      rows = jsonData.map(row => {
        const trimmedRow: Record<string, unknown> = {}
        Object.entries(row).forEach(([key, value]) => {
          trimmedRow[key] = typeof value === 'string' ? value.trim() : value
        })
        return trimmedRow
      })
    }

    // Apply max rows limit
    const limitedRows = config.maxRows ? rows.slice(0, config.maxRows) : rows
    const parseTime = performance.now() - startTime

    return {
      headers,
      rows: limitedRows,
      totalRows: rows.length,
      metadata: {
        format: config.format,
        encoding: config.encoding,
        parseTime,
      },
    }
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ===== GENERIC PARSER =====

/**
 * Parse any supported file format
 */
export async function parseFile(file: File, config?: Partial<ImportConfig>): Promise<ParsedData> {
  // Detect format from file extension
  const format = detectFormat(file.name)

  // Merge with default config
  const fullConfig: ImportConfig = {
    delimiter: ',',
    hasHeader: true,
    dateFormat: 'YYYY-MM-DD',
    encoding: 'UTF-8',
    skipEmptyRows: true,
    quoteChar: '"',
    escapeChar: '"',
    trimValues: true,
    ...config,
    format, // Ensure format is set after spreading config
  }

  // Parse based on format
  if (format === 'csv') {
    return parseCSV(file, fullConfig)
  } else if (format === 'xlsx' || format === 'xls') {
    return parseExcel(file, fullConfig)
  } else {
    throw new Error(`Unsupported file format: ${format}`)
  }
}

// ===== UTILITIES =====

/**
 * Detect file format from filename
 */
export function detectFormat(filename: string): ImportFormat {
  const extension = filename.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'csv':
      return 'csv'
    case 'xlsx':
      return 'xlsx'
    case 'xls':
      return 'xls'
    default:
      throw new Error(`Unknown file extension: ${extension}`)
  }
}

/**
 * Validate file before parsing
 */
export function validateFile(
  file: File,
  options: {
    allowedFormats?: ImportFormat[]
    maxFileSize?: number
  } = {}
): { valid: boolean; error?: string } {
  const allowedFormats = options.allowedFormats || ['csv', 'xlsx', 'xls']
  const maxFileSize = options.maxFileSize || 10 * 1024 * 1024 // 10MB default

  // Check file size
  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`,
    }
  }

  // Check format
  try {
    const format = detectFormat(file.name)
    if (!allowedFormats.includes(format)) {
      return {
        valid: false,
        error: `File format "${format}" is not allowed. Allowed formats: ${allowedFormats.join(', ')}`,
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid file format',
    }
  }

  return { valid: true }
}

/**
 * Get sample rows from parsed data for preview
 */
export function getSampleRows(data: ParsedData, count: number = 5): Record<string, unknown>[] {
  return data.rows.slice(0, count)
}
