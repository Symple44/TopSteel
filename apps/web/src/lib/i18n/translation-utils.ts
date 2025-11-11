// SSR-compatible Univer imports with client-side detection
let Univer: typeof import('@univerjs/core').Univer | null = null
let UniverSheetsPlugin: typeof import('@univerjs/sheets').UniverSheetsPlugin | null = null

// Flag to track if we're running on the client side
const isClient = typeof window !== 'undefined'

// Dynamic import function for client-side only
const loadUniverComponents = async (): Promise<boolean> => {
  if (!isClient) {
    return false // Server-side: always return false
  }

  try {
    // Use dynamic imports instead of require for Next.js compatibility
    const [univerCore, univerSheets] = await Promise.all([
      import('@univerjs/core').catch(() => null),
      import('@univerjs/sheets').catch(() => null),
    ])

    if (univerCore) {
      Univer = univerCore.Univer
    }

    if (univerSheets) {
      UniverSheetsPlugin = univerSheets.UniverSheetsPlugin
    }

    return Univer !== null && UniverSheetsPlugin !== null
  } catch (_error) {
    return false
  }
}

// Promise to track Univer loading status
let univerLoadingPromise: Promise<boolean> | null = null

import { callClientApi } from '../../utils/backend-api'
import { en } from './translations/en'
import { es } from './translations/es'
import { fr } from './translations/fr'
import type { TranslationEntry, TranslationImportResult, TranslationStats } from './types'

// Fonction helper pour vérifier si une traduction est valide
const isValidTranslation = (value: unknown): boolean => {
  return typeof value === 'string' && value?.trim() !== ''
}

// Obtenir toutes les traductions disponibles
export const getAllTranslations = (): Record<string, Record<string, unknown>> => ({
  fr,
  en,
  es,
})

// Convertir les traductions imbriquées en entrées plates
export const flattenTranslations = (
  translations: Record<string, Record<string, unknown>>,
  _namespace = '',
  _category = 'general'
): TranslationEntry[] => {
  const entries: TranslationEntry[] = []
  const languages = Object.keys(translations)

  // Récupérer toutes les clés uniques de toutes les langues
  const allKeys = new Set<string>()
  languages?.forEach((lang) => {
    extractKeys(translations[lang], '', allKeys)
  })

  // Créer une entrée pour chaque clé
  allKeys?.forEach((fullKey) => {
    const parts = fullKey?.split('.')
    const ns = parts?.[0]
    const key = parts?.slice(1).join('.')

    const entry: TranslationEntry = {
      id: fullKey,
      namespace: ns,
      key: key,
      fullKey: fullKey,
      translations: {},
      category: determineCategory(ns, key),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Récupérer la traduction pour chaque langue
    languages?.forEach((lang) => {
      const value = getNestedValue(translations[lang], fullKey)
      if (value !== undefined && typeof value === 'string') {
        entry.translations[lang] = value
      }
    })

    entries?.push(entry)
  })

  return entries?.sort((a, b) => a?.fullKey?.localeCompare(b.fullKey))
}

// Extraire toutes les clés d'un objet imbriqué
const extractKeys = (obj: Record<string, unknown>, prefix: string, keys: Set<string>): void => {
  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      extractKeys(obj[key] as Record<string, unknown>, fullKey, keys)
    } else {
      keys?.add(fullKey)
    }
  })
}

// Obtenir une valeur imbriquée par sa clé complète
const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path
    .split('.')
    .reduce(
      (current: Record<string, unknown> | unknown, key) =>
        (current as Record<string, unknown>)?.[key],
      obj
    )
}

// Déterminer la catégorie basée sur le namespace et la clé
export const determineCategory = (namespace: string, key: string): string => {
  if (namespace === 'auth') return 'Authentification'
  if (namespace === 'errors') return 'Erreurs'
  if (namespace === 'dashboard') return 'Tableau de bord'
  if (namespace === 'navigation') return 'Navigation'
  if (namespace === 'settings') return 'Paramètres'
  if (namespace === 'admin') return 'Administration'
  if (namespace === 'profile') return 'Profil'
  if (namespace === 'common') {
    if (key?.includes('security')) return 'Sécurité'
    if (key?.includes('notification')) return 'Notifications'
    return 'Général'
  }
  return 'Autre'
}

// Calculer les statistiques de traduction
export const calculateTranslationStats = (entries: TranslationEntry[]): TranslationStats => {
  const languages = ['fr', 'en', 'es']
  const stats: TranslationStats = {
    total: entries.length,
    translated: {},
    untranslated: {},
    percentageComplete: {},
  }

  languages?.forEach((lang) => {
    const translated = entries?.filter((e) => isValidTranslation(e.translations[lang])).length
    const untranslated = entries.length - translated

    stats.translated[lang] = translated
    stats.untranslated[lang] = untranslated
    stats.percentageComplete[lang] =
      entries.length > 0 ? Math.round((translated / entries.length) * 100) : 0
  })

  return stats
}

// Filtrer les traductions
export const filterTranslations = (
  entries: TranslationEntry[],
  filter: {
    search?: string
    namespace?: string
    category?: string
    language?: string
    untranslated?: boolean
    modified?: boolean
  }
): TranslationEntry[] => {
  return entries?.filter((entry) => {
    // Filtre de recherche
    if (filter.search) {
      const searchLower = filter?.search?.toLowerCase()
      const matchKey = entry?.fullKey?.toLowerCase().includes(searchLower)
      const matchTranslations = Object.values(entry.translations).some((t) =>
        t?.toLowerCase().includes(searchLower)
      )
      if (!matchKey && !matchTranslations) return false
    }

    // Filtre namespace
    if (filter.namespace && entry.namespace !== filter.namespace) return false

    // Filtre catégorie
    if (filter.category && entry.category !== filter.category) return false

    // Filtre traductions manquantes
    if (filter.untranslated && filter.language) {
      const hasTranslation = isValidTranslation(entry.translations[filter.language])
      if (hasTranslation) return false
    }

    // Filtre traductions modifiées
    if (filter.modified && !entry.isModified) return false

    return true
  })
}

// Interface pour les valeurs de cellule Univer compatible
type CellValue = string | number | boolean | null

// Interface pour les données de cellule compatible avec IWorkbookData
interface CompatibleCellData {
  v?: CellValue
  t?: number // type (1=string, 2=number, 3=boolean, 4=date)
}

// Interface pour les données de feuille compatible avec IWorkbookData
interface CompatibleSheetData {
  id: string
  name: string
  cellData: Record<string, Record<string, CompatibleCellData>>
  rowCount: number
  columnCount: number
}

// Interface compatible avec IWorkbookData
interface CompatibleWorkbookData {
  id: string
  name: string
  appVersion?: string
  locale?: string
  styles?: Record<string, unknown>
  sheetOrder: string[]
  sheets: Record<string, Partial<CompatibleSheetData>>
}

// Type guard pour vérifier si un objet est un IWorkbookData Univer valide
function isValidIWorkbookData(data: unknown): data is Partial<CompatibleWorkbookData> {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>)?.id === 'string' &&
    typeof (data as Record<string, unknown>)?.name === 'string'
  )
}

// Types pour les options de theme et locale Univer compatibles
interface UniverThemeOptions {
  theme?: 'default' | 'green' | 'red' | Record<string, unknown>
}

interface UniverLocaleOptions {
  locale?: 'fr-FR' | 'en-US' | 'es-ES' | Record<string, unknown>
}

// Interface de base pour Univer Config compatible
interface CompatibleUniverConfig {
  theme?: 'default' | 'green' | 'red'
  locale?: 'fr-FR' | 'en-US' | 'es-ES'
}

// Interface étendue pour les méthodes Univer
interface ExtendedUniver {
  createUniverSheet?: (data: Partial<CompatibleWorkbookData>) => {
    exportAsExcel?: () => Promise<Blob>
    save?: () => Promise<Blob>
  }
  importExcel?: (buffer: ArrayBuffer) => Promise<{
    getActiveSheet?: () => {
      getUsedRange(): { endRow?: number; endColumn?: number } | null
      getCell(row: number, col: number): { getValue(): unknown } | null
    } | null
  } | null>
  importFromBuffer?: (buffer: ArrayBuffer) => Promise<CompatibleWorkbookData | null>
}

// Instance Univer singleton pour les traductions
class TranslationUniverUtils {
  private static univerInstance: InstanceType<typeof import('@univerjs/core').Univer> | null = null
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
   * Obtient l'instance Univer singleton avec gestion d'erreur (client-side seulement)
   */
  private static async getUniverInstance(): Promise<InstanceType<
    typeof import('@univerjs/core').Univer
  > | null> {
    if (!isClient) {
      return null // Server-side: always return null
    }

    const univerAvailable = await TranslationUniverUtils?.isUniverAvailable()
    if (!univerAvailable) {
      return null
    }

    if (!TranslationUniverUtils.univerInstance && Univer) {
      try {
        // Configuration Univer compatible - utiliser undefined pour les valeurs par défaut
        const univerOptions = {}
        TranslationUniverUtils.univerInstance = new Univer(univerOptions)

        // Registrer seulement les plugins nécessaires pour les traductions
        if (UniverSheetsPlugin) {
          TranslationUniverUtils?.univerInstance?.registerPlugin(UniverSheetsPlugin)
        }

        TranslationUniverUtils.univerAvailable = true
      } catch (_error) {
        TranslationUniverUtils.univerInstance = null
        TranslationUniverUtils.univerAvailable = false
        return null
      }
    }

    return TranslationUniverUtils.univerInstance
  }

  /**
   * Crée des données de workbook Univer à partir des entrées de traduction
   */
  static createWorkbookFromTranslations(
    entries: TranslationEntry[],
    languages: string[]
  ): CompatibleWorkbookData {
    const sheetId = 'translations'
    const cellData: Record<string, Record<string, CompatibleCellData>> = {}

    // En-têtes (ligne 0)
    const headers = ['ID', 'Namespace', 'Key', 'Category', 'Description']
    languages?.forEach((lang) => {
      headers?.push(`Translation_${lang}`)
    })

    const headerRow: Record<string, CompatibleCellData> = {}
    headers?.forEach((header, colIndex) => {
      headerRow[colIndex?.toString()] = {
        v: header,
        t: 1, // string type
      }
    })
    cellData['0'] = headerRow

    // Données (lignes 1+)
    entries?.forEach((entry, rowIndex) => {
      const dataRow: Record<string, CompatibleCellData> = {}

      // Colonnes fixes
      const rowData = [
        entry.id,
        entry.namespace,
        entry.key,
        entry.category || '',
        entry.description || '',
      ]

      // Ajouter les traductions pour chaque langue
      languages?.forEach((lang) => {
        rowData?.push(entry.translations[lang] || '')
      })

      rowData?.forEach((value, colIndex) => {
        dataRow[colIndex?.toString()] = {
          v: value,
          t: 1, // string type
        }
      })

      cellData[(rowIndex + 1).toString()] = dataRow
    })

    return {
      id: 'translations-workbook',
      name: 'Translations',
      appVersion: '1.0.0',
      locale: 'fr-FR',
      styles: {},
      sheetOrder: [sheetId],
      sheets: {
        [sheetId]: {
          id: sheetId,
          name: 'Translations',
          cellData,
          rowCount: entries.length + 1,
          columnCount: headers.length,
        },
      },
    }
  }

  /**
   * Exporte les données Univer vers un blob Excel avec fallback robuste
   */
  static async exportWorkbookToBlob(workbookData: CompatibleWorkbookData): Promise<Blob> {
    // Server-side: always use fallback
    if (!isClient) {
      return TranslationUniverUtils?.createFallbackExcelBlob(workbookData)
    }

    // Essayer Univer d'abord si disponible (client-side seulement)
    const univer = await TranslationUniverUtils?.getUniverInstance()

    if (univer && TranslationUniverUtils.univerAvailable) {
      try {
        if (!isValidIWorkbookData(workbookData)) {
          throw new Error('Invalid workbook data format')
        }

        const extendedUniver = univer as unknown as ExtendedUniver
        const univerSheet = extendedUniver?.createUniverSheet?.(workbookData)

        // Utiliser l'API d'export d'Univer pour générer le blob Excel
        if (univerSheet?.exportAsExcel) {
          const blob = await univerSheet.exportAsExcel()
          return blob
        } else if (univerSheet?.save) {
          // Alternative: méthode save
          const blob = await univerSheet.save()
          return blob
        }
      } catch (_error) {
        TranslationUniverUtils.univerAvailable = false
      }
    }

    // Fallback: créer un blob Excel compatible
    return TranslationUniverUtils?.createFallbackExcelBlob(workbookData)
  }

  /**
   * Crée un blob Excel basique en cas de fallback
   */
  static createFallbackExcelBlob(workbookData: CompatibleWorkbookData): Blob {
    try {
      // Créer un contenu Excel compatible (format CSV avec BOM UTF-8)
      const sheet = workbookData?.sheets[workbookData?.sheetOrder?.[0]]
      if (!sheet) {
        throw new Error('No sheet data available')
      }

      const lines: string[] = []

      for (let row = 0; row < (sheet.rowCount || 0); row++) {
        const rowKey = row?.toString()
        const cells: string[] = []

        for (let col = 0; col < (sheet.columnCount || 0); col++) {
          const colKey = col?.toString()
          const cellData = sheet.cellData?.[rowKey]?.[colKey]
          const value = cellData?.v || ''
          // Échapper les guillemets et virgules pour CSV
          const escapedValue = String(value).replace(/"/g, '""')
          cells?.push(`"${escapedValue}"`)
        }

        lines?.push(cells?.join(','))
      }

      // Ajouter BOM UTF-8 pour la compatibilité Excel
      const BOM = '\uFEFF'
      const csvContent = BOM + lines?.join('\r\n')

      return new Blob([csvContent], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
      })
    } catch (_error) {
      // Retourner un blob vide mais valide en cas d'échec complet
      return new Blob([''], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
      })
    }
  }

  /**
   * Importe un fichier Excel et le convertit en données de workbook Univer
   */
  static async importExcelToWorkbook(buffer: ArrayBuffer): Promise<CompatibleWorkbookData | null> {
    // Server-side: always use fallback
    if (!isClient) {
      return TranslationUniverUtils?.parseFallbackExcel(buffer)
    }

    // Essayer Univer d'abord si disponible (client-side seulement)
    const univer = await TranslationUniverUtils?.getUniverInstance()

    if (univer && TranslationUniverUtils.univerAvailable) {
      try {
        // Utiliser l'API d'import d'Univer pour lire le fichier Excel
        const extendedUniver = univer as unknown as ExtendedUniver

        if (extendedUniver?.importExcel) {
          const workbook = await extendedUniver.importExcel(buffer)
          if (workbook) {
            // Convertir en format de données standard
            const firstSheet = workbook.getActiveSheet ? workbook.getActiveSheet() : null
            if (firstSheet) {
              return TranslationUniverUtils?.extractWorkbookData(firstSheet)
            }
          }
        } else if (extendedUniver?.importFromBuffer) {
          // Alternative: méthode importFromBuffer
          const workbookData = await extendedUniver.importFromBuffer(buffer)
          if (workbookData) {
            return workbookData
          }
        }
      } catch (_error) {
        TranslationUniverUtils.univerAvailable = false
      }
    }

    // Fallback: essayer de parser comme CSV/Excel basique
    return TranslationUniverUtils?.parseFallbackExcel(buffer)
  }

  /**
   * Extrait les données d'une feuille Univer
   */
  private static extractWorkbookData(sheet: {
    getUsedRange(): { endRow?: number; endColumn?: number } | null
    getCell(row: number, col: number): { getValue(): unknown } | null
  }): CompatibleWorkbookData {
    const cellData: Record<string, Record<string, CompatibleCellData>> = {}

    // Obtenir les dimensions de la feuille
    const range = sheet?.getUsedRange()
    const rowCount = range?.endRow ? range.endRow + 1 : 0
    const columnCount = range?.endColumn ? range.endColumn + 1 : 0

    // Extraire toutes les cellules
    for (let row = 0; row < rowCount; row++) {
      const rowData: Record<string, CompatibleCellData> = {}

      for (let col = 0; col < columnCount; col++) {
        const cell = sheet?.getCell(row, col)
        if (cell) {
          const cellValue = cell?.getValue()
          // Type assertion pour gérer les valeurs de cellule compatibles
          const typedValue =
            typeof cellValue === 'object' && cellValue !== null
              ? String(cellValue)
              : (cellValue as CellValue)
          rowData[col?.toString()] = {
            v: typedValue || null,
            t: 1, // string type par défaut
          }
        }
      }

      if (Object.keys(rowData).length > 0) {
        cellData[row?.toString()] = rowData
      }
    }

    return {
      id: 'imported-workbook',
      name: 'Imported',
      appVersion: '1.0.0',
      locale: 'fr-FR',
      styles: {},
      sheetOrder: ['sheet1'],
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          cellData,
          rowCount,
          columnCount,
        },
      },
    }
  }

  /**
   * Parse un fichier Excel en fallback
   */
  private static parseFallbackExcel(buffer: ArrayBuffer): CompatibleWorkbookData | null {
    try {
      // Vérifier s'il s'agit d'un fichier Excel réel (signature XLSX)
      if (buffer?.byteLength < 4) return null

      const signature = new Uint8Array(buffer?.slice(0, 4))

      // Signature ZIP (XLSX est un format ZIP)
      const isZip =
        signature?.[0] === 0x50 &&
        signature?.[1] === 0x4b &&
        (signature?.[2] === 0x03 || signature?.[2] === 0x05 || signature?.[2] === 0x07) &&
        (signature?.[3] === 0x04 || signature?.[3] === 0x06 || signature?.[3] === 0x08)

      if (isZip) {
        return null
      }

      // Essayer de parser comme CSV/texte
      let text: string
      try {
        // Essayer UTF-8 d'abord
        text = new TextDecoder('utf-8').decode(buffer)
      } catch {
        try {
          // Fallback vers windows-1252
          text = new TextDecoder('windows-1252').decode(buffer)
        } catch {
          // Dernier recours: latin1
          text = new TextDecoder('iso-8859-1').decode(buffer)
        }
      }

      // Supprimer le BOM s'il existe
      if (text?.charCodeAt(0) === 0xfeff) {
        text = text?.substring(1)
      }

      const lines = text?.split(/\r?\n/).filter((line) => line?.trim())

      if (lines?.length === 0) return null

      // Détecter le séparateur
      const firstLine = lines?.[0]
      let separator = ','
      if (firstLine?.includes('\t')) {
        separator = '\t'
      } else if (
        firstLine?.includes(';') &&
        firstLine?.split(';').length > firstLine?.split(',').length
      ) {
        separator = ';'
      }

      const cellData: Record<string, Record<string, CompatibleCellData>> = {}
      let maxColumns = 0

      lines?.forEach((line, rowIndex) => {
        // Parser la ligne CSV/TSV
        const cells =
          separator === '\t'
            ? line?.split('\t')
            : TranslationUniverUtils?.parseCSVLine(line, separator)

        maxColumns = Math.max(maxColumns, cells.length)

        const rowData: Record<string, CompatibleCellData> = {}
        cells?.forEach((cell, colIndex) => {
          rowData[colIndex?.toString()] = {
            v: cell?.trim(),
            t: 1, // string type
          }
        })

        cellData[rowIndex?.toString()] = rowData
      })

      return {
        id: 'fallback-workbook',
        name: 'Fallback',
        appVersion: '1.0.0',
        locale: 'fr-FR',
        styles: {},
        sheetOrder: ['sheet1'],
        sheets: {
          sheet1: {
            id: 'sheet1',
            name: 'Sheet1',
            cellData,
            rowCount: lines.length,
            columnCount: maxColumns,
          },
        },
      }
    } catch (_error) {
      return null
    }
  }

  /**
   * Parse une ligne CSV en tenant compte des guillemets
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
        result?.push(current?.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result?.push(current?.trim())
    return result
  }

  /**
   * Convertit les données de workbook Univer en tableau 2D
   */
  static extractDataFromWorkbook(workbook: CompatibleWorkbookData): unknown[][] {
    const firstSheetId = workbook?.sheetOrder?.[0]
    const sheet = workbook?.sheets[firstSheetId]

    if (!sheet) return []

    const result: unknown[][] = []

    for (let row = 0; row < (sheet.rowCount || 0); row++) {
      const rowKey = row?.toString()
      const rowData: unknown[] = []

      for (let col = 0; col < (sheet.columnCount || 0); col++) {
        const colKey = col?.toString()
        const cellData = sheet.cellData?.[rowKey]?.[colKey]
        rowData?.push(cellData?.v || '')
      }

      result?.push(rowData)
    }

    return result
  }
}

// Exporter les traductions en Excel
export const exportToExcel = (entries: TranslationEntry[], languages: string[]): Blob => {
  try {
    // Créer les données de workbook Univer
    const workbookData = TranslationUniverUtils?.createWorkbookFromTranslations(entries, languages)

    // Note: Cette fonction doit rester synchrone pour maintenir la compatibilité API
    // On utilise toujours le fallback synchrone qui génère un format CSV compatible Excel
    // car l'export async Univer nécessiterait un changement d'API
    return TranslationUniverUtils?.createFallbackExcelBlob(workbookData)
  } catch (_error) {
    // Fallback d'urgence: créer un CSV minimal mais valide
    const headers = ['ID', 'Namespace', 'Key', 'Category', 'Description']
    languages?.forEach((lang) => {
      headers?.push(`Translation_${lang}`)
    })

    const csvRows = [headers?.join(',')]
    entries?.forEach((entry) => {
      const row = [
        `"${entry.id}"`,
        `"${entry.namespace}"`,
        `"${entry.key}"`,
        `"${entry.category || ''}"`,
        `"${entry.description || ''}"`,
      ]
      languages?.forEach((lang) => {
        row?.push(`"${(entry.translations[lang] || '').replace(/"/g, '""')}"`)
      })
      csvRows?.push(row?.join(','))
    })

    const BOM = '\uFEFF'
    const csvContent = BOM + csvRows?.join('\r\n')

    return new Blob([csvContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })
  }
}

// Importer les traductions depuis Excel
export const importFromExcel = async (
  file: File,
  existingEntries: TranslationEntry[]
): Promise<TranslationImportResult> => {
  const result: TranslationImportResult = {
    success: false,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  }

  try {
    const buffer = await file?.arrayBuffer()

    // Utiliser Univer pour lire le fichier Excel
    const workbook = await TranslationUniverUtils?.importExcelToWorkbook(buffer)
    if (!workbook) {
      result?.errors?.push(
        'Impossible de lire le fichier. Formats supportés: Excel (.xlsx), CSV (.csv), TSV (.tsv)'
      )
      return result
    }

    // Extraire les données sous forme de tableau 2D
    const rawData = TranslationUniverUtils?.extractDataFromWorkbook(workbook)
    if (rawData?.length === 0) {
      result?.errors?.push('Fichier vide')
      return result
    }

    // Vérifier qu'il y a au moins une ligne d'en-têtes
    if (rawData?.length < 1) {
      result?.errors?.push("Le fichier doit contenir au moins une ligne d'en-têtes")
      return result
    }

    // Première ligne = en-têtes, reste = données
    const headers = rawData?.[0] as string[]
    const dataRows = rawData?.slice(1)

    // Vérifier que les colonnes requises sont présentes
    const requiredColumns = ['ID']
    const missingColumns = requiredColumns?.filter((col) => !headers?.includes(col))
    if (missingColumns?.length > 0) {
      result?.errors?.push(`Colonnes manquantes: ${missingColumns?.join(', ')}`)
      return result
    }

    // Convertir en format objet comme le faisait XLSX.utils.sheet_to_json
    const data = dataRows?.map((row) => {
      const rowObj: Record<string, unknown> = {}
      headers?.forEach((header, index) => {
        rowObj[header] = row[index] || ''
      })
      return rowObj
    })

    const entriesMap = new Map(existingEntries?.map((e) => [e.id, e]))

    data?.forEach((row: Record<string, unknown>, index) => {
      try {
        const id = row.ID?.toString().trim()
        if (!id) {
          if (result?.warnings) {
            result.warnings.push(`Ligne ${index + 2}: ID manquant`)
          }
          if (result) {
            result.skipped++
          }
          return
        }

        const translations: Record<string, string> = {}
        Object.keys(row).forEach((key) => {
          if (key?.startsWith('Translation_')) {
            const lang = key?.replace('Translation_', '')
            const translation = row[key]?.toString().trim() || ''
            if (translation) {
              translations[lang] = translation
            }
          }
        })

        if (entriesMap?.has(id)) {
          // Mise à jour
          const existing = entriesMap?.get(id)!
          let hasChanges = false

          // Vérifier s'il y a de vrais changements
          Object.keys(translations).forEach((lang) => {
            if (existing?.translations[lang] !== translations[lang]) {
              hasChanges = true
            }
          })

          if (hasChanges) {
            if (existing) {
              existing.translations = { ...existing.translations, ...translations }
              existing.updatedAt = new Date()
            }
            if (result) {
              result.updated++
            }
          } else {
            if (result) {
              result.skipped++
            }
          }
        } else {
          // Nouvelle entrée
          const namespace = row.Namespace?.toString().trim() || ''
          const key = row.Key?.toString().trim() || ''

          const newEntry: TranslationEntry = {
            id,
            namespace,
            key,
            fullKey: id,
            translations,
            category: row.Category?.toString().trim() || determineCategory(namespace, key),
            description: row.Description?.toString().trim() || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          entriesMap?.set(id, newEntry)
          if (result) {
            result.imported++
          }
        }
      } catch (error) {
        if (result?.errors) {
          result.errors.push(`Ligne ${index + 2}: ${error}`)
        }
      }
    })

    if (result?.errors) {
      result.success = result.errors.length === 0
    }
  } catch (error) {
    if (result?.errors) {
      result.errors.push(`Erreur d'import: ${error}`)
    }
  }

  return result
}

// Sauvegarder les traductions modifiées
export const saveTranslation = async (entry: TranslationEntry): Promise<boolean> => {
  try {
    const response = await callClientApi('admin/translations', {
      method: 'POST',
      body: JSON.stringify({ translationEntry: entry }),
    })

    if (!response?.ok) {
      throw new Error(`HTTP error! status: ${response?.status}`)
    }

    const result = await response?.json()
    return result?.success
  } catch (_error) {
    return false
  }
}

// Charger les traductions avec les modifications
export const loadTranslationsWithOverrides = async (): Promise<TranslationEntry[]> => {
  // Toujours commencer par les traductions de base (référence)
  const baseTranslations = flattenTranslations(getAllTranslations())

  try {
    const response = await callClientApi('admin/translations', {
      method: 'GET',
    })

    if (!response?.ok) {
      // Retourner les traductions de base si l'API échoue
      return baseTranslations
    }

    const result = await response?.json()

    if (result?.success && result?.data?.overrides) {
      const overrides = result?.data?.overrides

      // Appliquer les overrides aux traductions de base
      return baseTranslations?.map((entry) => {
        if (overrides[entry.id]) {
          return {
            ...entry,
            // Fusionner les traductions : base + overrides
            translations: {
              ...entry.translations,
              ...overrides?.[entry.id]?.translations,
            },
            // Marquer comme modifié si des overrides existent
            isModified: true,
            updatedAt: new Date(overrides?.[entry.id]?.updatedAt),
            updatedBy: overrides?.[entry.id]?.updatedBy,
          }
        }
        return {
          ...entry,
          isModified: false,
        }
      })
    }
  } catch (_error) {}

  // Retourner les traductions de base avec un flag non-modifié
  return baseTranslations?.map((entry) => ({
    ...entry,
    isModified: false,
  }))
}

// Importer des traductions via l'API
export const bulkImportTranslations = async (
  translations: TranslationEntry[]
): Promise<{
  success: boolean
  message?: string
  stats?: { imported: number; updated: number }
}> => {
  try {
    const response = await callClientApi('admin/translations', {
      method: 'PUT',
      body: JSON.stringify({ translations }),
    })

    if (!response?.ok) {
      throw new Error(`HTTP error! status: ${response?.status}`)
    }

    const result = await response?.json()
    return result
  } catch (error) {
    return {
      success: false,
      message: `Erreur lors de l'import: ${error}`,
    }
  }
}
