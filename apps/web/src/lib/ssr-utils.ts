/**
 * 🔧 UTILITAIRES SSR-SAFE - TopSteel ERP
 * Outils pour gérer les erreurs SSR/hydratation et la robustesse
 * Fichier: apps/web/src/lib/ssr-utils.ts
 */

import { useEffect, useState } from 'react'

// ===== TYPES =====

interface BrowserAPI {
  window: Window | null
  document: Document | null
  navigator: Navigator | null
  localStorage: Storage | null
  sessionStorage: Storage | null
  location: Location | null
}

interface SSRSafeConfig {
  enableDebugLogs?: boolean
  fallbackValues?: Record<string, unknown>
  errorCallback?: (error: Error, context: string) => void
}

// ===== DÉTECTION D'ENVIRONNEMENT =====

/**
 * Vérifie si on est côté serveur
 */
export const isServer = typeof window === 'undefined'

/**
 * Vérifie si on est côté client
 */
export const isClient = !isServer

/**
 * Vérifie si on est en mode développement
 */
export const isDev = process.env.NODE_ENV === 'development'

/**
 * Vérifie si on est en mode production
 */
export const isProd = process.env.NODE_ENV === 'production'

// ===== ACCÈS SÉCURISÉ AUX APIS BROWSER =====

/**
 * Classe pour accéder de manière sécurisée aux APIs du navigateur
 */
export class BrowserAPIManager {
  private static instance: BrowserAPIManager | null = null
  private apis: BrowserAPI
  private config: SSRSafeConfig

  private constructor(config: SSRSafeConfig = {}) {
    this.config = {
      enableDebugLogs: isDev,
      fallbackValues: {},
      ...config,
    }

    this.apis = this?.initializeAPIs()
  }

  static getInstance(config?: SSRSafeConfig): BrowserAPIManager {
    if (!BrowserAPIManager.instance) {
      BrowserAPIManager.instance = new BrowserAPIManager(config)
    }

    return BrowserAPIManager.instance
  }

  private initializeAPIs(): BrowserAPI {
    if (isServer) {
      return {
        window: null,
        document: null,
        navigator: null,
        localStorage: null,
        sessionStorage: null,
        location: null,
      }
    }

    try {
      return {
        window,
        document,
        navigator,
        localStorage,
        sessionStorage,
        location,
      }
    } catch (error) {
      this?.handleError(error as Error, 'initializeAPIs')

      return {
        window: null,
        document: null,
        navigator: null,
        localStorage: null,
        sessionStorage: null,
        location: null,
      }
    }
  }

  private handleError(error: Error, context: string): void {
    if (this?.config?.enableDebugLogs) {
    }
    this.config.errorCallback?.(error, context)
  }

  // ===== MÉTHODES D'ACCÈS SÉCURISÉ =====

  getWindow(): Window | null {
    return this?.apis?.window
  }

  getDocument(): Document | null {
    return this?.apis?.document
  }

  getNavigator(): Navigator | null {
    return this?.apis?.navigator
  }

  getLocation(): Location | null {
    return this?.apis?.location
  }

  // ===== STORAGE SÉCURISÉ =====

  getFromStorage(key: string, storage: 'local' | 'session' = 'local'): string | null {
    try {
      const storageAPI = storage === 'local' ? this?.apis?.localStorage : this?.apis?.sessionStorage

      return storageAPI?.getItem(key) || null
    } catch (error) {
      this?.handleError(error as Error, `getFromStorage(${key})`)

      return null
    }
  }

  setToStorage(key: string, value: string, storage: 'local' | 'session' = 'local'): boolean {
    try {
      const storageAPI = storage === 'local' ? this?.apis?.localStorage : this?.apis?.sessionStorage

      storageAPI?.setItem(key, value)

      return true
    } catch (error) {
      this?.handleError(error as Error, `setToStorage(${key})`)

      return false
    }
  }

  removeFromStorage(key: string, storage: 'local' | 'session' = 'local'): boolean {
    try {
      const storageAPI = storage === 'local' ? this?.apis?.localStorage : this?.apis?.sessionStorage

      storageAPI?.removeItem(key)

      return true
    } catch (error) {
      this?.handleError(error as Error, `removeFromStorage(${key})`)

      return false
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  getUserAgent(): string {
    return this.apis.navigator?.userAgent || 'Unknown'
  }

  getCurrentURL(): string {
    return this.apis.location?.href || ''
  }

  getCurrentPathname(): string {
    return this.apis.location?.pathname || ''
  }

  getViewportSize(): { width: number; height: number } {
    if (!this?.apis?.window) {
      return { width: 1024, height: 768 } // Fallback
    }

    return {
      width: this?.apis?.window.innerWidth,
      height: this?.apis?.window.innerHeight,
    }
  }

  getScreenSize(): { width: number; height: number } {
    if (!this.apis.window?.screen) {
      return { width: 1920, height: 1080 } // Fallback
    }

    return {
      width: this?.apis?.window?.screen?.width,
      height: this?.apis?.window?.screen?.height,
    }
  }

  isOnline(): boolean {
    return this.apis.navigator?.onLine ?? true
  }

  getTimezone(): string {
    try {
      return Intl?.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'UTC'
    }
  }

  getLanguage(): string {
    return this.apis.navigator?.language || 'fr-FR'
  }
}

// ===== HOOKS REACT SSR-SAFE =====

/**
 * Hook pour l'accès sécurisé aux APIs browser
 */
export function useBrowserAPI(): BrowserAPIManager {
  const [api] = useState(() => BrowserAPIManager?.getInstance())

  return api
}

/**
 * Hook pour détecter le statut de montage
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}

/**
 * Hook pour l'hydratation sécurisée
 */
export function useHydrationSafe<T>(
  clientValue: () => T,
  serverValue: T,
  deps?: React.DependencyList
): T {
  const [value, setValue] = useState<T>(serverValue)
  const mounted = useMounted()

  // biome-ignore lint/correctness/useExhaustiveDependencies: Dependencies are correctly specified in the array
  useEffect(
    () => {
      if (mounted) {
        try {
          setValue(clientValue())
        } catch (_error) {
          setValue(serverValue)
        }
      }
    },
    deps ? [mounted, serverValue, clientValue, ...deps] : [mounted, serverValue, clientValue]
  )

  return value
}

/**
 * Hook pour les valeurs d'environnement sécurisées
 */
export function useEnvironmentValue<T>(clientValue: T, serverValue: T): T {
  return useHydrationSafe(() => clientValue, serverValue)
}

/**
 * Hook pour le localStorage SSR-safe
 */
export function useSSRSafeLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    serializer?: {
      serialize: (value: T) => string
      deserialize: (value: string) => T
    }
  } = {}
): [T, (value: T) => void, boolean] {
  const api = useBrowserAPI()
  const [isLoaded, setIsLoaded] = useState(false)

  const serializer = options.serializer || {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }

  const [storedValue, setStoredValue] = useState<T>(defaultValue)

  // biome-ignore lint/correctness/useExhaustiveDependencies: serializer.deserialize is stable
  useEffect(() => {
    try {
      const item = api?.getFromStorage(key)

      if (item !== null) {
        setStoredValue(serializer?.deserialize(item))
      }
    } catch (_error) {
    } finally {
      setIsLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, api])

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      api?.setToStorage(key, serializer?.serialize(value))
    } catch (_error) {}
  }

  return [storedValue, setValue, isLoaded]
}

// ===== UTILITIES POUR LA ROBUSTESSE =====

/**
 * Exécute du code uniquement côté client avec gestion d'erreur
 */
export function clientSide<T>(
  fn: () => T,
  fallback?: T,
  onError?: (error: Error) => void
): T | undefined {
  if (isServer) return fallback

  try {
    return fn()
  } catch (error) {
    onError?.(error as Error)
    if (isDev) {
    }

    return fallback
  }
}

/**
 * Exécute du code uniquement côté serveur avec gestion d'erreur
 */
export function serverSide<T>(
  fn: () => T,
  fallback?: T,
  onError?: (error: Error) => void
): T | undefined {
  if (isClient) return fallback

  try {
    return fn()
  } catch (error) {
    onError?.(error as Error)
    if (isDev) {
    }

    return fallback
  }
}

/**
 * Wrapper pour les fonctions potentiellement problématiques
 */
export function safeExecute<T>(fn: () => T, fallback: T, _context?: string): T {
  try {
    return fn()
  } catch (_error) {
    if (isDev) {
    }

    return fallback
  }
}

/**
 * Créer un proxy pour les objets globaux avec fallbacks
 */
export function createSafeGlobal<T extends object>(globalName: string, fallback: T): T {
  if (isServer) {
    return fallback
  }

  try {
    const globalObj = (window as typeof window & Record<string, unknown>)[globalName]
    return (globalObj as T) || fallback
  } catch {
    return fallback
  }
}

// ===== DÉTECTION DE FEATURES =====

/**
 * Détecte la disponibilité d'une feature browser
 */
export function hasFeature(feature: string): boolean {
  if (isServer) return false

  try {
    switch (feature) {
      case 'localStorage':
        return typeof Storage !== 'undefined' && 'localStorage' in window
      case 'sessionStorage':
        return typeof Storage !== 'undefined' && 'sessionStorage' in window
      case 'intersectionObserver':
        return 'IntersectionObserver' in window
      case 'performanceObserver':
        return 'PerformanceObserver' in window
      case 'webWorker':
        return typeof Worker !== 'undefined'
      case 'serviceWorker':
        return 'serviceWorker' in navigator
      case 'geolocation':
        return 'geolocation' in navigator
      case 'notification':
        return 'Notification' in window
      case 'webgl': {
        const canvas = document.createElement('canvas')

        return !!(canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl'))
      }
      default:
        return feature in window
    }
  } catch {
    return false
  }
}

/**
 * Hook pour la détection de features
 */
export function useFeatureDetection(feature: string): boolean {
  return useHydrationSafe(() => hasFeature(feature), false, [feature])
}

// ===== EXPORTS =====

// Instance globale pour faciliter l'utilisation
export const browserAPI = () => BrowserAPIManager?.getInstance()

const ssrUtils = {
  isServer,
  isClient,
  isDev,
  isProd,
  BrowserAPIManager,
  browserAPI,
  useBrowserAPI,
  useMounted,
  useHydrationSafe,
  useEnvironmentValue,
  useSSRSafeLocalStorage,
  clientSide,
  serverSide,
  safeExecute,
  createSafeGlobal,
  hasFeature,
  useFeatureDetection,
}

export default ssrUtils
