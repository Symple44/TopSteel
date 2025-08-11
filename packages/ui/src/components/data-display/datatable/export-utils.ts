// SSR-compatible Univer imports with client-side detection
let Univer: UniverClass | null = null
let UniverInstanceType: UniverInstanceTypeEnum | null = null
let LocaleType: UniverLocaleType | null = null
let UniverSheetsPlugin: UniverPluginConstructor | null = null
let UniverFormulaEnginePlugin: UniverPluginConstructor | null = null
let UniverRenderEnginePlugin: UniverPluginConstructor | null = null

// Flag to track if we're running on the client side
const isClient = typeof window !== 'undefined'

// Dynamic import function for client-side only
const loadUniverComponents = async (): Promise<boolean> => {
  if (!isClient) {
    return false // Server-side: always return false
  }

  try {
    // Use dynamic imports instead of require for Next.js compatibility
    const [univerCore, univerSheets, univerFormula, univerRender] = await Promise.all([
      import('@univerjs/core').catch(() => null),
      import('@univerjs/sheets').catch(() => null),
      import('@univerjs/engine-formula').catch(() => null),
      import('@univerjs/engine-render').catch(() => null),
    ])

    if (univerCore) {
      Univer = univerCore.Univer as UniverClass
      UniverInstanceType = univerCore.UniverInstanceType as any as UniverInstanceTypeEnum
      LocaleType = univerCore.LocaleType as UniverLocaleType
      // Note: IWorkbookData and IWorksheetData might not be available in all versions
    }

    if (univerSheets) {
      UniverSheetsPlugin = univerSheets.UniverSheetsPlugin as UniverPluginConstructor
    }

    if (univerFormula) {
      UniverFormulaEnginePlugin = univerFormula.UniverFormulaEnginePlugin as UniverPluginConstructor
    }

    if (univerRender) {
      UniverRenderEnginePlugin = univerRender.UniverRenderEnginePlugin as UniverPluginConstructor
    }

    return Univer !== null && UniverSheetsPlugin !== null
  } catch {
    return false
  }
}

// Promise to track Univer loading status
let univerLoadingPromise: Promise<boolean> | null = null

import type { ColumnConfig, ExportOptions, ImportResult } from './types'

// Types pour Univer
interface UniverConfig {
  theme?: unknown
  locale: string
}

interface UniverInstance {
  createUnit(type: number, data: UniverWorkbookData): UniverWorkbook
  registerPlugin(plugin: UniverPlugin): void
}

interface UniverWorkbook {
  getSnapshot(): { sheets: Record<string, UniverSheetData> } | null
  exportAsExcel?(): Promise<Blob>
  save?(filename: string): void
}

type UniverPlugin = {}

interface UniverMergeData {
  startRow: number
  endRow: number
  startColumn: number
  endColumn: number
}

interface UniverCellStyle {
  bg?: { rgb: string }
  ff?: string
  fs?: number
  bl?: number
  fc?: { rgb: string }
  ht?: number
  vt?: number
  bd?: {
    t?: { s: number; cl: { rgb: string } }
    b?: { s: number; cl: { rgb: string } }
    l?: { s: number; cl: { rgb: string } }
    r?: { s: number; cl: { rgb: string } }
  }
}

// Types pour l'import dynamique d'Univer
type UniverClass = new (config?: Partial<UniverConfig>) => UniverInstance
type UniverPluginConstructor = new (...args: unknown[]) => UniverPlugin
type UniverLocaleType = Record<string, string>
type UniverInstanceTypeEnum = Record<string, number>

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
  mergeData: UniverMergeData[]
  rowCount: number
  columnCount: number
  freeze?: {
    startRow: number
    startColumn: number
    ySplit: number
    xSplit: number
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
  v?: string | number | boolean | Date // value
  t?: number // type (1=string, 2=number, 3=boolean, 4=date)
  s?: UniverCellStyle // style
  f?: string // formula
}

/**
 * Utilitaires pour l'export/import Excel avec fallback robuste
 */
export class ExportUtils {
  private static univerInstance: UniverInstance | null = null
  private static univerAvailable = false

  /**
   * Vérifie si Univer est disponible (client-side seulement)
   */
  private static async isUniverAvailable(): Promise<boolean> {
    if (!isClient) {
      return false // Server-side: always return false
    }

    // Load Univer components if not already loaded
    if (!univerLoadingPromise) {
      univerLoadingPromise = loadUniverComponents()
    }

    return await univerLoadingPromise
  }

  /**
   * Initialise l'instance Univer (singleton) avec gestion d'erreur (client-side seulement)
   */
  private static async getUniverInstance(): Promise<UniverInstance | null> {
    if (!isClient) {
      return null // Server-side: always return null
    }

    const univerAvailable = await ExportUtils.isUniverAvailable()
    if (!univerAvailable) {
      return null
    }

    if (!ExportUtils.univerInstance) {
      try {
        if (Univer) {
          ExportUtils.univerInstance = new Univer({
            theme: undefined,
            locale: (LocaleType as Record<string, string>)?.FR_FR || 'fr-FR',
          })
        }

        // Registrer seulement les plugins disponibles
        if (UniverRenderEnginePlugin && ExportUtils.univerInstance) {
          ExportUtils.univerInstance.registerPlugin(new UniverRenderEnginePlugin())
        }
        if (UniverFormulaEnginePlugin && ExportUtils.univerInstance) {
          ExportUtils.univerInstance.registerPlugin(new UniverFormulaEnginePlugin())
        }
        if (UniverSheetsPlugin && ExportUtils.univerInstance) {
          ExportUtils.univerInstance.registerPlugin(new UniverSheetsPlugin())
        }

        ExportUtils.univerAvailable = true
      } catch (_error) {
        ExportUtils.univerInstance = null
        ExportUtils.univerAvailable = false
        return null
      }
    }

    return ExportUtils.univerInstance
  }

  /**
   * Exporte les données vers Excel avec formatage avancé et fallback robuste
   */
  static async exportToExcel<T>(
    data: T[],
    columns: ColumnConfig<T>[],
    options: AdvancedExportOptions
  ): Promise<void> {
    try {
      // Server-side: Always use CSV fallback
      if (!isClient) {
        throw new Error('Export not available on server-side')
      }

      // Filtrer les colonnes visibles si demandé
      const exportColumns = options.visibleColumnsOnly
        ? columns.filter((col) => col.visible !== false)
        : columns

      // Préparer les données
      const exportData = data.map((row) => {
        const exportRow: Record<string, unknown> = {}

        exportColumns.forEach((col) => {
          const key = col.key as string
          let value = (row as Record<string, unknown>)[key]

          // Traitement spécial pour rich text
          if (col.type === 'richtext' && value) {
            // Nettoyer le HTML et garder seulement le texte pour l'export
            value = ExportUtils.stripHtmlTags(String(value))
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

      // Essayer d'utiliser Univer d'abord (client-side seulement)
      const univer = await ExportUtils.getUniverInstance()
      if (univer && ExportUtils.univerAvailable) {
        try {
          await ExportUtils.exportWithUniver(exportData, exportColumns, options)
          return
        } catch (_error) {
          ExportUtils.univerAvailable = false
        }
      }

      // Fallback: Export en CSV avec formatage compatible Excel
      ExportUtils.exportToExcelCompatibleCSV(exportData, exportColumns, options)
    } catch (_error) {
      throw new Error("Impossible d'exporter les données")
    }
  }

  /**
   * Export Univer (méthode privée)
   */
  private static async exportWithUniver<T>(
    exportData: Record<string, unknown>[],
    exportColumns: ColumnConfig<T>[],
    options: AdvancedExportOptions
  ): Promise<void> {
    // Créer les données du workbook Univer
    const workbookData = ExportUtils.createUniverWorkbookData(exportData, exportColumns, options)

    // Créer l'instance Univer et le workbook
    const univer = await ExportUtils.getUniverInstance()
    if (!univer || !UniverInstanceType) {
      throw new Error('Univer not properly initialized')
    }

    const workbook = univer.createUnit(
      (UniverInstanceType as Record<string, number>).UNIVER_SHEET,
      workbookData
    )
    if (!workbook) {
      throw new Error('Failed to create workbook')
    }

    // Appliquer les améliorations avancées
    ExportUtils.applyAdvancedFormatting(workbook, exportColumns, exportData, options)

    // Définir la largeur des colonnes
    ExportUtils.setColumnWidths(workbook, exportColumns, exportData)

    // Options avancées
    if (options.freezeHeader !== false) {
      ExportUtils.setFreezeHeader(workbook)
    }

    if (options.autoFilter !== false) {
      ExportUtils.setAutoFilter(workbook, exportData.length, exportColumns.length)
    }

    // Ajouter une feuille de statistiques si demandé
    if (options.includeStyles) {
      ExportUtils.addStatisticsSheet(workbook, exportData, exportColumns)
    }

    // Exporter vers fichier Excel
    const filename = options.filename || `export_${Date.now()}.xlsx`
    ExportUtils.exportUniverToFile(workbook, filename)
  }

  /**
   * Export en CSV compatible Excel avec BOM UTF-8
   */
  private static exportToExcelCompatibleCSV<T>(
    exportData: Record<string, unknown>[],
    exportColumns: ColumnConfig<T>[],
    options: AdvancedExportOptions
  ): void {
    const csvData: string[][] = []

    // En-têtes
    if (options.includeHeaders !== false) {
      csvData.push(exportColumns.map((col) => col.title))
    }

    // Données
    exportData.forEach((row) => {
      const csvRow = exportColumns.map((col) => {
        const value = row[col.title]
        const strValue = String(value ?? '')
        // Échapper les guillemets et virgules pour CSV
        return strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')
          ? `"${strValue.replace(/"/g, '""')}"`
          : strValue
      })
      csvData.push(csvRow)
    })

    // Générer le contenu CSV avec BOM UTF-8 pour Excel
    const BOM = '\uFEFF'
    const csvContent = BOM + csvData.map((row) => row.join(',')).join('\r\n')

    // Télécharger comme fichier Excel
    const blob = new Blob([csvContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = (options.filename || 'export.xlsx').replace('.csv', '.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Crée les données de workbook Univer à partir des données exportées
   */
  private static createUniverWorkbookData<T>(
    exportData: Record<string, unknown>[],
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
        s: ExportUtils.getHeaderStyle(),
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
          columnCount: exportColumns.length,
        },
      },
    }
  }

  /**
   * Convertit une valeur en cellule Univer
   */
  private static convertValueToUniverCell<T>(
    value: unknown,
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
          cellData.v = value instanceof Date ? value : new Date(value as string | number | Date)
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
  private static getHeaderStyle(): UniverCellStyle {
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
        r: { s: 1, cl: { rgb: '#000000' } },
      },
    }
  }

  /**
   * Importe des données depuis Excel avec fallback robuste
   */
  static importFromExcel<T>(file: File, columns: ColumnConfig<T>[]): Promise<ImportResult<T>> {
    return new Promise((resolve, reject) => {
      // Server-side: return error immediately
      if (!isClient) {
        resolve({
          success: false,
          data: [],
          errors: [{ row: 0, column: '', message: 'Import not available on server-side' }],
          warnings: [],
        })
        return
      }

      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer
          let rawData: unknown[][] = []

          // Essayer Univer d'abord si disponible (client-side seulement)
          const univer = await ExportUtils.getUniverInstance()
          if (univer && ExportUtils.univerAvailable) {
            try {
              const workbook = await ExportUtils.importExcelToUniver(univer, buffer)
              if (workbook) {
                const firstSheet = ExportUtils.getFirstSheet(workbook)
                if (firstSheet) {
                  rawData = ExportUtils.extractDataFromUniverSheet(firstSheet)
                }
              }
            } catch (_error) {
              ExportUtils.univerAvailable = false
            }
          }

          // Fallback: tenter de parser comme CSV/TSV
          if (rawData.length === 0) {
            rawData = await ExportUtils.parseAsCSV(buffer)
          }

          // Si toujours aucune donnée, retourner une erreur
          if (rawData.length === 0) {
            resolve({
              success: false,
              data: [],
              errors: [
                {
                  row: 0,
                  column: '',
                  message:
                    'Impossible de lire le fichier. Formats supportés: Excel (.xlsx), CSV (.csv), TSV (.tsv)',
                },
              ],
              warnings: [],
            })
            return
          }

          // Traiter les données
          const result = ExportUtils.processImportData(rawData, columns)
          resolve(result)
        } catch (_error) {
          reject(new Error('Erreur lors de la lecture du fichier'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Erreur de lecture du fichier'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Parse un fichier comme CSV/TSV (fallback)
   */
  private static async parseAsCSV(buffer: ArrayBuffer): Promise<unknown[][]> {
    try {
      // Essayer différents encodages
      let text: string
      try {
        text = new TextDecoder('utf-8').decode(buffer)
      } catch {
        try {
          text = new TextDecoder('windows-1252').decode(buffer)
        } catch {
          text = new TextDecoder('iso-8859-1').decode(buffer)
        }
      }

      // Supprimer le BOM UTF-8 s'il existe
      if (text.charCodeAt(0) === 0xfeff) {
        text = text.substring(1)
      }

      // Diviser en lignes
      const lines = text.split(/\r?\n/).filter((line) => line.trim())
      if (lines.length === 0) return []

      // Détecter le séparateur (virgule, point-virgule, tabulation)
      const firstLine = lines[0]
      let separator = ','
      if (firstLine.includes('\t')) {
        separator = '\t'
      } else if (
        firstLine.includes(';') &&
        firstLine.split(';').length > firstLine.split(',').length
      ) {
        separator = ';'
      }

      // Parser chaque ligne
      return lines.map((line) => {
        if (separator === '\t') {
          return line.split('\t').map((cell) => cell.trim())
        } else {
          return ExportUtils.parseCSVLine(line, separator)
        }
      })
    } catch (_error) {
      return []
    }
  }

  /**
   * Parse une ligne CSV avec gestion des guillemets
   */
  private static parseCSVLine(line: string, separator: string = ','): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Guillemet échappé
          current += '"'
          i += 2
        } else {
          // Début ou fin de guillemets
          inQuotes = !inQuotes
          i++
        }
      } else if (char === separator && !inQuotes) {
        // Séparateur de cellule
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current.trim())
    return result
  }

  /**
   * Importe un fichier Excel dans Univer
   */
  private static async importExcelToUniver(
    univer: UniverInstance,
    buffer: ArrayBuffer
  ): Promise<UniverWorkbook | null> {
    try {
      // Dans un environnement réel, Univer fournirait une méthode pour importer Excel
      // Pour l'instant, on simule la conversion depuis le buffer
      const workbookData = await ExportUtils.parseExcelBuffer(buffer)
      if (workbookData) {
        return univer.createUnit(
          (UniverInstanceType as Record<string, number>).UNIVER_SHEET,
          workbookData
        )
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
      // Vérifier la signature du fichier Excel
      const _view = new DataView(buffer)
      if (buffer.byteLength < 8) return null

      // Vérifier la signature ZIP (XLSX est un format ZIP)
      const signature = new Uint8Array(buffer.slice(0, 4))
      const isZip =
        signature[0] === 0x50 &&
        signature[1] === 0x4b &&
        (signature[2] === 0x03 || signature[2] === 0x05 || signature[2] === 0x07) &&
        (signature[3] === 0x04 || signature[3] === 0x06 || signature[3] === 0x08)

      if (!isZip) {
        // Pas un fichier Excel valide
        return null
      }

      // Essayer d'utiliser l'API d'import Univer si disponible
      if (Univer && 'importFromBuffer' in Univer && typeof Univer.importFromBuffer === 'function') {
        try {
          const workbookData = await Univer.importFromBuffer(buffer)
          return workbookData
        } catch (_error) {}
      }

      // Fallback: structure de données vide mais valide
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
            columnCount: 0,
          },
        },
      }
    } catch (_error) {
      return null
    }
  }

  /**
   * Obtient la première feuille d'un workbook Univer
   */
  private static getFirstSheet(workbook: UniverWorkbook): UniverSheetData | null {
    try {
      // Récupérer les données de la première feuille
      const sheets = workbook.getSnapshot()?.sheets
      if (sheets) {
        const firstSheetId = Object.keys(sheets)[0]
        return sheets[firstSheetId] || null
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Extrait les données d'une feuille Univer
   */
  private static extractDataFromUniverSheet(sheet: UniverSheetData): unknown[][] {
    const result: unknown[][] = []

    // Parcourir les données de cellules pour reconstruire le tableau
    const maxRow = sheet.rowCount || 0
    const maxCol = sheet.columnCount || 0

    for (let row = 0; row < maxRow; row++) {
      const rowData: unknown[] = []
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
    rawData: unknown[][],
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
      const processedRow: Record<string, unknown> = {}
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
    rawValue: unknown,
    column: ColumnConfig<T>
  ): { value: unknown; error?: string; warning?: string } {
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
          const date = new Date(rawValue as string | number | Date)
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
  private static formatValue(value: unknown, format: NonNullable<ColumnConfig['format']>): string {
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
    workbook: UniverWorkbook,
    columns: ColumnConfig<T>[],
    data: Record<string, unknown>[],
    options: AdvancedExportOptions
  ): void {
    if (!options.includeStyles) return

    try {
      // Appliquer les styles avancés via l'API Univer
      // Formatage conditionnel pour les nombres
      if (options.conditionalFormatting) {
        ExportUtils.applyConditionalFormattingUniver(
          workbook,
          columns as ColumnConfig<Record<string, unknown>>[],
          data
        )
      }
    } catch {
      // Ignorer les erreurs de formatage
    }
  }

  /**
   * Détermine le style d'une cellule selon sa valeur et sa colonne (version Univer)
   */
  private static getCellStyle<T>(
    value: unknown,
    column: ColumnConfig<T>,
    row: number
  ): UniverCellStyle {
    const baseStyle: UniverCellStyle = {
      vt: 2, // vertical middle
      bd: {
        t: { s: 1, cl: { rgb: '#E0E0E0' } },
        b: { s: 1, cl: { rgb: '#E0E0E0' } },
        l: { s: 1, cl: { rgb: '#E0E0E0' } },
        r: { s: 1, cl: { rgb: '#E0E0E0' } },
      },
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
    _workbook: UniverWorkbook,
    columns: ColumnConfig[],
    data: Record<string, unknown>[]
  ): void {
    try {
      // Exemple de formatage conditionnel pour les colonnes numériques
      columns.forEach((column, _colIndex) => {
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
        data.forEach((row, _rowIndex) => {
          const value = row[column.title]
          if (typeof value !== 'number') return

          const percentile = (value - min) / (max - min)
          let _bgColor = '#FFFFFF'

          if (percentile <= 0.33) {
            _bgColor = '#FFEBEE' // 33% inférieur - rouge clair
          } else if (percentile >= 0.67) {
            _bgColor = '#E8F5E8' // 33% supérieur - vert clair
          }

          // Simulation d'application de style
          // Dans une vraie implémentation, ceci utiliserait l'API Univer
        })
      })
    } catch {
      // Ignorer les erreurs de formatage conditionnel
    }
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
    _workbook: UniverWorkbook,
    exportColumns: ColumnConfig<T>[],
    exportData: Record<string, unknown>[]
  ): void {
    try {
      // Simulation de définition de largeur de colonnes
      // Dans une vraie implémentation, ceci utiliserait l'API Univer
      exportColumns.forEach((col, _index) => {
        const maxLength = Math.max(
          col.title.length,
          ...exportData.slice(0, 100).map((row) => String(row[col.title] || '').length)
        )
        const _width = Math.min(Math.max(maxLength * 8, 80), 400)
        // workbook.setColumnWidth(index, width)
      })
    } catch {
      // Ignorer les erreurs de largeur de colonne
    }
  }

  /**
   * Définit le gel d'en-tête dans Univer
   */
  private static setFreezeHeader(_workbook: UniverWorkbook): void {
    try {
      // Simulation du gel de la première ligne
      // Dans une vraie implémentation, ceci utiliserait l'API Univer
      // workbook.setFreeze({ startRow: 0, startColumn: 0, ySplit: 1, xSplit: 0 })
    } catch {
      // Ignorer les erreurs de gel
    }
  }

  /**
   * Définit l'autofilter dans Univer
   */
  private static setAutoFilter(
    _workbook: UniverWorkbook,
    _dataRowCount: number,
    _columnCount: number
  ): void {
    try {
      // Simulation de l'autofilter
      // Dans une vraie implémentation, ceci utiliserait l'API Univer
      // workbook.setAutoFilter({
      //   startRow: 0,
      //   endRow: dataRowCount,
      //   startColumn: 0,
      //   endColumn: columnCount - 1
      // })
    } catch {
      // Ignorer les erreurs d'autofilter
    }
  }

  /**
   * Ajoute une feuille de statistiques dans Univer
   */
  private static addStatisticsSheet<T>(
    _workbook: UniverWorkbook,
    data: Record<string, unknown>[],
    columns: ColumnConfig<T>[]
  ): void {
    try {
      const stats: unknown[][] = []

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

      // Simulation d'ajout d'une feuille de statistiques
      // Dans une vraie implémentation, ceci créerait une nouvelle feuille dans le workbook
    } catch {
      // Ignorer les erreurs de création de feuille de stats
    }
  }

  /**
   * Exporte un workbook Univer vers un fichier
   */
  private static exportUniverToFile(workbook: UniverWorkbook, filename: string): void {
    try {
      // Essayer d'utiliser l'API d'export Univer si disponible
      if (workbook && typeof workbook.exportAsExcel === 'function') {
        workbook
          .exportAsExcel()
          .then((blob: Blob) => {
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          })
          .catch((_error: unknown) => {
            throw new Error("Impossible d'exporter le fichier avec Univer")
          })
      } else if (workbook && typeof workbook.save === 'function') {
        workbook.save(filename)
      } else {
        throw new Error('No export method available')
      }
    } catch (_error) {
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
    // Server-side: throw error
    if (!isClient) {
      throw new Error('Export not available on server-side')
    }
    try {
      // Filtrer les colonnes visibles si demandé
      const exportColumns = options.visibleColumnsOnly
        ? columns.filter((col) => col.visible !== false)
        : columns

      // Préparer les données
      const csvData: string[][] = []

      // En-têtes
      if (options.includeHeaders !== false) {
        csvData.push(exportColumns.map((col) => col.title))
      }

      // Données
      data.forEach((row) => {
        const csvRow = exportColumns.map((col) => {
          const key = col.key as string
          let value = (row as Record<string, unknown>)[key]

          // Traitement spécial pour rich text
          if (col.type === 'richtext' && value) {
            value = ExportUtils.stripHtmlTags(String(value))
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
    // Server-side: throw error
    if (!isClient) {
      throw new Error('Export not available on server-side')
    }
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
      if (options.includeHeaders !== false) {
        htmlContent += '<thead><tr>'
        exportColumns.forEach((col) => {
          htmlContent += `<th>${col.title}</th>`
        })
        htmlContent += '</tr></thead>'
      }

      // Données
      htmlContent += '<tbody>'
      data.forEach((row, index) => {
        htmlContent += `<tr${index % 2 === 0 ? '' : ' class="even"'}>`

        exportColumns.forEach((col) => {
          const key = col.key as string
          let value = (row as Record<string, unknown>)[key]

          // Traitement spécial pour rich text - garder le HTML pour PDF
          if (col.type === 'richtext' && value) {
            // Pour PDF, on garde le HTML mais on le nettoie un peu
            value = String(value || '')
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

    // Server-side: basic HTML tag removal with regex
    if (!isClient) {
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
        .replace(/^\s+|\s+$/g, '') // Trim
    }

    // Client-side: use DOM for better HTML parsing
    try {
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
    } catch (_error) {
      // Fallback to regex-based stripping if DOM manipulation fails
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/\n\s*\n/g, '\n')
        .replace(/^\s+|\s+$/g, '')
    }
  }
}
