import * as XLSX from 'xlsx'
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

// Exporter les traductions en Excel
export const exportToExcel = (entries: TranslationEntry[], languages: string[]): Blob => {
  const data = entries.map((entry) => {
    const row: any = {
      ID: entry.id,
      Namespace: entry.namespace,
      Key: entry.key,
      Category: entry.category || '',
      Description: entry.description || '',
    }

    languages.forEach((lang) => {
      row[`Translation_${lang}`] = entry.translations[lang] || ''
    })

    return row
  })

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Translations')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
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
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws)

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
