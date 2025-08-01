import * as XLSX from 'xlsx'
import type { ColumnConfig, ExportOptions, ImportResult } from './types'

// Interface pour les styles Excel avancés
interface ExcelCellStyle {
  font?: {
    bold?: boolean
    italic?: boolean
    color?: { rgb: string }
    size?: number
  }
  fill?: {
    fgColor: { rgb: string }
  }
  border?: {
    top?: { style: string; color: { rgb: string } }
    bottom?: { style: string; color: { rgb: string } }
    left?: { style: string; color: { rgb: string } }
    right?: { style: string; color: { rgb: string } }
  }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'middle' | 'bottom'
    wrapText?: boolean
  }
  numFmt?: string
}

interface AdvancedExportOptions extends ExportOptions {
  includeStyles?: boolean
  freezeHeader?: boolean
  autoFilter?: boolean
  conditionalFormatting?: boolean
  chartData?: {
    type: 'bar' | 'line' | 'pie'
    columns: string[]
    title?: string
  }
}

/**
 * Utilitaires pour l'export/import Excel
 */
export class ExportUtils {
  /**
   * Exporte les données vers Excel avec formatage avancé
   */
  static exportToExcel<T>(
    data: T[],
    columns: ColumnConfig<T>[],
    options: AdvancedExportOptions
  ): void {
    try {
      // Filtrer les colonnes visibles si demandé
      const exportColumns = options.visibleColumnsOnly
        ? columns.filter((col) => col.visible !== false)
        : columns

      // Préparer les données
      const exportData = data.map((row) => {
        const exportRow: any = {}

        exportColumns.forEach((col) => {
          const key = col.key as string
          let value = (row as any)[key]

          // Traitement spécial pour rich text
          if (col.type === 'richtext' && value) {
            // Nettoyer le HTML et garder seulement le texte pour l'export
            value = ExportUtils.stripHtmlTags(value)
          }

          // Appliquer le formatage si défini
          if (col.format?.transform) {
            value = col.format.transform(value)
          } else if (col.format) {
            value = ExportUtils.formatValue(value, col.format)
          }

          exportRow[col.title] = value
        })

        return exportRow
      })

      // Créer le workbook
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData, {
        header: exportColumns.map((col) => col.title),
      })

      // Améliorations avancées
      ExportUtils.applyAdvancedFormatting(ws, exportColumns, exportData, options)

      // Définir la largeur des colonnes
      const colWidths = exportColumns.map((col) => {
        const maxLength = Math.max(
          col.title.length,
          ...exportData.slice(0, 100).map((row) => String(row[col.title] || '').length)
        )
        return { wch: Math.min(Math.max(maxLength, 10), 50) }
      })
      ws['!cols'] = colWidths

      // Options avancées
      if (options.freezeHeader !== false) {
        ws['!freeze'] = { xSplit: 0, ySplit: 1 }
      }

      if (options.autoFilter !== false) {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
        ws['!autofilter'] = {
          ref: XLSX.utils.encode_range({
            s: { r: 0, c: 0 },
            e: { r: range.e.r, c: range.e.c },
          }),
        }
      }

      // Ajouter la feuille
      XLSX.utils.book_append_sheet(wb, ws, 'Data')

      // Ajouter une feuille de statistiques si demandé
      if (options.includeStyles) {
        ExportUtils.addStatisticsSheet(wb, exportData, exportColumns)
      }

      // Exporter
      const filename = options.filename || `export_${Date.now()}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (_error) {
      throw new Error("Impossible d'exporter les données")
    }
  }

  /**
   * Importe des données depuis Excel
   */
  static importFromExcel<T>(file: File, columns: ColumnConfig<T>[]): Promise<ImportResult<T>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length === 0) {
            resolve({
              success: false,
              data: [],
              errors: [{ row: 0, column: '', message: 'Fichier vide' }],
              warnings: [],
            })
            return
          }

          // Traiter les données
          const result = ExportUtils.processImportData(jsonData as any[][], columns)
          resolve(result)
        } catch (_error) {
          reject(new Error('Impossible de lire le fichier Excel'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Erreur de lecture du fichier'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Traite les données importées et les valide
   */
  private static processImportData<T>(
    rawData: any[][],
    columns: ColumnConfig<T>[]
  ): ImportResult<T> {
    const result: ImportResult<T> = {
      success: true,
      data: [],
      errors: [],
      warnings: [],
    }

    if (rawData.length === 0) {
      result.success = false
      result.errors.push({ row: 0, column: '', message: 'Aucune donnée trouvée' })
      return result
    }

    // Première ligne = en-têtes
    const headers = rawData[0] as string[]
    const dataRows = rawData.slice(1)

    // Mapper les colonnes
    const columnMap = ExportUtils.mapColumns(headers, columns)

    // Traiter chaque ligne
    dataRows.forEach((row, index) => {
      const rowNumber = index + 2 // +2 car index commence à 0 et on skip les headers
      const processedRow: any = {}
      let hasErrors = false

      columns.forEach((column) => {
        const columnIndex = columnMap.get(column.id)
        const rawValue = columnIndex !== undefined ? row[columnIndex] : undefined

        // Valider et convertir la valeur
        const validation = ExportUtils.validateAndConvertValue(rawValue, column)

        if (validation.error) {
          result.errors.push({
            row: rowNumber,
            column: column.title,
            message: validation.error,
          })
          hasErrors = true
        } else if (validation.warning) {
          result.warnings.push({
            row: rowNumber,
            column: column.title,
            message: validation.warning,
          })
        }

        processedRow[column.key as string] = validation.value
      })

      if (!hasErrors) {
        result.data.push(processedRow as T)
      }
    })

    if (result.errors.length > 0) {
      result.success = false
    }

    return result
  }

  /**
   * Mappe les colonnes du fichier avec les colonnes configurées
   */
  private static mapColumns<T>(headers: string[], columns: ColumnConfig<T>[]): Map<string, number> {
    const columnMap = new Map<string, number>()

    columns.forEach((column) => {
      // Chercher la colonne par titre exact
      let headerIndex = headers.findIndex(
        (header) => header?.toLowerCase().trim() === column.title.toLowerCase().trim()
      )

      // Si pas trouvé, chercher par correspondance partielle
      if (headerIndex === -1) {
        headerIndex = headers.findIndex(
          (header) =>
            header?.toLowerCase().includes(column.title.toLowerCase()) ||
            column.title.toLowerCase().includes(header?.toLowerCase() || '')
        )
      }

      if (headerIndex !== -1) {
        columnMap.set(column.id, headerIndex)
      }
    })

    return columnMap
  }

  /**
   * Valide et convertit une valeur selon le type de colonne
   */
  private static validateAndConvertValue<T>(
    rawValue: any,
    column: ColumnConfig<T>
  ): { value: any; error?: string; warning?: string } {
    // Valeur vide
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      if (column.required) {
        return { value: null, error: 'Valeur requise' }
      }
      return { value: null }
    }

    try {
      switch (column.type) {
        case 'text':
          return { value: String(rawValue).trim() }

        case 'number': {
          const num = Number(rawValue)
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
          const boolStr = String(rawValue).toLowerCase().trim()
          if (['true', '1', 'oui', 'yes', 'vrai'].includes(boolStr)) {
            return { value: true }
          }
          if (['false', '0', 'non', 'no', 'faux'].includes(boolStr)) {
            return { value: false }
          }
          return { value: null, error: 'Doit être vrai/faux' }
        }

        case 'date':
        case 'datetime': {
          const date = new Date(rawValue)
          if (Number.isNaN(date.getTime())) {
            return { value: null, error: 'Format de date invalide' }
          }
          return { value: date }
        }

        case 'select':
          if (column.options) {
            const option = column.options.find(
              (opt) => String(opt.value) === String(rawValue) || opt.label === String(rawValue)
            )
            if (option) {
              return { value: option.value }
            }
            return {
              value: rawValue,
              warning: `Valeur non reconnue: ${rawValue}`,
            }
          }
          return { value: rawValue }

        default:
          return { value: rawValue }
      }
    } catch (_error) {
      return { value: null, error: 'Erreur de conversion' }
    }
  }

  /**
   * Formate une valeur selon la configuration
   */
  private static formatValue(value: any, format: any): string {
    if (value === null || value === undefined) return ''

    if (format.transform) {
      return format.transform(value)
    }

    if (typeof value === 'number') {
      let formatted = value.toString()

      if (format.decimals !== undefined) {
        formatted = value.toFixed(format.decimals)
      }

      if (format.currency) {
        formatted = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: format.currency,
        }).format(value)
      }

      if (format.prefix) formatted = format.prefix + formatted
      if (format.suffix) formatted = formatted + format.suffix

      return formatted
    }

    if (value instanceof Date && format.dateFormat) {
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: format.dateFormat.includes('time') ? 'short' : 'medium',
        timeStyle: format.dateFormat.includes('time') ? 'short' : undefined,
      }).format(value)
    }

    return String(value)
  }

  /**
   * Applique un formatage avancé à la feuille Excel
   */
  private static applyAdvancedFormatting<T>(
    ws: XLSX.WorkSheet,
    columns: ColumnConfig<T>[],
    _data: any[],
    options: AdvancedExportOptions
  ): void {
    if (!options.includeStyles) return

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

    // Styles pour les en-têtes
    const headerStyle: ExcelCellStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12 },
      fill: { fgColor: { rgb: '366092' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    }

    // Appliquer les styles aux en-têtes
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!ws[cellRef]) continue

      ws[cellRef].s = headerStyle
    }

    // Styles pour les données
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
        if (!ws[cellRef]) continue

        const column = columns[col]
        if (!column) continue

        const cellStyle = ExportUtils.getCellStyle(ws[cellRef].v, column, row)
        ws[cellRef].s = cellStyle

        // Format numérique selon le type
        if (column.type === 'number' && column.format) {
          ws[cellRef].z = ExportUtils.getNumberFormat(column.format)
        } else if (column.type === 'date') {
          ws[cellRef].z = 'dd/mm/yyyy'
        } else if (column.type === 'datetime') {
          ws[cellRef].z = 'dd/mm/yyyy hh:mm'
        }
      }
    }

    // Formatage conditionnel pour les nombres
    if (options.conditionalFormatting) {
      ExportUtils.applyConditionalFormatting(ws, columns, range)
    }
  }

  /**
   * Détermine le style d'une cellule selon sa valeur et sa colonne
   */
  private static getCellStyle<T>(value: any, column: ColumnConfig<T>, row: number): ExcelCellStyle {
    const baseStyle: ExcelCellStyle = {
      alignment: { vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'E0E0E0' } },
        bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
        left: { style: 'thin', color: { rgb: 'E0E0E0' } },
        right: { style: 'thin', color: { rgb: 'E0E0E0' } },
      },
    }

    // Alternance des couleurs de lignes
    if (row % 2 === 0) {
      baseStyle.fill = { fgColor: { rgb: 'F8F9FA' } }
    }

    // Styles spécifiques selon le type
    switch (column.type) {
      case 'number':
        baseStyle.alignment!.horizontal = 'right'
        if (typeof value === 'number') {
          if (value < 0) {
            baseStyle.font = { color: { rgb: 'DC3545' } } // Rouge pour négatif
          } else if (value > 1000) {
            baseStyle.font = { color: { rgb: '28A745' } } // Vert pour gros nombres
          }
        }
        break

      case 'boolean':
        baseStyle.alignment!.horizontal = 'center'
        if (value === true) {
          baseStyle.font = { color: { rgb: '28A745' }, bold: true }
        } else if (value === false) {
          baseStyle.font = { color: { rgb: 'DC3545' }, bold: true }
        }
        break

      case 'select':
        if (column.options) {
          const option = column.options.find((opt) => opt.value === value)
          if (option?.color) {
            const rgbColor = option.color.replace('#', '')
            baseStyle.fill = { fgColor: { rgb: rgbColor } }
            // Texte blanc si couleur sombre
            const isDark = ExportUtils.isColorDark(rgbColor)
            if (isDark) {
              baseStyle.font = { color: { rgb: 'FFFFFF' } }
            }
          }
        }
        baseStyle.alignment!.horizontal = 'center'
        break

      case 'date':
      case 'datetime':
        baseStyle.alignment!.horizontal = 'center'
        break

      default:
        baseStyle.alignment!.horizontal = 'left'
    }

    return baseStyle
  }

  /**
   * Applique un formatage conditionnel
   */
  private static applyConditionalFormatting(
    ws: XLSX.WorkSheet,
    columns: ColumnConfig[],
    range: XLSX.Range
  ): void {
    // Exemple de formatage conditionnel pour les colonnes numériques
    columns.forEach((column, colIndex) => {
      if (column.type !== 'number') return

      const values: number[] = []
      for (let row = 1; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: colIndex })
        if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
          values.push(ws[cellRef].v)
        }
      }

      if (values.length === 0) return

      const min = Math.min(...values)
      const max = Math.max(...values)
      const _avg = values.reduce((a, b) => a + b, 0) / values.length

      // Appliquer des couleurs basées sur les percentiles
      for (let row = 1; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: colIndex })
        if (!ws[cellRef] || typeof ws[cellRef].v !== 'number') continue

        const value = ws[cellRef].v
        const percentile = (value - min) / (max - min)

        if (percentile <= 0.33) {
          // 33% inférieur - rouge clair
          ws[cellRef].s = {
            ...ws[cellRef].s,
            fill: { fgColor: { rgb: 'FFEBEE' } },
          }
        } else if (percentile >= 0.67) {
          // 33% supérieur - vert clair
          ws[cellRef].s = {
            ...ws[cellRef].s,
            fill: { fgColor: { rgb: 'E8F5E8' } },
          }
        }
      }
    })
  }

  /**
   * Génère le format numérique Excel
   */
  private static getNumberFormat(format: any): string {
    if (format.currency) {
      return format.decimals !== undefined
        ? `"${format.currency}"#,##0.${'0'.repeat(format.decimals)}`
        : `"${format.currency}"#,##0`
    }

    if (format.decimals !== undefined) {
      return `#,##0.${'0'.repeat(format.decimals)}`
    }

    return '#,##0'
  }

  /**
   * Détermine si une couleur est sombre
   */
  private static isColorDark(rgb: string): boolean {
    const r = parseInt(rgb.substr(0, 2), 16)
    const g = parseInt(rgb.substr(2, 2), 16)
    const b = parseInt(rgb.substr(4, 2), 16)

    // Formule de luminosité
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
  }

  /**
   * Ajoute une feuille de statistiques
   */
  private static addStatisticsSheet<T>(
    wb: XLSX.WorkBook,
    data: any[],
    columns: ColumnConfig<T>[]
  ): void {
    const stats: any[] = []

    // En-tête
    stats.push(['Statistiques des données', '', '', ''])
    stats.push(['Colonne', 'Type', 'Total lignes', 'Valeurs uniques', 'Valeurs vides'])

    columns.forEach((column) => {
      const values = data
        .map((row) => row[column.title])
        .filter((v) => v !== null && v !== undefined && v !== '')
      const uniqueValues = new Set(values)
      const emptyCount = data.length - values.length

      let additionalInfo = ''
      if (column.type === 'number') {
        const numbers = values.filter((v) => typeof v === 'number')
        if (numbers.length > 0) {
          const sum = numbers.reduce((a, b) => a + b, 0)
          const avg = sum / numbers.length
          const min = Math.min(...numbers)
          const max = Math.max(...numbers)
          additionalInfo = `Min: ${min}, Max: ${max}, Moy: ${avg.toFixed(2)}`
        }
      }

      stats.push([
        column.title,
        column.type,
        data.length,
        uniqueValues.size,
        emptyCount,
        additionalInfo,
      ])
    })

    // Créer la feuille de stats
    const statsWs = XLSX.utils.aoa_to_sheet(stats)

    // Formatter la feuille de stats
    const statsRange = XLSX.utils.decode_range(statsWs['!ref'] || 'A1')

    // Titre principal
    statsWs.A1.s = {
      font: { bold: true, size: 14, color: { rgb: '366092' } },
      alignment: { horizontal: 'center' },
    }

    // En-têtes
    for (let col = 0; col <= statsRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 1, c: col })
      if (statsWs[cellRef]) {
        statsWs[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E9ECEF' } },
          alignment: { horizontal: 'center' },
        }
      }
    }

    // Largeurs des colonnes
    statsWs['!cols'] = [
      { wch: 20 }, // Colonne
      { wch: 10 }, // Type
      { wch: 12 }, // Total
      { wch: 15 }, // Uniques
      { wch: 12 }, // Vides
      { wch: 30 }, // Info supplémentaire
    ]

    XLSX.utils.book_append_sheet(wb, statsWs, 'Statistiques')
  }

  /**
   * Exporte vers CSV
   */
  static exportToCSV<T>(
    data: T[],
    columns: ColumnConfig<T>[],
    options: AdvancedExportOptions
  ): void {
    try {
      // Filtrer les colonnes visibles si demandé
      const exportColumns = options.visibleColumnsOnly
        ? columns.filter((col) => col.visible !== false)
        : columns

      // Préparer les données
      const csvData: string[][] = []

      // En-têtes
      if (options.includeHeaders) {
        csvData.push(exportColumns.map((col) => col.title))
      }

      // Données
      data.forEach((row) => {
        const csvRow = exportColumns.map((col) => {
          const key = col.key as string
          let value = (row as any)[key]

          // Traitement spécial pour rich text
          if (col.type === 'richtext' && value) {
            value = ExportUtils.stripHtmlTags(value)
          }

          // Appliquer le formatage si défini
          if (col.format?.transform) {
            value = col.format.transform(value)
          } else if (col.format) {
            value = ExportUtils.formatValue(value, col.format)
          }

          // Convertir en chaîne et échapper les guillemets
          const strValue = String(value ?? '')
          return strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')
            ? `"${strValue.replace(/"/g, '""')}"`
            : strValue
        })
        csvData.push(csvRow)
      })

      // Générer le contenu CSV
      const csvContent = csvData.map((row) => row.join(',')).join('\n')

      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = options.filename || 'export.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (_error) {
      throw new Error("Impossible d'exporter en CSV")
    }
  }

  /**
   * Exporte vers PDF
   */
  static exportToPDF<T>(
    data: T[],
    columns: ColumnConfig<T>[],
    options: AdvancedExportOptions
  ): void {
    try {
      // Filtrer les colonnes visibles si demandé
      const exportColumns = options.visibleColumnsOnly
        ? columns.filter((col) => col.visible !== false)
        : columns

      // Créer le contenu HTML
      let htmlContent = `
        <html>
        <head>
          <meta charset="utf-8">
          <title>Export PDF</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .number { text-align: right; }
            .center { text-align: center; }
            .header { text-align: center; margin-bottom: 20px; }
            .footer { margin-top: 20px; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Export des données</h1>
            <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
            <p>Nombre de lignes: ${data.length} | Colonnes: ${exportColumns.length}</p>
          </div>
          <table>
      `

      // En-têtes
      if (options.includeHeaders) {
        htmlContent += '<thead><tr>'
        exportColumns.forEach((col) => {
          htmlContent += `<th>${col.title}</th>`
        })
        htmlContent += '</tr></thead>'
      }

      // Données
      htmlContent += '<tbody>'
      data.forEach((row, index) => {
        htmlContent += `<tr>${index % 2 === 0 ? '' : ' class="even"'}`

        exportColumns.forEach((col) => {
          const key = col.key as string
          let value = (row as any)[key]

          // Traitement spécial pour rich text - garder le HTML pour PDF
          if (col.type === 'richtext' && value) {
            // Pour PDF, on garde le HTML mais on le nettoie un peu
            value = value
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          }

          // Appliquer le formatage si défini
          if (col.format?.transform) {
            value = col.format.transform(value)
          } else if (col.format) {
            value = ExportUtils.formatValue(value, col.format)
          }

          // Classes CSS selon le type
          let className = ''
          if (col.type === 'number') className = 'number'
          else if (col.type === 'boolean' || col.type === 'select') className = 'center'

          htmlContent += `<td class="${className}">${String(value ?? '')}</td>`
        })

        htmlContent += '</tr>'
      })
      htmlContent += '</tbody></table>'

      htmlContent += `
          <div class="footer">
            <p>Export généré par le système DataTable</p>
          </div>
        </body>
        </html>
      `

      // Ouvrir dans une nouvelle fenêtre pour impression/sauvegarde
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Attendre le chargement puis lancer l'impression
        printWindow.onload = () => {
          printWindow.focus()
          printWindow.print()
        }
      }
    } catch (_error) {
      throw new Error("Impossible d'exporter en PDF")
    }
  }

  /**
   * Supprime les balises HTML et garde seulement le texte
   */
  private static stripHtmlTags(html: string): string {
    if (!html || typeof html !== 'string') return ''

    // Créer un élément temporaire pour extraire le texte
    const temp = document.createElement('div')
    temp.innerHTML = html

    // Remplacer certaines balises par des retours à la ligne ou espaces
    temp.innerHTML = temp.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')

    // Extraire le texte et nettoyer les espaces
    const text = temp.textContent || temp.innerText || ''
    return text
      .replace(/\n\s*\n/g, '\n') // Supprimer les lignes vides multiples
      .replace(/^\s+|\s+$/g, '') // Trim
  }
}
