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

// Selector memo cache as module-level functions
const selectorCache = new Map<string, MemoCache<unknown>>()
const maxCacheSize = 100
const defaultTTL = 5000

function getSelectorMemo<R>(key: string, ttl: number = defaultTTL): R | undefined {
  const entry = selectorCache?.get(key)

  if (!entry) return undefined

  const now = Date.now()

  if (now - entry?.timestamp > ttl) {
    selectorCache?.delete(key)

    return undefined
  }

  if (entry) {
    entry.hitCount++
  }

  return entry?.value as R
}

function setSelectorMemo<R>(key: string, value: R): void {
  const now = Date.now()

  selectorCache?.set(key, {
    value: value as unknown,
    timestamp: now,
    hitCount: 1,
  })

  // Nettoyage du cache si trop grand
  if (selectorCache?.size > maxCacheSize) {
    const entries = Array.from(selectorCache?.entries())
    const sortedByUsage = entries?.sort((a, b) => a?.[1]?.hitCount - b?.[1]?.hitCount)
    const toDelete = sortedByUsage?.slice(0, Math.floor(maxCacheSize * 0.3))

    for (const [key] of toDelete) {
      selectorCache?.delete(key)
    }
  }
}

function clearSelectorMemo(): void {
  selectorCache?.clear()
}

function getSelectorMemoEntries(): Array<[string, MemoCache<unknown>]> {
  return Array.from(selectorCache?.entries())
}

// ===== CRÉATEUR DE SÉLECTEURS OPTIMISÉS TYPÉ =====
export function createOptimizedSelectors<T>(useStore: TypedZustandStore<T>) {
  return {
    /**
     * Sélecteur avec shallow comparison - Optimal pour les objets
     */
    useShallow: <R>(selector: StoreSelector<T, R>, debugLabel?: string) => {
      const result = useStore(selector, shallow as EqualityFn<R>)

      if (process?.env?.NODE_ENV === 'development' && debugLabel) {
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

      if (process?.env?.NODE_ENV === 'development' && debugLabel) {
      }

      return result
    },

    /**
     * Sélecteur simple sans optimisation spéciale
     */
    useSimple: <R>(selector: StoreSelector<T, R>, debugLabel?: string) => {
      const result = useStore(selector)

      if (process?.env?.NODE_ENV === 'development' && debugLabel) {
      }

      return result
    },

    /**
     * Sélecteur avec valeur par défaut sécurisée
     */
    useSafe: <R>(selector: StoreSelector<T, R>, defaultValue: R, _debugLabel?: string) => {
      const safeSelector = useMemo(
        () => (state: T) => {
          try {
            const result = selector(state)

            return result ?? defaultValue
          } catch (_error) {
            if (process?.env?.NODE_ENV === 'development') {
            }

            return defaultValue
          }
        },
        [selector, defaultValue]
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
      const { equalityFn = shallow as EqualityFn<U>, debugLabel: _debugLabel } = options || {}

      const transformedSelector = useMemo(
        () => (state: T) => {
          try {
            return transform(selector(state))
          } catch (error) {
            if (process?.env?.NODE_ENV === 'development') {
            }
            throw error
          }
        },
        [selector, transform]
      )

      return useStore(transformedSelector, equalityFn)
    },

    /**
     * Sélecteur avec filtre dynamique
     */
    useFiltered: <R extends readonly unknown[]>(
      selector: StoreSelector<T, R>,
      filterFn: (item: R[number]) => boolean,
      debugLabel?: string
    ): R => {
      const filteredSelector = useMemo(
        () => (state: T) => {
          const items = selector(state)

          if (!items || !Array.isArray(items)) return [] as unknown as R

          return items?.filter(filterFn) as unknown as R
        },
        [selector, filterFn]
      )

      const result = useStore(filteredSelector, shallow as EqualityFn<R>)

      if (process?.env?.NODE_ENV === 'development' && debugLabel) {
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
      const { ttl = 5000, cacheKey, debugLabel } = options || {}

      const memoizedSelector = useMemo(() => {
        return (state: T): R => {
          // Générer clé de cache simple
          const key = cacheKey || `${debugLabel || 'memo'}-${Date.now()}`

          // Vérifier le cache
          const cached = getSelectorMemo<R>(key, ttl)

          if (cached !== undefined) {
            return cached
          }

          // Calculer et mettre en cache
          const result = selector(state)

          setSelectorMemo(key, result)

          return result
        }
      }, [selector, ttl, cacheKey, debugLabel])

      return useStore(memoizedSelector, shallow as EqualityFn<R>)
    },

    /**
     * Nettoyer le cache des sélecteurs mémoïsés
     */
    clearMemoCache: () => {
      clearSelectorMemo()
      if (process?.env?.NODE_ENV === 'development') {
      }
    },

    /**
     * Statistiques du cache
     */
    getCacheStats: () => {
      const entries = getSelectorMemoEntries()

      return {
        size: entries.length,
        entries: entries?.map(([key, value]) => ({
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
  const {
    strategy = SelectorStrategy.SHALLOW,
    equalityFn,
    defaultValue,
    debugLabel,
  } = options || {}

  // Créer la fonction d'égalité appropriée
  const finalEqualityFn = useMemo(() => {
    if (equalityFn) return equalityFn

    switch (strategy) {
      case SelectorStrategy.SHALLOW:
        return shallow as EqualityFn<R>
      case SelectorStrategy.DEEP:
        return (a: R, b: R) => JSON.stringify(a) === JSON.stringify(b)
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
      } catch (_error) {
        if (process?.env?.NODE_ENV === 'development' && debugLabel) {
        }

        return defaultValue
      }
    }
  }, [selector, defaultValue, debugLabel])

  // Toujours appeler useStore de la même façon
  const result = useStore(safeSelector, finalEqualityFn)

  if (process?.env?.NODE_ENV === 'development' && debugLabel) {
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
  const { maxCacheSize = 10, ttl = 5000, keySelector } = options || {}

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
    const cached = cache?.get(cacheKey)

    // Vérifier le cache
    if (cached && now - cached?.timestamp < ttl) {
      if (cached) {
        cached.hitCount++
      }
      lastState = state
      lastResult = cached?.value

      return cached?.value
    }

    // Calculer la nouvelle valeur
    const value = selector(state)

    // Mettre en cache
    cache?.set(cacheKey, {
      value,
      timestamp: now,
      hitCount: 1,
    })

    // Nettoyage du cache
    if (cache?.size > maxCacheSize) {
      const entries = Array.from(cache?.entries())
      const sortedByUsage = entries?.sort((a, b) => a?.[1]?.hitCount - b?.[1]?.hitCount)
      const toDelete = sortedByUsage?.slice(0, Math.floor(maxCacheSize * 0.3))

      for (const [key] of toDelete) {
        cache?.delete(key)
      }
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
  trace: <T, R>(selector: StoreSelector<T, R>, _label: string): StoreSelector<T, R> => {
    if (process?.env?.NODE_ENV !== 'development') {
      return selector
    }

    return (state: T): R => {
      const start = performance?.now()
      const result = selector(state)
      const _duration = performance?.now() - start

      return result
    }
  },

  /**
   * Comparer les performances de différents sélecteurs
   */
  benchmark: <T, R>(
    selectors: Record<string, StoreSelector<T, R>>,
    state: T,
    iterations = 1000
  ) => {
    const results: Record<string, { averageTime: number; totalTime: number }> = {}

    for (const [name, selector] of Object.entries(selectors)) {
      const times: number[] = []

      for (let i = 0; i < iterations; i++) {
        const start = performance?.now()

        selector(state)
        times?.push(performance?.now() - start)
      }

      const totalTime = times?.reduce((sum, time) => sum + time, 0)

      results[name] = {
        averageTime: totalTime / iterations,
        totalTime,
      }
    }

    return results
  },
}

// ===== EXPORTS =====
export { shallow } from 'zustand/shallow'
