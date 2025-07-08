/**
 * ⚡ SÉLECTEURS ZUSTAND OPTIMISÉS FINAUX - TopSteel ERP
 * Version robuste avec typage strict et sans warnings ESLint/React
 * Fichier: apps/web/src/lib/optimized-selectors.ts
 */
import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'

// ===== TYPES FONDAMENTAUX STRICTS =====
type StoreSelector<T, R> = (state: T) => R
type EqualityFn<T> = (a: T, b: T) => boolean

/**
 * Interface Zustand typée strictement
 */
interface TypedZustandStore<T> {
  <R>(selector: StoreSelector<T, R>): R
  <R>(selector: StoreSelector<T, R>, equalityFn: EqualityFn<R>): R
  (): T
  getState(): T
  setState(partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean): void
  subscribe(listener: (state: T, prevState: T) => void): () => void
}

// ===== STRATÉGIES D'OPTIMISATION =====
export enum SelectorStrategy {
  SIMPLE = 'simple',
  SHALLOW = 'shallow',
  DEEP = 'deep',
  SAFE = 'safe',
}

// ===== CONFIGURATION DES SÉLECTEURS =====
export interface SelectorOptions<R> {
  strategy?: SelectorStrategy
  equalityFn?: EqualityFn<R>
  defaultValue?: R
  debugLabel?: string
}

// ===== CACHE MÉMOÏSÉ POUR PERFORMANCES =====
interface MemoCache<R> {
  value: R
  timestamp: number
  hitCount: number
}

class SelectorMemoCache {
  private static cache = new Map<string, MemoCache<any>>()
  private static maxSize = 100
  private static defaultTTL = 5000

  static get<R>(key: string, ttl: number = SelectorMemoCache.defaultTTL): R | undefined {
    const entry = SelectorMemoCache.cache.get(key)

    if (!entry) return undefined

    const now = Date.now()

    if (now - entry.timestamp > ttl) {
      SelectorMemoCache.cache.delete(key)

      return undefined
    }

    entry.hitCount++

    return entry.value
  }

  static set<R>(key: string, value: R): void {
    const now = Date.now()

    SelectorMemoCache.cache.set(key, {
      value,
      timestamp: now,
      hitCount: 1,
    })

    // Nettoyage du cache si trop grand
    if (SelectorMemoCache.cache.size > SelectorMemoCache.maxSize) {
      const entries = Array.from(SelectorMemoCache.cache.entries())
      const sortedByUsage = entries.sort((a, b) => a[1].hitCount - b[1].hitCount)
      const toDelete = sortedByUsage.slice(0, Math.floor(SelectorMemoCache.maxSize * 0.3))

      toDelete.forEach(([key]) => SelectorMemoCache.cache.delete(key))
    }
  }

  static clear(): void {
    SelectorMemoCache.cache.clear()
  }

  static getEntries(): Array<[string, MemoCache<any>]> {
    return Array.from(SelectorMemoCache.cache.entries())
  }
}

// ===== CRÉATEUR DE SÉLECTEURS OPTIMISÉS TYPÉ =====
export function createOptimizedSelectors<T>(useStore: TypedZustandStore<T>) {
  return {
    /**
     * Sélecteur avec shallow comparison - Optimal pour les objets
     */
    useShallow: <R>(selector: StoreSelector<T, R>, debugLabel?: string) => {
      const result = useStore(selector, shallow as EqualityFn<R>)

      if (process.env.NODE_ENV === 'development' && debugLabel) {
        console.debug(`🔍 [${debugLabel}] Shallow selector called`)
      }

      return result
    },

    /**
     * Sélecteur avec égalité profonde personnalisée
     */
    useDeep: <R>(
      selector: StoreSelector<T, R>,
      equalityFn: EqualityFn<R> = Object.is,
      debugLabel?: string
    ) => {
      const result = useStore(selector, equalityFn)

      if (process.env.NODE_ENV === 'development' && debugLabel) {
        console.debug(`🔍 [${debugLabel}] Deep selector called`)
      }

      return result
    },

    /**
     * Sélecteur simple sans optimisation spéciale
     */
    useSimple: <R>(selector: StoreSelector<T, R>, debugLabel?: string) => {
      const result = useStore(selector)

      if (process.env.NODE_ENV === 'development' && debugLabel) {
        console.debug(`🔍 [${debugLabel}] Simple selector called`)
      }

      return result
    },

    /**
     * Sélecteur avec valeur par défaut sécurisée
     */
    useSafe: <R>(selector: StoreSelector<T, R>, defaultValue: R, debugLabel?: string) => {
      const safeSelector = useMemo(
        () => (state: T) => {
          try {
            const result = selector(state)

            return result ?? defaultValue
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Selector error in ${debugLabel || 'unknown'}:`, error)
            }

            return defaultValue
          }
        },
        [selector, defaultValue, debugLabel]
      )

      return useStore(safeSelector, shallow as EqualityFn<R>)
    },

    /**
     * Sélecteur avec transformation des données
     */
    useTransformed: <R, U>(
      selector: StoreSelector<T, R>,
      transform: (value: R) => U,
      options: {
        equalityFn?: EqualityFn<U>
        debugLabel?: string
      } = {}
    ) => {
      const { equalityFn = shallow as EqualityFn<U>, debugLabel } = options

      const transformedSelector = useMemo(
        () => (state: T) => {
          try {
            return transform(selector(state))
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Transform error in ${debugLabel || 'unknown'}:`, error)
            }
            throw error
          }
        },
        [selector, transform, debugLabel]
      )

      return useStore(transformedSelector, equalityFn)
    },

    /**
     * Sélecteur avec filtre dynamique
     */
    useFiltered: <R extends readonly any[]>(
      selector: StoreSelector<T, R>,
      filterFn: (item: R[number]) => boolean,
      debugLabel?: string
    ): R => {
      const filteredSelector = useMemo(
        () => (state: T) => {
          const items = selector(state)

          if (!items || !Array.isArray(items)) return [] as unknown as R

          return items.filter(filterFn) as unknown as R
        },
        [selector, filterFn]
      )

      const result = useStore(filteredSelector, shallow as EqualityFn<R>)

      if (process.env.NODE_ENV === 'development' && debugLabel) {
        console.debug(`🔍 [${debugLabel}] Filtered selector: ${(result as any)?.length || 0} items`)
      }

      return result
    },

    /**
     * Sélecteur mémoïsé avec cache persistant (version simplifiée)
     */
    useMemoized: <R>(
      selector: StoreSelector<T, R>,
      options: {
        ttl?: number
        cacheKey?: string
        debugLabel?: string
      } = {}
    ) => {
      const { ttl = 5000, cacheKey, debugLabel } = options

      const memoizedSelector = useMemo(() => {
        return (state: T): R => {
          // Générer clé de cache simple
          const key = cacheKey || `${debugLabel || 'memo'}-${Date.now()}`

          // Vérifier le cache
          const cached = SelectorMemoCache.get<R>(key, ttl)

          if (cached !== undefined) {
            return cached
          }

          // Calculer et mettre en cache
          const result = selector(state)

          SelectorMemoCache.set(key, result)

          return result
        }
      }, [selector, ttl, cacheKey, debugLabel])

      return useStore(memoizedSelector, shallow as EqualityFn<R>)
    },

    /**
     * Nettoyer le cache des sélecteurs mémoïsés
     */
    clearMemoCache: () => {
      SelectorMemoCache.clear()
      if (process.env.NODE_ENV === 'development') {
        console.debug('🧹 Memo cache cleared')
      }
    },

    /**
     * Statistiques du cache
     */
    getCacheStats: () => {
      const entries = SelectorMemoCache.getEntries()

      return {
        size: entries.length,
        entries: entries.map(([key, value]) => ({
          key,
          hitCount: value.hitCount,
          age: Date.now() - value.timestamp,
        })),
      }
    },
  }
}

/**
 * Hook optimisé unifié avec stratégie configurable
 */
export function useOptimizedSelector<T, R>(
  useStore: TypedZustandStore<T>,
  selector: StoreSelector<T, R>,
  options: SelectorOptions<R> = {}
): R {
  const { strategy = SelectorStrategy.SHALLOW, equalityFn, defaultValue, debugLabel } = options

  // Créer la fonction d'égalité appropriée
  const finalEqualityFn = useMemo(() => {
    if (equalityFn) return equalityFn

    switch (strategy) {
      case SelectorStrategy.SHALLOW:
        return shallow as EqualityFn<R>
      case SelectorStrategy.DEEP:
        return (a: R, b: R) => JSON.stringify(a) === JSON.stringify(b)
      case SelectorStrategy.SAFE:
      case SelectorStrategy.SIMPLE:
      default:
        return Object.is
    }
  }, [strategy, equalityFn])

  // Créer le sélecteur sécurisé
  const safeSelector = useMemo(() => {
    if (defaultValue === undefined) return selector

    return (state: T): R => {
      try {
        const result = selector(state)

        return result ?? defaultValue
      } catch (error) {
        if (process.env.NODE_ENV === 'development' && debugLabel) {
          console.warn(`⚠️ Selector error in ${debugLabel}:`, error)
        }

        return defaultValue
      }
    }
  }, [selector, defaultValue, debugLabel])

  // Toujours appeler useStore de la même façon
  const result = useStore(safeSelector, finalEqualityFn)

  if (process.env.NODE_ENV === 'development' && debugLabel) {
    console.debug(`🔍 [${debugLabel}] Strategy: ${strategy}, Result:`, result)
  }

  return result
}

/**
 * Créateur de sélecteurs mémoïsés avancés
 */
export function createMemoizedSelector<T, R>(
  selector: StoreSelector<T, R>,
  options: {
    maxCacheSize?: number
    ttl?: number
    keySelector?: (state: T) => string
  } = {}
): StoreSelector<T, R> {
  const { maxCacheSize = 10, ttl = 5000, keySelector } = options

  const cache = new Map<string, MemoCache<R>>()
  let lastState: T | undefined
  let lastResult: R | undefined

  return (state: T): R => {
    // Optimisation rapide: même état = même résultat
    if (lastState === state && lastResult !== undefined) {
      return lastResult
    }

    // Générer la clé de cache
    const cacheKey = keySelector ? keySelector(state) : JSON.stringify(state)

    const now = Date.now()
    const cached = cache.get(cacheKey)

    // Vérifier le cache
    if (cached && now - cached.timestamp < ttl) {
      cached.hitCount++
      lastState = state
      lastResult = cached.value

      return cached.value
    }

    // Calculer la nouvelle valeur
    const value = selector(state)

    // Mettre en cache
    cache.set(cacheKey, {
      value,
      timestamp: now,
      hitCount: 1,
    })

    // Nettoyage du cache
    if (cache.size > maxCacheSize) {
      const entries = Array.from(cache.entries())
      const sortedByUsage = entries.sort((a, b) => a[1].hitCount - b[1].hitCount)
      const toDelete = sortedByUsage.slice(0, Math.floor(maxCacheSize * 0.3))

      toDelete.forEach(([key]) => cache.delete(key))
    }

    lastState = state
    lastResult = value

    return value
  }
}

/**
 * Utilitaires pour le debugging des sélecteurs
 */
export const selectorDebugUtils = {
  /**
   * Wrapper pour tracer les appels de sélecteur
   */
  trace: <T, R>(selector: StoreSelector<T, R>, label: string): StoreSelector<T, R> => {
    if (process.env.NODE_ENV !== 'development') {
      return selector
    }

    return (state: T): R => {
      const start = performance.now()
      const result = selector(state)
      const duration = performance.now() - start

      console.debug(`🔍 [${label}] Duration: ${duration.toFixed(2)}ms`, {
        state,
        result,
        duration,
      })

      return result
    }
  },

  /**
   * Comparer les performances de différents sélecteurs
   */
  benchmark: <T, R>(
    selectors: Record<string, StoreSelector<T, R>>,
    state: T,
    iterations: number = 1000
  ) => {
    const results: Record<string, { averageTime: number; totalTime: number }> = {}

    Object.entries(selectors).forEach(([name, selector]) => {
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const start = performance.now()

        selector(state)
        times.push(performance.now() - start)
      }

      const totalTime = times.reduce((sum, time) => sum + time, 0)

      results[name] = {
        averageTime: totalTime / iterations,
        totalTime,
      }
    })

    console.table(results)

    return results
  },
}

// ===== EXPORTS =====
export { shallow } from 'zustand/shallow'
