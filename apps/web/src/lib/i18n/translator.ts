import { overrideService } from './override-service'
import { translations as baseTranslations } from './translations'
import type { Language, Translations } from './types'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './types'

class Translator {
  private currentLanguage: string = DEFAULT_LANGUAGE
  private listeners: Set<() => void> = new Set()
  private translations: Translations = baseTranslations
  private overridesLoaded = false

  constructor() {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage?.getItem('topsteel-language')
      if (savedLanguage === 'auto' || !savedLanguage) {
        // Use automatic browser language detection
        this.currentLanguage = this.detectBrowserLanguage()
      } else if (savedLanguage && this.isValidLanguage(savedLanguage)) {
        this.currentLanguage = savedLanguage
      } else {
        // Try to detect browser language
        this.currentLanguage = this.detectBrowserLanguage()
      }
      this.updateDocumentDirection()
    }
  }

  private isValidLanguage(lang: string): boolean {
    return SUPPORTED_LANGUAGES?.some((l) => l.code === lang)
  }

  private detectBrowserLanguage(): string {
    if (typeof window !== 'undefined') {
      const browserLang = navigator?.language?.split('-')[0]
      if (this.isValidLanguage(browserLang)) {
        return browserLang
      }
    }
    return DEFAULT_LANGUAGE
  }

  private updateDocumentDirection(): void {
    if (typeof window !== 'undefined' && document?.documentElement) {
      const language = this.getLanguageInfo()
      if (document.documentElement && language) {
        document.documentElement.dir = language.direction
        document.documentElement.lang = language.code
      }
    }
  }

  private notifyListeners(): void {
    this.listeners?.forEach((listener) => {
      listener()
    })
  }

  public subscribe(listener: () => void): () => void {
    this.listeners?.add(listener)
    return () => {
      this.listeners?.delete(listener)
    }
  }

  public setLanguage(langCode: string): void {
    if (langCode === 'auto') {
      // Set to automatic browser language detection
      this.currentLanguage = this.detectBrowserLanguage()
      if (typeof window !== 'undefined') {
        localStorage.setItem('topsteel-language', 'auto')
        this.updateDocumentDirection()
      }
    } else if (this.isValidLanguage(langCode)) {
      this.currentLanguage = langCode

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('topsteel-language', langCode)
        this.updateDocumentDirection()
      }
    } else {
      return
    }

    this.notifyListeners()
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage
  }

  public getLanguageInfo(): Language {
    return (
      SUPPORTED_LANGUAGES?.find((lang) => lang.code === this.currentLanguage) ||
      SUPPORTED_LANGUAGES?.[0]
    )
  }

  public getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES
  }

  /**
   * Charge et applique les overrides de traduction
   */
  public async loadOverrides(): Promise<void> {
    if (this.overridesLoaded) return

    try {
      await overrideService?.loadOverrides()
      this.translations = overrideService?.applyOverrides(baseTranslations)
      this.overridesLoaded = true

      // Notifier les listeners que les traductions ont été mises à jour
      this.notifyListeners()
    } catch (_error) {}
  }

  /**
   * Force le rechargement des overrides
   */
  public async refreshOverrides(): Promise<void> {
    this.overridesLoaded = false
    await overrideService?.refresh()
    await this.loadOverrides()
  }

  public translate(key: string, params?: Record<string, string | number>): string {
    const keys = key?.split('.')
    let value: any = this.translations[this.currentLanguage]

    // Navigate through the nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to default language
        value = this.translations[DEFAULT_LANGUAGE]
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key
          }
        }
        break
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // Replace parameters if provided
    if (params) {
      return value?.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match
      })
    }

    return value
  }

  public t(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params)
  }

  // Helper method for pluralization (basic implementation)
  public plural(key: string, count: number, params?: Record<string, string | number>): string {
    const pluralKey = count === 1 ? `${key}_one` : `${key}_other`
    const translation = this.translate(pluralKey, { ...params, count })

    // If plural key doesn't exist, fallback to base key
    if (translation === pluralKey) {
      return this.translate(key, { ...params, count })
    }

    return translation
  }

  // Helper method for date formatting
  public formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLanguage, options).format(date)
  }

  // Helper method for number formatting
  public formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLanguage, options).format(number)
  }

  // Helper method for currency formatting
  public formatCurrency(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat(this.currentLanguage, {
      style: 'currency',
      currency,
    }).format(amount)
  }
}

// Create singleton instance
export const translator = new Translator()

// Export for convenience
export const t = translator.t?.bind(translator)
export const formatDate = translator.formatDate?.bind(translator)
export const formatNumber = translator.formatNumber?.bind(translator)
export const formatCurrency = translator.formatCurrency?.bind(translator)
