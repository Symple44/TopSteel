import type { JsonValue } from '../../../types/common'
import type { ColumnConfig } from './types'

/**
 * Utilitaires pour le copier-coller depuis/vers Excel
 */
export class ClipboardUtils {
  /**
   * Parse des données tabulaires depuis le presse-papier (Excel/CSV)
   */
  static parseClipboardData(clipboardText: string): string[][] {
    const lines = clipboardText.split(/\r?\n/)
    return lines
      .filter((line) => line.trim()) // Supprimer les lignes vides
      .map((line) => {
        // Gérer les cellules avec virgules (CSV) et tabulations (Excel)
        if (line.includes('\t')) {
          return line.split('\t')
        } else {
          return ClipboardUtils.parseCSVLine(line)
        }
      })
  }

  /**
   * Parse une ligne CSV en gérant les guillemets et virgules
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  /**
   * Convertit des données en format clipboard (TSV pour Excel)
   */
  static dataToClipboard<T>(data: T[], columns: ColumnConfig<T>[]): string {
    // En-têtes
    const headers = columns.map((col) => col.title).join('\t')

    // Données
    const rows = data.map((row) => {
      return columns
        .map((col) => {
          const value = (row as any)[col.key]
          return ClipboardUtils.formatCellForClipboard(value, col)
        })
        .join('\t')
    })

    return [headers, ...rows].join('\n')
  }

  /**
   * Formate une cellule pour le presse-papier
   */
  private static formatCellForClipboard<T>(value: JsonValue, column: ColumnConfig<T>): string {
    if (value === null || value === undefined) return ''

    // Appliquer le formatage de colonne si défini
    if (column.format?.transform) {
      return column.format.transform(value)
    }

    // Formatage par type
    switch (column.type) {
      case 'number':
        return typeof value === 'number' ? value.toString() : '0'

      case 'date':
        return value instanceof Date ? value.toISOString().split('T')[0] : String(value)

      case 'datetime':
        return value instanceof Date ? value.toISOString() : String(value)

      case 'boolean':
        return value ? 'TRUE' : 'FALSE'

      default:
        return String(value)
    }
  }

  /**
   * Valide et convertit des données collées selon les colonnes
   */
  static validatePastedData<T>(
    pastedData: string[][],
    columns: ColumnConfig<T>[],
    hasHeaders: boolean = true
  ): {
    data: Partial<T>[]
    errors: Array<{ row: number; column: string; message: string }>
    warnings: Array<{ row: number; column: string; message: string }>
  } {
    const result = {
      data: [] as Partial<T>[],
      errors: [] as Array<{ row: number; column: string; message: string }>,
      warnings: [] as Array<{ row: number; column: string; message: string }>,
    }

    if (pastedData.length === 0) {
      return result
    }

    const dataRows = hasHeaders ? pastedData.slice(1) : pastedData
    const headers = hasHeaders ? pastedData[0] : null

    // Mapper les colonnes avec les en-têtes collés
    const columnMap = ClipboardUtils.mapColumnsToHeaders(columns, headers)

    dataRows.forEach((row, rowIndex) => {
      const actualRowIndex = hasHeaders ? rowIndex + 2 : rowIndex + 1 // +1 car 0-based
      const processedRow: Partial<T> = {}

      columns.forEach((column, colIndex) => {
        const sourceIndex = columnMap.get(column.id) ?? colIndex
        const rawValue = row[sourceIndex]

        try {
          const validationResult = ClipboardUtils.validateAndConvertValue(rawValue, column)

          if (validationResult.error) {
            result.errors.push({
              row: actualRowIndex,
              column: column.title,
              message: validationResult.error,
            })
          } else if (validationResult.warning) {
            result.warnings.push({
              row: actualRowIndex,
              column: column.title,
              message: validationResult.warning,
            })
          }

          ;(processedRow as any)[column.key] = validationResult.value
        } catch (_error) {
          result.errors.push({
            row: actualRowIndex,
            column: column.title,
            message: 'Erreur de conversion',
          })
        }
      })

      result.data.push(processedRow)
    })

    return result
  }

  /**
   * Mappe les colonnes avec les en-têtes du presse-papier
   */
  private static mapColumnsToHeaders<T>(
    columns: ColumnConfig<T>[],
    headers: string[] | null
  ): Map<string, number> {
    const map = new Map<string, number>()

    if (!headers) {
      // Mapping séquentiel si pas d'en-têtes
      columns.forEach((col, index) => {
        map.set(col.id, index)
      })
      return map
    }

    columns.forEach((column) => {
      // Chercher correspondance exacte
      let headerIndex = headers.findIndex(
        (header) => header?.toLowerCase().trim() === column.title.toLowerCase().trim()
      )

      // Chercher correspondance partielle
      if (headerIndex === -1) {
        headerIndex = headers.findIndex(
          (header) =>
            header?.toLowerCase().includes(column.title.toLowerCase()) ||
            column.title.toLowerCase().includes(header?.toLowerCase() || '')
        )
      }

      if (headerIndex !== -1) {
        map.set(column.id, headerIndex)
      }
    })

    return map
  }

  /**
   * Valide et convertit une valeur selon le type de colonne
   */
  private static validateAndConvertValue<T>(
    rawValue: string | undefined,
    column: ColumnConfig<T>
  ): { value: JsonValue; error?: string; warning?: string } {
    // Valeur vide
    if (!rawValue || rawValue.trim() === '') {
      if (column.required) {
        return { value: null, error: 'Valeur requise' }
      }
      return { value: null }
    }

    const trimmedValue = rawValue.trim()

    try {
      switch (column.type) {
        case 'text':
          if (column.validation?.pattern && !column.validation.pattern.test(trimmedValue)) {
            return { value: trimmedValue, error: 'Format invalide' }
          }
          return { value: trimmedValue }

        case 'number': {
          // Gérer les formats numériques avec espaces/virgules
          const cleanNumber = trimmedValue.replace(/[^\d.,-]/g, '').replace(',', '.')
          const num = Number(cleanNumber)

          if (Number.isNaN(num)) {
            return { value: null, error: 'Doit être un nombre' }
          }

          if (column.validation?.min !== undefined && num < column.validation.min) {
            return { value: num, error: `Minimum: ${column.validation.min}` }
          }

          if (column.validation?.max !== undefined && num > column.validation.max) {
            return { value: num, error: `Maximum: ${column.validation.max}` }
          }

          return { value: num }
        }

        case 'boolean': {
          const boolStr = trimmedValue.toLowerCase()
          if (['true', '1', 'oui', 'yes', 'vrai', 'o'].includes(boolStr)) {
            return { value: true }
          }
          if (['false', '0', 'non', 'no', 'faux', 'n'].includes(boolStr)) {
            return { value: false }
          }
          return { value: null, error: 'Doit être vrai/faux' }
        }

        case 'date': {
          const date = ClipboardUtils.parseDate(trimmedValue)
          if (!date) {
            return { value: null, error: 'Format de date invalide' }
          }
          return { value: date.toISOString() }
        }

        case 'datetime': {
          const datetime = new Date(trimmedValue)
          if (Number.isNaN(datetime.getTime())) {
            return { value: null, error: 'Format de date/heure invalide' }
          }
          return { value: datetime.toISOString() }
        }

        case 'select':
          if (column.options) {
            const option = column.options.find(
              (opt) =>
                String(opt.value).toLowerCase() === trimmedValue.toLowerCase() ||
                opt.label.toLowerCase() === trimmedValue.toLowerCase()
            )
            if (option) {
              const value = option.value instanceof Date ? option.value.toISOString() : option.value
              return { value: value ?? null }
            }
            return {
              value: trimmedValue,
              warning: `Option non reconnue: ${trimmedValue}`,
            }
          }
          return { value: trimmedValue }

        default:
          return { value: trimmedValue }
      }
    } catch (_error) {
      return { value: null, error: 'Erreur de conversion' }
    }
  }

  /**
   * Parse une date dans différents formats
   */
  private static parseDate(dateStr: string): Date | null {
    // Formats supportés
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY
    ]

    for (const format of formats) {
      if (format.test(dateStr)) {
        const date = new Date(dateStr)
        if (!Number.isNaN(date.getTime())) {
          return date
        }
      }
    }

    // Essayer le parsing natif
    const date = new Date(dateStr)
    return Number.isNaN(date.getTime()) ? null : date
  }

  /**
   * Copie des données dans le presse-papier
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // Fallback pour navigateurs plus anciens
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const success = document.execCommand('copy')
        document.body.removeChild(textArea)
        return success
      }
    } catch (_error) {
      return false
    }
  }

  /**
   * Lit le contenu du presse-papier
   * Note: Cette fonction nécessite une action utilisateur (Ctrl+V)
   */
  static async readFromClipboard(): Promise<string | null> {
    try {
      // Essayer d'utiliser l'API Clipboard moderne
      if (navigator.clipboard && window.isSecureContext) {
        try {
          return await navigator.clipboard.readText()
        } catch (_clipboardError) {
          return null
        }
      }
      return null
    } catch (_error) {
      return null
    }
  }

  /**
   * Gestionnaire pour l'événement paste - plus fiable
   */
  static handlePasteEvent(event: ClipboardEvent): string | null {
    if (event.clipboardData) {
      // Essayer d'obtenir le texte depuis l'événement paste
      const text = event.clipboardData.getData('text/plain')
      return text || null
    }
    return null
  }
}
