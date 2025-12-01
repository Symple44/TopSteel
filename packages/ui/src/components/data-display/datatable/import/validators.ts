/**
 * Validation utilities for import data
 * Handles field validation, type checking, and custom validators
 */

import type {
  ValidationSchema,
  ValidationResult,
  ImportValidationResult,
  ParsedData,
  FieldValidationRule,
} from './types'

// ===== FIELD VALIDATORS =====

/**
 * Validate a single field value against a rule
 */
export function validateField(
  value: unknown,
  rule: FieldValidationRule,
  fieldName: string
): { valid: boolean; error?: string } {
  // Required check
  if (rule.required && (value === null || value === undefined || value === '')) {
    return {
      valid: false,
      error: rule.message || `${fieldName} is required`,
    }
  }

  // Skip other validations if value is empty and not required
  if (!rule.required && (value === null || value === undefined || value === '')) {
    return { valid: true }
  }

  // Type validation
  if (rule.type) {
    const typeValidation = validateType(value, rule.type, fieldName)
    if (!typeValidation.valid) {
      return typeValidation
    }
  }

  // Min/Max validation
  if (rule.min !== undefined) {
    if (typeof value === 'number' && value < rule.min) {
      return {
        valid: false,
        error: rule.message || `${fieldName} must be at least ${rule.min}`,
      }
    }
    if (typeof value === 'string' && value.length < rule.min) {
      return {
        valid: false,
        error: rule.message || `${fieldName} must be at least ${rule.min} characters`,
      }
    }
  }

  if (rule.max !== undefined) {
    if (typeof value === 'number' && value > rule.max) {
      return {
        valid: false,
        error: rule.message || `${fieldName} must be at most ${rule.max}`,
      }
    }
    if (typeof value === 'string' && value.length > rule.max) {
      return {
        valid: false,
        error: rule.message || `${fieldName} must be at most ${rule.max} characters`,
      }
    }
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string') {
    if (!rule.pattern.test(value)) {
      return {
        valid: false,
        error: rule.message || `${fieldName} has invalid format`,
      }
    }
  }

  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    return {
      valid: false,
      error: rule.message || `${fieldName} must be one of: ${rule.enum.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Validate value type
 */
function validateType(
  value: unknown,
  type: FieldValidationRule['type'],
  fieldName: string
): { valid: boolean; error?: string } {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: `${fieldName} must be a string` }
      }
      break

    case 'number':
      if (typeof value !== 'number' && (typeof value !== 'string' || isNaN(Number(value)))) {
        return { valid: false, error: `${fieldName} must be a number` }
      }
      break

    case 'boolean':
      if (typeof value !== 'boolean' && !['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase())) {
        return { valid: false, error: `${fieldName} must be a boolean` }
      }
      break

    case 'date':
      if (!isValidDate(value)) {
        return { valid: false, error: `${fieldName} must be a valid date` }
      }
      break

    case 'email':
      if (!isValidEmail(String(value))) {
        return { valid: false, error: `${fieldName} must be a valid email address` }
      }
      break

    case 'url':
      if (!isValidUrl(String(value))) {
        return { valid: false, error: `${fieldName} must be a valid URL` }
      }
      break

    case 'phone':
      if (!isValidPhone(String(value))) {
        return { valid: false, error: `${fieldName} must be a valid phone number` }
      }
      break
  }

  return { valid: true }
}

// ===== TYPE CHECKERS =====

/**
 * Check if value is a valid date
 */
function isValidDate(value: unknown): boolean {
  if (value instanceof Date) {
    return !isNaN(value.getTime())
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }

  return false
}

/**
 * Check if value is a valid email
 */
function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

/**
 * Check if value is a valid URL
 */
function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * Check if value is a valid phone number
 */
function isValidPhone(value: string): boolean {
  // Basic phone validation - can be customized
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
}

// ===== ROW VALIDATION =====

/**
 * Validate a single row against a schema
 */
export function validateRow(row: Record<string, unknown>, schema: ValidationSchema): ValidationResult {
  const errors: ValidationResult['errors'] = []

  // Validate each field in the schema
  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = row[fieldName]

    // Field validation
    const fieldValidation = validateField(value, rule, fieldName)
    if (!fieldValidation.valid) {
      errors.push({
        field: fieldName,
        message: fieldValidation.error || 'Validation failed',
        value,
      })
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value, row)
      if (customError) {
        errors.push({
          field: fieldName,
          message: customError,
          value,
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ===== IMPORT VALIDATION =====

/**
 * Validate all imported data
 */
export function validateImport(data: ParsedData, schema: ValidationSchema): ImportValidationResult {
  const errors = new Map<number, ValidationResult>()
  const warnings: ImportValidationResult['warnings'] = []
  let validRows = 0
  let invalidRows = 0

  // Validate each row
  data.rows.forEach((row, index) => {
    const rowValidation = validateRow(row, schema)

    if (rowValidation.valid) {
      validRows++
    } else {
      invalidRows++
      errors.set(index, rowValidation)
    }

    // Check for warnings (e.g., missing optional fields with data quality issues)
    Object.entries(row).forEach(([field, value]) => {
      if (value === null || value === undefined || value === '') {
        const rule = schema[field]
        if (rule && !rule.required) {
          warnings.push({
            row: index,
            field,
            message: `Optional field "${field}" is empty`,
          })
        }
      }
    })
  })

  return {
    valid: invalidRows === 0,
    totalRows: data.rows.length,
    validRows,
    invalidRows,
    errors,
    warnings,
  }
}

// ===== VALIDATION HELPERS =====

/**
 * Get validation errors for a specific row
 */
export function getRowErrors(validationResult: ImportValidationResult, rowIndex: number): ValidationResult | null {
  return validationResult.errors.get(rowIndex) || null
}

/**
 * Get all errors as a flat array
 */
export function getAllErrors(
  validationResult: ImportValidationResult
): Array<{ row: number; field: string; message: string; value?: unknown }> {
  const allErrors: Array<{ row: number; field: string; message: string; value?: unknown }> = []

  validationResult.errors.forEach((rowErrors, rowIndex) => {
    rowErrors.errors.forEach(error => {
      allErrors.push({
        row: rowIndex,
        field: error.field,
        message: error.message,
        value: error.value,
      })
    })
  })

  return allErrors
}

/**
 * Get errors grouped by field
 */
export function getErrorsByField(
  validationResult: ImportValidationResult
): Map<string, Array<{ row: number; message: string; value?: unknown }>> {
  const errorsByField = new Map<string, Array<{ row: number; message: string; value?: unknown }>>()

  validationResult.errors.forEach((rowErrors, rowIndex) => {
    rowErrors.errors.forEach(error => {
      const fieldErrors = errorsByField.get(error.field) || []
      fieldErrors.push({
        row: rowIndex,
        message: error.message,
        value: error.value,
      })
      errorsByField.set(error.field, fieldErrors)
    })
  })

  return errorsByField
}

/**
 * Create a summary of validation results
 */
export function getValidationSummary(validationResult: ImportValidationResult): {
  status: 'success' | 'warning' | 'error'
  message: string
  details: string[]
} {
  const { valid, totalRows, validRows, invalidRows, warnings } = validationResult

  if (valid && warnings.length === 0) {
    return {
      status: 'success',
      message: `All ${totalRows} rows are valid`,
      details: [],
    }
  }

  if (valid && warnings.length > 0) {
    return {
      status: 'warning',
      message: `All ${totalRows} rows are valid with ${warnings.length} warnings`,
      details: [`${warnings.length} warnings found`],
    }
  }

  const errorsByField = getErrorsByField(validationResult)
  const details: string[] = []

  errorsByField.forEach((errors, field) => {
    details.push(`${field}: ${errors.length} errors`)
  })

  return {
    status: 'error',
    message: `${invalidRows} of ${totalRows} rows have validation errors`,
    details,
  }
}

/**
 * Filter valid rows from parsed data
 */
export function filterValidRows(
  data: ParsedData,
  validationResult: ImportValidationResult
): Record<string, unknown>[] {
  return data.rows.filter((_, index) => !validationResult.errors.has(index))
}

/**
 * Filter invalid rows from parsed data
 */
export function filterInvalidRows(
  data: ParsedData,
  validationResult: ImportValidationResult
): Array<{ row: Record<string, unknown>; index: number; errors: ValidationResult }> {
  const invalidRows: Array<{ row: Record<string, unknown>; index: number; errors: ValidationResult }> = []

  data.rows.forEach((row, index) => {
    const errors = validationResult.errors.get(index)
    if (errors) {
      invalidRows.push({ row, index, errors })
    }
  })

  return invalidRows
}
