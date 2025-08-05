import { Univer } from '@univerjs/core'
import { UniverSheetsPlugin } from '@univerjs/sheets'
import { callClientApi } from '@/utils/backend-api'
import { en } from './translations/en'
import { es } from './translations/es'
import { fr } from './translations/fr'
import type { TranslationEntry, TranslationImportResult, TranslationStats } from './types'

// Fonction helper pour vérifier si une traduction est valide
const isValidTranslation = (value: any): boolean => {
  return typeof value === 'string' && value.trim() !== ''
}

// Obtenir toutes les traductions disponibles
export const getAllTranslations = (): Record<string, any> => ({
  fr,
  en,
  es,
})

// Convertir les traductions imbriquées en entrées plates
export const flattenTranslations = (
  translations: Record<string, any>,
  _namespace = '',
  _category = 'general'
): TranslationEntry[] => {
  const entries: TranslationEntry[] = []
  const languages = Object.keys(translations)

  // Récupérer toutes les clés uniques de toutes les langues
  const allKeys = new Set<string>()
  languages.forEach((lang) => {
    extractKeys(translations[lang], '', allKeys)
  })

  // Créer une entrée pour chaque clé
  allKeys.forEach((fullKey) => {
    const parts = fullKey.split('.')
    const ns = parts[0]
    const key = parts.slice(1).join('.')

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
    languages.forEach((lang) => {
      const value = getNestedValue(translations[lang], fullKey)
      if (value !== undefined && typeof value === 'string') {
        entry.translations[lang] = value
      }
    })

    entries.push(entry)
  })

  return entries.sort((a, b) => a.fullKey.localeCompare(b.fullKey))
}

// Extraire toutes les clés d'un objet imbriqué
const extractKeys = (obj: any, prefix: string, keys: Set<string>): void => {
  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      extractKeys(obj[key], fullKey, keys)
    } else {
      keys.add(fullKey)
    }
  })
}

// Obtenir une valeur imbriquée par sa clé complète
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
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
    if (key.includes('security')) return 'Sécurité'
    if (key.includes('notification')) return 'Notifications'
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

  languages.forEach((lang) => {
    const translated = entries.filter((e) => isValidTranslation(e.translations[lang])).length
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
  return entries.filter((entry) => {
    // Filtre de recherche
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      const matchKey = entry.fullKey.toLowerCase().includes(searchLower)
      const matchTranslations = Object.values(entry.translations).some((t) =>
        t.toLowerCase().includes(searchLower)
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

// Interface pour les données de cellule Univer
interface UniverCellData {
  v?: any // value
  t?: number // type (1=string, 2=number, 3=boolean, 4=date)
}

// Interface pour les données de feuille Univer
interface UniverSheetData {
  id: string
  name: string
  cellData: Record<string, Record<string, UniverCellData>>
  rowCount: number
  columnCount: number
}

// Interface pour les données de workbook Univer
interface UniverWorkbookData {
  id: string
  name: string
  sheetOrder: string[]
  sheets: Record<string, UniverSheetData>
}

// Instance Univer singleton pour les traductions
class TranslationUniverUtils {
  private static univerInstance: Univer | null = null

  /**
   * Obtient l'instance Univer singleton
   */
  private static getUniverInstance(): Univer {
    if (!TranslationUniverUtils.univerInstance) {
      TranslationUniverUtils.univerInstance = new Univer({
        theme: 'default',
        locale: 'fr-FR',
      })

      // Registrer seulement les plugins nécessaires pour les traductions
      TranslationUniverUtils.univerInstance.registerPlugin(UniverSheetsPlugin)
    }

    return TranslationUniverUtils.univerInstance
  }

  /**
   * Crée des données de workbook Univer à partir des entrées de traduction
   */
  static createWorkbookFromTranslations(entries: TranslationEntry[], languages: string[]): UniverWorkbookData {
    const sheetId = 'translations'
    const cellData: Record<string, Record<string, UniverCellData>> = {}

    // En-têtes (ligne 0)
    const headers = ['ID', 'Namespace', 'Key', 'Category', 'Description']
    languages.forEach((lang) => {
      headers.push(`Translation_${lang}`)
    })

    const headerRow: Record<string, UniverCellData> = {}
    headers.forEach((header, colIndex) => {
      headerRow[colIndex.toString()] = {
        v: header,
        t: 1 // string type
      }
    })
    cellData['0'] = headerRow

    // Données (lignes 1+)
    entries.forEach((entry, rowIndex) => {
      const dataRow: Record<string, UniverCellData> = {}
      
      // Colonnes fixes
      const rowData = [
        entry.id,
        entry.namespace,
        entry.key,
        entry.category || '',
        entry.description || ''
      ]

      // Ajouter les traductions pour chaque langue
      languages.forEach((lang) => {
        rowData.push(entry.translations[lang] || '')
      })

      rowData.forEach((value, colIndex) => {
        dataRow[colIndex.toString()] = {
          v: value,
          t: 1 // string type
        }
      })

      cellData[(rowIndex + 1).toString()] = dataRow
    })

    return {
      id: 'translations-workbook',
      name: 'Translations',
      sheetOrder: [sheetId],
      sheets: {
        [sheetId]: {
          id: sheetId,
          name: 'Translations',
          cellData,
          rowCount: entries.length + 1,
          columnCount: headers.length
        }
      }
    }
  }

  /**
   * Exporte les données Univer vers un blob Excel
   */
  static async exportWorkbookToBlob(workbookData: UniverWorkbookData): Promise<Blob> {
    try {
      const univer = TranslationUniverUtils.getUniverInstance()
      const univerSheet = univer.createUniverSheet(workbookData)
      
      // Utiliser l'API d'export d'Univer pour générer le blob Excel
      if (univerSheet && typeof univerSheet.exportAsExcel === 'function') {
        const blob = await univerSheet.exportAsExcel()
        return blob
      } else {
        throw new Error('Export API not available')
      }
    } catch (error) {
      // Fallback: créer un blob Excel basique si l'export Univer échoue
      return TranslationUniverUtils.createFallbackExcelBlob(workbookData)
    }
  }

  /**
   * Crée un blob Excel basique en cas de fallback
   */
  private static createFallbackExcelBlob(workbookData: UniverWorkbookData): Blob {
    // Créer un contenu Excel compatible (format CSV avec BOM UTF-8)
    const sheet = workbookData.sheets[workbookData.sheetOrder[0]]
    const lines: string[] = []

    for (let row = 0; row < sheet.rowCount; row++) {
      const rowKey = row.toString()
      const cells: string[] = []
      
      for (let col = 0; col < sheet.columnCount; col++) {
        const colKey = col.toString()
        const cellData = sheet.cellData[rowKey]?.[colKey]
        const value = cellData?.v || ''
        // Échapper les guillemets et virgules pour CSV
        const escapedValue = String(value).replace(/"/g, '""')
        cells.push(`"${escapedValue}"`)
      }
      
      lines.push(cells.join(','))
    }

    // Ajouter BOM UTF-8 pour la compatibilité Excel
    const BOM = '\uFEFF'
    const csvContent = BOM + lines.join('\r\n')
    
    return new Blob([csvContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }

  /**
   * Importe un fichier Excel et le convertit en données de workbook Univer
   */
  static async importExcelToWorkbook(buffer: ArrayBuffer): Promise<UniverWorkbookData | null> {
    try {
      const univer = TranslationUniverUtils.getUniverInstance()
      
      // Utiliser l'API d'import d'Univer pour lire le fichier Excel
      if (typeof univer.importExcel === 'function') {
        const workbook = await univer.importExcel(buffer)
        if (!workbook) throw new Error('Failed to import Excel')

        // Convertir en format de données standard
        const firstSheet = workbook.getActiveSheet ? workbook.getActiveSheet() : null
        if (!firstSheet) throw new Error('No active sheet')

        return TranslationUniverUtils.extractWorkbookData(firstSheet)
      } else {
        throw new Error('Import API not available')
      }
    } catch (error) {
      // Fallback: essayer de parser comme CSV/Excel basique
      return TranslationUniverUtils.parseFallbackExcel(buffer)
    }
  }

  /**
   * Extrait les données d'une feuille Univer
   */
  private static extractWorkbookData(sheet: any): UniverWorkbookData {
    const cellData: Record<string, Record<string, UniverCellData>> = {}
    
    // Obtenir les dimensions de la feuille
    const range = sheet.getUsedRange()
    const rowCount = range?.endRow ? range.endRow + 1 : 0
    const columnCount = range?.endColumn ? range.endColumn + 1 : 0

    // Extraire toutes les cellules
    for (let row = 0; row < rowCount; row++) {
      const rowData: Record<string, UniverCellData> = {}
      
      for (let col = 0; col < columnCount; col++) {
        const cell = sheet.getCell(row, col)
        if (cell) {
          rowData[col.toString()] = {
            v: cell.getValue() || '',
            t: 1 // string type par défaut
          }
        }
      }
      
      if (Object.keys(rowData).length > 0) {
        cellData[row.toString()] = rowData
      }
    }

    return {
      id: 'imported-workbook',
      name: 'Imported',
      sheetOrder: ['sheet1'],
      sheets: {
        sheet1: {
          id: 'sheet1',
          name: 'Sheet1',
          cellData,
          rowCount,
          columnCount
        }
      }
    }
  }

  /**
   * Parse un fichier Excel en fallback
   */
  private static parseFallbackExcel(buffer: ArrayBuffer): UniverWorkbookData | null {
    try {
      // Vérifier s'il s'agit d'un fichier Excel réel (signature XLSX)
      const view = new DataView(buffer)
      const signature = new Uint8Array(buffer.slice(0, 4))
      
      // Signature ZIP (XLSX est un format ZIP)
      const isZip = signature[0] === 0x50 && signature[1] === 0x4B && 
                    (signature[2] === 0x03 || signature[2] === 0x05 || signature[2] === 0x07) && 
                    (signature[3] === 0x04 || signature[3] === 0x06 || signature[3] === 0x08)
      
      if (isZip) {
        // C'est probablement un vrai fichier Excel, mais on ne peut pas le parser sans bibliothèque
        // Retourner null pour déclencher une erreur dans importFromExcel
        return null
      }

      // Essayer de parser comme CSV/texte
      let text: string
      try {
        // Essayer UTF-8 d'abord
        text = new TextDecoder('utf-8').decode(buffer)
      } catch {
        // Fallback vers windows-1252 ou latin1
        text = new TextDecoder('windows-1252').decode(buffer)
      }

      // Supprimer le BOM s'il existe
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1)
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length === 0) return null

      const cellData: Record<string, Record<string, UniverCellData>> = {}
      let maxColumns = 0

      lines.forEach((line, rowIndex) => {
        // Parser la ligne CSV/TSV
        const cells = line.includes('\t') 
          ? line.split('\t') 
          : TranslationUniverUtils.parseCSVLine(line)
        
        maxColumns = Math.max(maxColumns, cells.length)

        const rowData: Record<string, UniverCellData> = {}
        cells.forEach((cell, colIndex) => {
          rowData[colIndex.toString()] = {
            v: cell.trim(),
            t: 1 // string type
          }
        })

        cellData[rowIndex.toString()] = rowData
      })

      return {
        id: 'fallback-workbook',
        name: 'Fallback',
        sheetOrder: ['sheet1'],
        sheets: {
          sheet1: {
            id: 'sheet1',
            name: 'Sheet1',
            cellData,
            rowCount: lines.length,
            columnCount: maxColumns
          }
        }
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Parse une ligne CSV en tenant compte des guillemets
   */
  private static parseCSVLine(line: string): string[] {
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
      } else if (char === ',' && !inQuotes) {
        // Séparateur de cellule
        result.push(current)
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }

    result.push(current)
    return result
  }

  /**
   * Convertit les données de workbook Univer en tableau 2D
   */
  static extractDataFromWorkbook(workbook: UniverWorkbookData): any[][] {
    const firstSheetId = workbook.sheetOrder[0]
    const sheet = workbook.sheets[firstSheetId]
    
    if (!sheet) return []

    const result: any[][] = []
    
    for (let row = 0; row < sheet.rowCount; row++) {
      const rowKey = row.toString()
      const rowData: any[] = []
      
      for (let col = 0; col < sheet.columnCount; col++) {
        const colKey = col.toString()
        const cellData = sheet.cellData[rowKey]?.[colKey]
        rowData.push(cellData?.v || '')
      }
      
      result.push(rowData)
    }
    
    return result
  }
}

// Exporter les traductions en Excel
export const exportToExcel = (entries: TranslationEntry[], languages: string[]): Blob => {
  try {
    // Créer les données de workbook Univer
    const workbookData = TranslationUniverUtils.createWorkbookFromTranslations(entries, languages)
    
    // Note: Cette fonction doit rester synchrone pour maintenir la compatibilité API
    // On utilise le fallback synchrone qui génère un format CSV compatible Excel
    return TranslationUniverUtils.createFallbackExcelBlob(workbookData)
  } catch (error) {
    // Fallback d'urgence: créer un blob vide valide
    return new Blob([''], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    const buffer = await file.arrayBuffer()
    
    // Utiliser Univer pour lire le fichier Excel
    const workbook = await TranslationUniverUtils.importExcelToWorkbook(buffer)
    if (!workbook) {
      result.errors.push('Impossible de lire le fichier Excel')
      return result
    }

    // Extraire les données sous forme de tableau 2D
    const rawData = TranslationUniverUtils.extractDataFromWorkbook(workbook)
    if (rawData.length === 0) {
      result.errors.push('Fichier vide')
      return result
    }

    // Première ligne = en-têtes, reste = données
    const headers = rawData[0] as string[]
    const dataRows = rawData.slice(1)

    // Convertir en format objet comme le faisait XLSX.utils.sheet_to_json
    const data = dataRows.map((row) => {
      const rowObj: any = {}
      headers.forEach((header, index) => {
        rowObj[header] = row[index] || ''
      })
      return rowObj
    })

    const entriesMap = new Map(existingEntries.map((e) => [e.id, e]))

    data.forEach((row: any, index) => {
      try {
        const id = row.ID
        if (!id) {
          result.warnings.push(`Ligne ${index + 2}: ID manquant`)
          result.skipped++
          return
        }

        const translations: Record<string, string> = {}
        Object.keys(row).forEach((key) => {
          if (key.startsWith('Translation_')) {
            const lang = key.replace('Translation_', '')
            translations[lang] = row[key] || ''
          }
        })

        if (entriesMap.has(id)) {
          // Mise à jour
          const existing = entriesMap.get(id)!
          existing.translations = { ...existing.translations, ...translations }
          existing.updatedAt = new Date()
          result.updated++
        } else {
          // Nouvelle entrée
          const newEntry: TranslationEntry = {
            id,
            namespace: row.Namespace || '',
            key: row.Key || '',
            fullKey: id,
            translations,
            category: row.Category || determineCategory(row.Namespace || '', row.Key || ''),
            description: row.Description || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          entriesMap.set(id, newEntry)
          result.imported++
        }
      } catch (error) {
        result.errors.push(`Ligne ${index + 2}: ${error}`)
      }
    })

    result.success = true
  } catch (error) {
    result.errors.push(`Erreur d'import: ${error}`)
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.success
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

    if (!response.ok) {
      // Retourner les traductions de base si l'API échoue
      return baseTranslations
    }

    const result = await response.json()

    if (result.success && result.data.overrides) {
      const overrides = result.data.overrides

      // Appliquer les overrides aux traductions de base
      return baseTranslations.map((entry) => {
        if (overrides[entry.id]) {
          return {
            ...entry,
            // Fusionner les traductions : base + overrides
            translations: {
              ...entry.translations,
              ...overrides[entry.id].translations,
            },
            // Marquer comme modifié si des overrides existent
            isModified: true,
            updatedAt: new Date(overrides[entry.id].updatedAt),
            updatedBy: overrides[entry.id].updatedBy,
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
  return baseTranslations.map((entry) => ({
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      message: `Erreur lors de l'import: ${error}`,
    }
  }
}
