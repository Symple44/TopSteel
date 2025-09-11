import type { ColumnConfig } from './types'

/**
 * Valide une valeur selon la configuration de colonne
 */
export function validateValue<T>(
  value: unknown,
  column: ColumnConfig<T>,
  row?: T
): { isValid: boolean; error?: string; warning?: string; convertedValue?: unknown } {
  // Validation vide/requis
  if (value === null || value === undefined || value === '') {
    if (column.required) {
      return { isValid: false, error: 'Valeur requise' }
    }
    return { isValid: true, convertedValue: null }
  }

  try {
    // Validation selon le type
    const typeValidation = validateByType(value, column)
    if (!typeValidation.isValid) {
      return typeValidation
    }

    // Validation personnalisée
    if (column.validation?.custom && row) {
      const customError = column.validation.custom(typeValidation.convertedValue)
      if (customError) {
        return { isValid: false, error: customError }
      }
    }

    // Callback de validation de colonne
    if (column.onValidate && row) {
      const validateError = column.onValidate(typeValidation.convertedValue, row, column)
      if (validateError) {
        return { isValid: false, error: validateError }
      }
    }

    return typeValidation
  } catch (_error) {
    return { isValid: false, error: 'Erreur de validation' }
  }
}

/**
 * Validation selon le type de colonne
 */
function validateByType<T>(
  value: unknown,
  column: ColumnConfig<T>
): { isValid: boolean; error?: string; warning?: string; convertedValue?: unknown } {
  switch (column.type) {
    case 'text':
      return validateText(value, column)

    case 'number':
      return validateNumber(value, column)

    case 'boolean':
      return validateBoolean(value, column)

    case 'date':
    case 'datetime':
      return validateDate(value, column)

    case 'select':
      return validateSelect(value, column)

    case 'multiselect':
      return validateMultiSelect(value, column)

    default:
      return { isValid: true, convertedValue: value }
  }
}

/**
 * Validation du type text
 */
function validateText<T>(
    value: unknown,
    column: ColumnConfig<T>
  ): { isValid: boolean; error?: string; convertedValue?: string } {
    const strValue = String(value).trim()

    // Validation pattern regex
    if (column.validation?.pattern && !column.validation.pattern.test(strValue)) {
      return { isValid: false, error: 'Format invalide' }
    }

    // Validation longueur
    if (column.validation?.minLength && strValue.length < column.validation.minLength) {
      return { isValid: false, error: `Minimum ${column.validation.minLength} caractères` }
    }

    if (column.validation?.maxLength && strValue.length > column.validation.maxLength) {
      return { isValid: false, error: `Maximum ${column.validation.maxLength} caractères` }
    }

    return { isValid: true, convertedValue: strValue }
  }

/**
 * Validation du type number
 */
function validateNumber<T>(
    value: unknown,
    column: ColumnConfig<T>
  ): { isValid: boolean; error?: string; convertedValue?: number } {
    let numValue: number

    if (typeof value === 'string') {
      // Nettoyer les formats numériques avec espaces/virgules
      const cleanValue = value.replace(/[^\d.,-]/g, '').replace(',', '.')
      numValue = parseFloat(cleanValue)
    } else {
      numValue = Number(value)
    }

    if (Number.isNaN(numValue)) {
      return { isValid: false, error: 'Doit être un nombre' }
    }

    // Validation min/max
    if (column.validation?.min !== undefined && numValue < column.validation.min) {
      return { isValid: false, error: `Minimum: ${column.validation.min}` }
    }

    if (column.validation?.max !== undefined && numValue > column.validation.max) {
      return { isValid: false, error: `Maximum: ${column.validation.max}` }
    }

    return { isValid: true, convertedValue: numValue }
  }

/**
 * Validation du type boolean
 */
function validateBoolean<T>(
    value: unknown,
    _column: ColumnConfig<T>
  ): { isValid: boolean; error?: string; convertedValue?: boolean } {
    if (typeof value === 'boolean') {
      return { isValid: true, convertedValue: value }
    }

    const strValue = String(value).toLowerCase().trim()

    if (['true', '1', 'oui', 'yes', 'vrai', 'o'].includes(strValue)) {
      return { isValid: true, convertedValue: true }
    }

    if (['false', '0', 'non', 'no', 'faux', 'n', ''].includes(strValue)) {
      return { isValid: true, convertedValue: false }
    }

    return { isValid: false, error: 'Doit être vrai/faux' }
  }

/**
 * Validation du type date
 */
function validateDate<T>(
    value: unknown,
    _column: ColumnConfig<T>
  ): { isValid: boolean; error?: string; convertedValue?: Date } {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return { isValid: false, error: 'Date invalide' }
      }
      return { isValid: true, convertedValue: value }
    }

    const dateValue = new Date(value as string | number | Date)
    if (Number.isNaN(dateValue.getTime())) {
      return { isValid: false, error: 'Format de date invalide' }
    }

    return { isValid: true, convertedValue: dateValue }
  }

/**
 * Validation du type select
 */
function validateSelect<T>(
    value: unknown,
    column: ColumnConfig<T>
  ): { isValid: boolean; error?: string; warning?: string; convertedValue?: unknown } {
    if (!column.options || column.options.length === 0) {
      return { isValid: true, convertedValue: value }
    }

    const option = column.options.find(
      (opt) =>
        opt.value === value ||
        String(opt.value).toLowerCase() === String(value).toLowerCase() ||
        opt.label.toLowerCase() === String(value).toLowerCase()
    )

    if (option) {
      return { isValid: true, convertedValue: option.value }
    }

    // Si l'option n'est pas trouvée, on accepte la valeur mais on émet un warning
    // Cela permet d'avoir des données cohérentes même si les options changent
    return {
      isValid: true,
      convertedValue: value,
      warning: `Option non reconnue: ${value}`,
    }
  }

/**
 * Validation du type multiselect
 */
function validateMultiSelect<T>(
    value: unknown,
    column: ColumnConfig<T>
  ): { isValid: boolean; error?: string; warning?: string; convertedValue?: unknown[] } {
    if (!Array.isArray(value)) {
      // Tenter de parser si c'est une string
      if (typeof value === 'string') {
        const parsed = value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v)
        return validateMultiSelect(parsed, column)
      }
      return { isValid: false, error: 'Doit être une liste' }
    }

    if (!column.options || column.options.length === 0) {
      return { isValid: true, convertedValue: value }
    }

    const validValues: unknown[] = []
    const warnings: string[] = []

    for (const val of value) {
      const option = column.options.find(
        (opt) =>
          opt.value === val ||
          String(opt.value).toLowerCase() === String(val).toLowerCase() ||
          opt.label.toLowerCase() === String(val).toLowerCase()
      )

      if (option) {
        validValues.push(option.value)
      } else {
        validValues.push(val)
        warnings.push(`Option non reconnue: ${val}`)
      }
    }

    return {
      isValid: true,
      convertedValue: validValues,
      warning: warnings.length > 0 ? warnings.join(', ') : undefined,
    }
  }

/**
 * Formate une valeur pour l'affichage selon le type
 */
export function formatValueForDisplay<T>(value: unknown, column: ColumnConfig<T>): string {
    if (value === null || value === undefined) return ''

    // Formatage personnalisé
    if (column.format?.transform) {
      return column.format.transform(value)
    }

    switch (column.type) {
      case 'number':
        if (typeof value === 'number') {
          let formatted = value.toString()

          if (column.format?.decimals !== undefined) {
            formatted = value.toFixed(column.format.decimals)
          }

          if (column.format?.currency) {
            return new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: column.format.currency,
            }).format(value)
          }

          if (column.format?.prefix) formatted = column.format.prefix + formatted
          if (column.format?.suffix) formatted = formatted + column.format.suffix

          return formatted
        }
        break

      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('fr-FR')
        }
        if (typeof value === 'string' && value) {
          const date = new Date(value)
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleDateString('fr-FR')
          }
        }
        break

      case 'datetime':
        if (value instanceof Date) {
          return value.toLocaleString('fr-FR')
        }
        if (typeof value === 'string' && value) {
          const date = new Date(value)
          if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString('fr-FR')
          }
        }
        break

      case 'boolean':
        return value ? 'Oui' : 'Non'

      case 'select':
        if (column.options) {
          const option = column.options.find((opt) => opt.value === value)
          return option ? option.label : String(value)
        }
        break

      case 'multiselect':
        if (Array.isArray(value) && column.options) {
          return value
            .map((val) => {
              const option = column.options?.find((opt) => opt.value === val)
              return option ? option.label : String(val)
            })
            .join(', ')
        }
        break
    }

    return String(value)
  }

/**
 * Obtient le type d'input HTML approprié pour une colonne
 */
export function getInputType<T>(column: ColumnConfig<T>): string {
    switch (column.type) {
      case 'number':
        return 'number'
      case 'date':
        return 'date'
      case 'datetime':
        return 'datetime-local'
      case 'boolean':
        return 'checkbox'
      default:
        return 'text'
    }
  }

/**
 * Export groupé pour compatibilité avec l'ancien code utilisant ValidationUtils
 */
export const ValidationUtils = {
  validateValue,
  formatValueForDisplay,
  getInputType
}
