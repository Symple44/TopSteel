export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  direction: 'ltr' | 'rtl'
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
  },
]

export const DEFAULT_LANGUAGE = 'fr'

export type TranslationKey = string
export type TranslationValue = string | Record<string, any>
export type TranslationNamespace = Record<string, TranslationValue>
export type Translations = Record<string, TranslationNamespace>

export interface I18nContext {
  currentLanguage: Language
  setLanguage: (langCode: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isLoading: boolean
}

// Types pour l'interface admin des traductions
export interface TranslationEntry {
  id: string
  namespace: string
  key: string
  fullKey: string // namespace.key
  translations: Record<string, string>
  category?: string
  description?: string
  createdAt?: Date
  updatedAt?: Date
  updatedBy?: string
  isModified?: boolean // Indique si cette traduction a été modifiée par rapport à la base
}

export interface TranslationCategory {
  id: string
  name: string
  description?: string
  count?: number
}

export interface TranslationFilter {
  search?: string
  namespace?: string
  category?: string
  language?: string
  untranslated?: boolean
  modified?: boolean
}

export interface TranslationStats {
  total: number
  translated: Record<string, number>
  untranslated: Record<string, number>
  percentageComplete: Record<string, number>
}

export interface TranslationExport {
  version: string
  exportDate: string
  languages: string[]
  translations: TranslationEntry[]
}

export interface TranslationImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  errors: string[]
  warnings: string[]
}
