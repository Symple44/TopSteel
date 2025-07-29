/**
 * Service pour gérer les overrides de traduction
 * Charge et applique les modifications de traduction depuis l'API
 */

import type { Translations } from './types'
import { safeFetch } from '@/utils/fetch-safe'
import '@/utils/init-ip-config'

export interface TranslationOverride {
  id: string
  translations: Record<string, string>
  updatedAt: string
  updatedBy: string
}

class TranslationOverrideService {
  private overrides: Record<string, TranslationOverride> = {}
  private isLoaded = false
  private loadPromise: Promise<void> | null = null

  /**
   * Charge les overrides depuis l'API
   */
  async loadOverrides(): Promise<void> {
    // Si déjà en cours de chargement, retourner la promesse existante
    if (this.loadPromise) {
      return this.loadPromise
    }

    // Si déjà chargé, ne pas recharger
    if (this.isLoaded) {
      return Promise.resolve()
    }

    this.loadPromise = this.fetchOverrides()
    return this.loadPromise
  }

  private async fetchOverrides(): Promise<void> {
    try {
      const response = await safeFetch('/api/translations/overrides', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Pas besoin d'authentification pour lire les traductions
      })

      if (!response.ok) {
        console.warn(`Failed to load translation overrides: ${response.status}`)
        return
      }

      const data = await response.json()
      if (data.success && data.overrides) {
        this.overrides = data.overrides
        this.isLoaded = true
        
        // Stocker dans localStorage pour un accès offline
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('topsteel-translation-overrides', JSON.stringify(this.overrides))
            localStorage.setItem('topsteel-translation-overrides-timestamp', Date.now().toString())
          } catch (e) {
            console.warn('Failed to cache translation overrides:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error loading translation overrides:', error)
      
      // Essayer de charger depuis le cache localStorage
      this.loadFromCache()
    } finally {
      this.loadPromise = null
    }
  }

  /**
   * Charge les overrides depuis le cache localStorage
   */
  private loadFromCache(): void {
    if (typeof window === 'undefined') return

    try {
      const cached = localStorage.getItem('topsteel-translation-overrides')
      const timestamp = localStorage.getItem('topsteel-translation-overrides-timestamp')
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp)
        // Utiliser le cache s'il a moins de 24 heures
        if (age < 24 * 60 * 60 * 1000) {
          this.overrides = JSON.parse(cached)
          this.isLoaded = true
          console.log('Loaded translation overrides from cache')
        }
      }
    } catch (e) {
      console.warn('Failed to load translation overrides from cache:', e)
    }
  }

  /**
   * Applique les overrides aux traductions de base
   */
  applyOverrides(baseTranslations: Translations): Translations {
    if (!this.isLoaded || Object.keys(this.overrides).length === 0) {
      return baseTranslations
    }

    // Créer une copie profonde des traductions
    const enhanced = JSON.parse(JSON.stringify(baseTranslations))

    // Appliquer chaque override
    Object.entries(this.overrides).forEach(([overrideId, override]) => {
      // L'ID est le chemin complet de la clé (ex: "common.buttons.save")
      const keys = overrideId.split('.')
      
      // Appliquer l'override pour chaque langue
      Object.entries(override.translations).forEach(([lang, value]) => {
        if (!enhanced[lang]) return
        
        let current = enhanced[lang]
        const lastKey = keys[keys.length - 1]
        
        // Naviguer jusqu'au parent
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {}
          }
          current = current[key]
        }
        
        // Appliquer la valeur
        current[lastKey] = value
      })
    })

    return enhanced
  }

  /**
   * Vide le cache et force un rechargement
   */
  async refresh(): Promise<void> {
    this.overrides = {}
    this.isLoaded = false
    this.loadPromise = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('topsteel-translation-overrides')
      localStorage.removeItem('topsteel-translation-overrides-timestamp')
    }
    
    return this.loadOverrides()
  }

  /**
   * Obtient un override spécifique
   */
  getOverride(key: string): TranslationOverride | null {
    return this.overrides[key] || null
  }

  /**
   * Vérifie si les overrides sont chargés
   */
  get loaded(): boolean {
    return this.isLoaded
  }
}

// Instance singleton
export const overrideService = new TranslationOverrideService()