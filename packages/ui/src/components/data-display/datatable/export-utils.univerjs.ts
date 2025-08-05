import { Univer, UniverInstanceType, UniverSheet } from '@univerjs/core'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula'
import { UniverRenderEnginePlugin } from '@univerjs/engine-render'
import { UniverSheetsUIPlugin } from '@univerjs/ui'
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

// Interface pour correspondre aux structures Univer
interface UniverWorkbookData {
  id: string
  sheetOrder: string[]
  name: string
  sheets: Record<string, UniverSheetData>
}

interface UniverSheetData {
  id: string
  name: string
  cellData: Record<string, Record<string, UniverCellData>>
  rowData: Record<string, { h: number }>
  columnData: Record<string, { w: number }>
  mergeData: any[]
  rowCount: number
  columnCount: number
  freeze?: {
    xSplit: number
    ySplit: number
  }
  filter?: {
    range: {
      startRow: number
      endRow: number
      startColumn: number
      endColumn: number
    }
  }
}

interface UniverCellData {
  v?: any // value
  t?: number // type (1=string, 2=number, 3=boolean, 4=date)
  s?: any // style
  f?: string // formula
}

/**
 * Utilitaires pour l'export/import Excel
 */
export class ExportUtils {
  private static univerInstance: Univer | null = null

  /**
   * Initialise l'instance Univer (singleton)
   */
  private static getUniverInstance(): Univer {
    if (!ExportUtils.univerInstance) {
      ExportUtils.univerInstance = new Univer({
        theme: 'default',
        locale: 'fr-FR',
      })

      // Registrer les plugins nécessaires
      ExportUtils.univerInstance.registerPlugin(UniverRenderEnginePlugin)
      ExportUtils.univerInstance.registerPlugin(UniverFormulaEnginePlugin)
      ExportUtils.univerInstance.registerPlugin(UniverSheetsPlugin)
      ExportUtils.univerInstance.registerPlugin(UniverSheetsUIPlugin)
    }

    return ExportUtils.univerInstance
  }

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

      // Créer les données du workbook Univer
      const workbookData = ExportUtils.createUniverWorkbookData(exportData, exportColumns, options)

      // Créer l'instance Univer et le workbook
      const univer = ExportUtils.getUniverInstance()
      const univerSheet = univer.createUniverSheet(workbookData)

      // Appliquer les améliorations avancées
      ExportUtils.applyAdvancedFormatting(univerSheet, exportColumns, exportData, options)

      // Définir la largeur des colonnes
      ExportUtils.setColumnWidths(univerSheet, exportColumns, exportData)

      // Options avancées
      if (options.freezeHeader !== false) {
        ExportUtils.setFreezeHeader(univerSheet)
      }

      if (options.autoFilter !== false) {
        ExportUtils.setAutoFilter(univerSheet, exportData.length, exportColumns.length)
      }

      // Ajouter une feuille de statistiques si demandé
      if (options.includeStyles) {
        ExportUtils.addStatisticsSheet(univerSheet, exportData, exportColumns)
      }

      // Exporter vers fichier Excel
      const filename = options.filename || `export_${Date.now()}.xlsx`
      ExportUtils.exportUniverToFile(univerSheet, filename)
    } catch (_error) {
      throw new Error("Impossible d'exporter les données")
    }
  }

  /**
   * Crée les données de workbook Univer à partir des données exportées
   */
  private static createUniverWorkbookData<T>(
    exportData: any[],
    exportColumns: ColumnConfig<T>[],
    _options: AdvancedExportOptions
  ): UniverWorkbookData {
    const sheetId = 'sheet1'
    const cellData: Record<string, Record<string, UniverCellData>> = {}

    // En-têtes (ligne 0)
    const headerRow: Record<string, UniverCellData> = {}
    exportColumns.forEach((col, colIndex) => {
      headerRow[colIndex.toString()] = {
        v: col.title,
        t: 1, // string
        s: ExportUtils.getHeaderStyle()
      }
    })
    cellData['0'] = headerRow

    // Données (lignes 1+)
    exportData.forEach((row, rowIndex) => {
      const dataRow: Record<string, UniverCellData> = {}
      exportColumns.forEach((col, colIndex) => {
        const value = row[col.title]
        const cellData = ExportUtils.convertValueToUniverCell(value, col, rowIndex + 1)
        dataRow[colIndex.toString()] = cellData
      })
      cellData[(rowIndex + 1).toString()] = dataRow
    })

    // Calculer les dimensions des colonnes
    const columnData: Record<string, { w: number }> = {}
    exportColumns.forEach((col, index) => {
      const maxLength = Math.max(
        col.title.length,
        ...exportData.slice(0, 100).map((row) => String(row[col.title] || '').length)
      )
      columnData[index.toString()] = { w: Math.min(Math.max(maxLength * 8, 80), 400) }
    })

    return {
      id: 'workbook1',
      name: 'Export',
      sheetOrder: [sheetId],
      sheets: {
        [sheetId]: {
          id: sheetId,
          name: 'Data',
          cellData,
          rowData: {},
          columnData,
          mergeData: [],
          rowCount: exportData.length + 1,
          columnCount: exportColumns.length
        }
      }
    }
  }

  /**
   * Convertit une valeur en cellule Univer
   */
  private static convertValueToUniverCell<T>(
    value: any,
    column: ColumnConfig<T>,
    row: number
  ): UniverCellData {
    const cellData: UniverCellData = {}

    if (value === null || value === undefined || value === '') {
      cellData.v = ''
      cellData.t = 1
    } else {
      switch (column.type) {
        case 'number':
          cellData.v = Number(value) || 0
          cellData.t = 2
          break
        case 'boolean':
          cellData.v = Boolean(value)
          cellData.t = 3
          break
        case 'date':
        case 'datetime':
          cellData.v = value instanceof Date ? value : new Date(value)
          cellData.t = 4
          break
        default:
          cellData.v = String(value)
          cellData.t = 1
      }
    }

    // Appliquer les styles
    cellData.s = ExportUtils.getCellStyle(value, column, row)

    return cellData
  }

  /**
   * Obtient le style d'en-tête
   */
  private static getHeaderStyle(): any {
    return {
      bg: { rgb: '#366092' },
      ff: 'Arial',
      fs: 12,
      bl: 1, // bold
      fc: { rgb: '#FFFFFF' },
      ht: 2, // center
      vt: 2, // middle
      bd: {
        t: { s: 1, cl: { rgb: '#000000' } },
        b: { s: 1, cl: { rgb: '#000000' } },
        l: { s: 1, cl: { rgb: '#000000' } },
        r: { s: 1, cl: { rgb: '#000000' } }
      }
    }
  }

  /**
   * Importe des données depuis Excel
   */
  static importFromExcel<T>(file: File, columns: ColumnConfig<T>[]): Promise<ImportResult<T>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer
          const univer = ExportUtils.getUniverInstance()
          
          // Importer le fichier Excel dans Univer
          const workbook = await ExportUtils.importExcelToUniver(univer, buffer)
          
          if (!workbook) {
            resolve({
              success: false,
              data: [],
              errors: [{ row: 0, column: '', message: 'Impossible de lire le fichier Excel' }],
              warnings: []
            })
            return
          }

          // Extraire les données de la première feuille
          const firstSheet = ExportUtils.getFirstSheet(workbook)
          if (!firstSheet) {
            resolve({
              success: false,
              data: [],
              errors: [{ row: 0, column: '', message: 'Aucune feuille trouvée' }],
              warnings: []
            })
            return
          }

          // Convertir les données Univer en format attendu
          const rawData = ExportUtils.extractDataFromUniverSheet(firstSheet)

          if (rawData.length === 0) {
            resolve({
              success: false,
              data: [],
              errors: [{ row: 0, column: '', message: 'Fichier vide' }],
              warnings: []
            })
            return
          }

          // Traiter les données
          const result = ExportUtils.processImportData(rawData, columns)
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
   * Importe un fichier Excel dans Univer
   */
  private static async importExcelToUniver(univer: Univer, buffer: ArrayBuffer): Promise<UniverSheet | null> {
    try {
      // Dans un environnement réel, Univer fournirait une méthode pour importer Excel
      // Pour l'instant, on simule la conversion depuis le buffer
      const workbookData = await ExportUtils.parseExcelBuffer(buffer)
      if (workbookData) {
        return univer.createUniverSheet(workbookData)
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Parse un buffer Excel et le convertit en données Univer
   */
  private static async parseExcelBuffer(buffer: ArrayBuffer): Promise<UniverWorkbookData | null> {
    try {
      // Simulation de parsing Excel - dans un cas réel, Univer fournirait cette fonctionnalité
      // Pour maintenir la compatibilité, on utilise une approche basique
      const view = new DataView(buffer)
      
      // Vérification basique du format Excel (signature)
      if (buffer.byteLength < 8) return null
      
      // Créer une structure de données simulée
      // Dans une vraie implémentation, ceci parserait le format Excel réel
      return {
        id: 'imported-workbook',
        name: 'Imported',
        sheetOrder: ['sheet1'],
        sheets: {
          sheet1: {
            id: 'sheet1',
            name: 'Sheet1',
            cellData: {},
            rowData: {},
            columnData: {},
            mergeData: [],
            rowCount: 0,
            columnCount: 0
          }
        }
      }
    } catch {
      return null
    }
  }

  /**
   * Obtient la première feuille d'un workbook Univer
   */
  private static getFirstSheet(workbook: UniverSheet): UniverSheetData | null {
    try {
      // Récupérer les données de la première feuille
      const sheetData = workbook.getSheetByIndex(0)
      return sheetData || null
    } catch {
      return null
    }
  }

  /**
   * Extrait les données d'une feuille Univer
   */
  private static extractDataFromUniverSheet(sheet: UniverSheetData): any[][] {
    const result: any[][] = []
    
    // Parcourir les données de cellules pour reconstruire le tableau
    const maxRow = sheet.rowCount || 0
    const maxCol = sheet.columnCount || 0
    
    for (let row = 0; row < maxRow; row++) {
      const rowData: any[] = []
      const rowKey = row.toString()
      
      for (let col = 0; col < maxCol; col++) {
        const colKey = col.toString()
        const cellData = sheet.cellData[rowKey]?.[colKey]
        rowData.push(cellData?.v || '')
      }
      
      result.push(rowData)
    }
    
    return result
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
   * Applique un formatage avancé à la feuille Univer
   */
  private static applyAdvancedFormatting<T>(
    univerSheet: UniverSheet,
    columns: ColumnConfig<T>[],
    data: any[],
    options: AdvancedExportOptions
  ): void {
    if (!options.includeStyles) return

    try {
      // Appliquer les styles avancés via l'API Univer
      const worksheet = univerSheet.getActiveSheet()
      if (!worksheet) return

      // Formatage conditionnel pour les nombres
      if (options.conditionalFormatting) {
        ExportUtils.applyConditionalFormattingUniver(worksheet, columns, data)
      }
    } catch {
      // Ignorer les erreurs de formatage
    }
  }

  /**
   * Détermine le style d'une cellule selon sa valeur et sa colonne (version Univer)
   */
  private static getCellStyle<T>(value: any, column: ColumnConfig<T>, row: number): any {
    const baseStyle: any = {
      vt: 2, // vertical middle
      bd: {
        t: { s: 1, cl: { rgb: '#E0E0E0' } },
        b: { s: 1, cl: { rgb: '#E0E0E0' } },
        l: { s: 1, cl: { rgb: '#E0E0E0' } },
        r: { s: 1, cl: { rgb: '#E0E0E0' } }
      }
    }

    // Alternance des couleurs de lignes
    if (row % 2 === 0) {
      baseStyle.bg = { rgb: '#F8F9FA' }
    }

    // Styles spécifiques selon le type
    switch (column.type) {
      case 'number':
        baseStyle.ht = 3 // right align
        if (typeof value === 'number') {
          if (value < 0) {
            baseStyle.fc = { rgb: '#DC3545' } // Rouge pour négatif
          } else if (value > 1000) {
            baseStyle.fc = { rgb: '#28A745' } // Vert pour gros nombres
          }
        }
        break

      case 'boolean':
        baseStyle.ht = 2 // center
        if (value === true) {
          baseStyle.fc = { rgb: '#28A745' }
          baseStyle.bl = 1 // bold
        } else if (value === false) {
          baseStyle.fc = { rgb: '#DC3545' }
          baseStyle.bl = 1 // bold
        }
        break

      case 'select':
        if (column.options) {
          const option = column.options.find((opt) => opt.value === value)
          if (option?.color) {
            const rgbColor = option.color.replace('#', '')
            baseStyle.bg = { rgb: rgbColor }
            // Texte blanc si couleur sombre
            const isDark = ExportUtils.isColorDark(rgbColor)
            if (isDark) {
              baseStyle.fc = { rgb: '#FFFFFF' }
            }
          }
        }
        baseStyle.ht = 2 // center
        break

      case 'date':
      case 'datetime':
        baseStyle.ht = 2 // center
        break

      default:
        baseStyle.ht = 1 // left align
    }

    return baseStyle
  }

  /**
   * Applique un formatage conditionnel pour Univer
   */
  private static applyConditionalFormattingUniver(
    worksheet: any,
    columns: ColumnConfig[],
    data: any[]
  ): void {
    try {
      // Exemple de formatage conditionnel pour les colonnes numériques
      columns.forEach((column, colIndex) => {
        if (column.type !== 'number') return

        const values: number[] = []
        data.forEach((row) => {
          const value = row[column.title]
          if (typeof value === 'number') {
            values.push(value)
          }
        })

        if (values.length === 0) return

        const min = Math.min(...values)
        const max = Math.max(...values)

        // Appliquer des couleurs basées sur les percentiles
        data.forEach((row, rowIndex) => {
          const value = row[column.title]
          if (typeof value !== 'number') return

          const percentile = (value - min) / (max - min)
          let bgColor = '#FFFFFF'

          if (percentile <= 0.33) {
            bgColor = '#FFEBEE' // 33% inférieur - rouge clair
          } else if (percentile >= 0.67) {
            bgColor = '#E8F5E8' // 33% supérieur - vert clair
          }

          // Appliquer le style via l'API Univer
          worksheet.getCell(rowIndex + 1, colIndex).setStyle({
            bg: { rgb: bgColor.replace('#', '') }
          })
        })
      })
    } catch {
      // Ignorer les erreurs de formatage conditionnel
    }
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
   * Définit la largeur des colonnes dans Univer
   */
  private static setColumnWidths<T>(
    univerSheet: UniverSheet,
    exportColumns: ColumnConfig<T>[],
    exportData: any[]
  ): void {
    try {
      const worksheet = univerSheet.getActiveSheet()
      if (!worksheet) return

      exportColumns.forEach((col, index) => {
        const maxLength = Math.max(
          col.title.length,
          ...exportData.slice(0, 100).map((row) => String(row[col.title] || '').length)
        )
        const width = Math.min(Math.max(maxLength * 8, 80), 400)
        worksheet.setColumnWidth(index, width)
      })
    } catch {
      // Ignorer les erreurs de largeur de colonne
    }
  }

  /**
   * Définit le gel d'en-tête dans Univer
   */
  private static setFreezeHeader(univerSheet: UniverSheet): void {
    try {
      const worksheet = univerSheet.getActiveSheet()
      if (!worksheet) return

      worksheet.setFreeze(0, 1) // Geler la première ligne
    } catch {
      // Ignorer les erreurs de gel
    }
  }

  /**
   * Définit l'autofilter dans Univer
   */
  private static setAutoFilter(
    univerSheet: UniverSheet,
    dataRowCount: number,
    columnCount: number
  ): void {
    try {
      const worksheet = univerSheet.getActiveSheet()
      if (!worksheet) return

      worksheet.setAutoFilter({
        startRow: 0,
        endRow: dataRowCount,
        startColumn: 0,
        endColumn: columnCount - 1
      })
    } catch {
      // Ignorer les erreurs d'autofilter
    }
  }

  /**
   * Ajoute une feuille de statistiques dans Univer
   */
  private static addStatisticsSheet<T>(
    univerSheet: UniverSheet,
    data: any[],
    columns: ColumnConfig<T>[]
  ): void {
    try {
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

      // Créer une nouvelle feuille pour les statistiques
      const statsSheetData: UniverSheetData = {
        id: 'stats',
        name: 'Statistiques',
        cellData: {},
        rowData: {},
        columnData: {
          '0': { w: 160 }, // Colonne
          '1': { w: 80 },  // Type
          '2': { w: 96 },  // Total
          '3': { w: 120 }, // Uniques
          '4': { w: 96 },  // Vides
          '5': { w: 240 }  // Info supplémentaire
        },
        mergeData: [],
        rowCount: stats.length,
        columnCount: 6
      }

      // Remplir les données de cellules
      stats.forEach((row, rowIndex) => {
        const rowData: Record<string, UniverCellData> = {}
        row.forEach((cell: any, colIndex: number) => {
          let style: any = {}
          
          if (rowIndex === 0) {
            // Titre principal
            style = {
              ff: 'Arial',
              fs: 14,
              bl: 1,
              fc: { rgb: '#366092' },
              ht: 2
            }
          } else if (rowIndex === 1) {
            // En-têtes
            style = {
              bl: 1,
              bg: { rgb: '#E9ECEF' },
              ht: 2
            }
          }

          rowData[colIndex.toString()] = {
            v: cell,
            t: 1,
            s: style
          }
        })
        statsSheetData.cellData[rowIndex.toString()] = rowData
      })

      // Ajouter la feuille au workbook
      univerSheet.addSheet(statsSheetData)
    } catch {
      // Ignorer les erreurs de création de feuille de stats
    }
  }

  /**
   * Exporte un UniverSheet vers un fichier
   */
  private static exportUniverToFile(univerSheet: UniverSheet, filename: string): void {
    try {
      // Utiliser l'API d'export d'Univer
      univerSheet.exportAsExcel().then((blob: Blob) => {
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }).catch(() => {
        throw new Error("Impossible d'exporter le fichier")
      })
    } catch {
      throw new Error("Impossible d'exporter le fichier")
    }
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