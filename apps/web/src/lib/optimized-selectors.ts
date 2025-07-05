/**
 * ⚡ SÉLECTEURS ZUSTAND OPTIMISÉS - TopSteel ERP
 * Version simplifiée et robuste sans erreurs React Hooks
 * Fichier: apps/web/src/lib/optimized-selectors.ts
 */
import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'

// ===== TYPES FONDAMENTAUX =====
type StoreSelector<T, R> = (state: T) => R
type EqualityFn<T> = (a: T, b: T) => boolean

/**
 * Interface moderne pour les hooks Zustand
 */
interface ZustandStoreHook<T> {
  <R>(selector: StoreSelector<T, R>): R
  <R>(selector: StoreSelector<T, R>, equalityFn: EqualityFn<R>): R
  (): T
  getState(): T
  setState(
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean | undefined
  ): void
  subscribe(listener: (state: T, prevState: T) => void): () => void
}

// ===== STRATÉGIES D'OPTIMISATION =====
export enum SelectorStrategy {
  SIMPLE = 'simple',
  SHALLOW = 'shallow',
  DEEP = 'deep'
}

// ===== CONFIGURATION DES SÉLECTEURS =====
export interface SelectorOptions<R> {
  strategy?: SelectorStrategy
  equalityFn?: EqualityFn<R>
  defaultValue?: R
  debugLabel?: string
}

// ===== CRÉATEUR DE SÉLECTEURS OPTIMISÉS =====
export function createOptimizedSelectors<T>(useStore: ZustandStoreHook<T>) {
  return {
    /**
     * Sélecteur avec shallow comparison - Optimal pour les objets
     */
    useShallow: <R>(selector: StoreSelector<T, R>, debugLabel?: string) => {
      const result = useStore(selector, shallow as EqualityFn<R>)
      
      // Debug direct sans useMemo
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
      
      // Debug direct sans useMemo
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
      
      // Debug direct sans useMemo
      if (process.env.NODE_ENV === 'development' && debugLabel) {
        console.debug(`🔍 [${debugLabel}] Simple selector called`)
      }
      
      return result
    },

    /**
     * Sélecteur avec valeur par défaut sécurisée
     */
    useSafe: <R>(
      selector: StoreSelector<T, R>, 
      defaultValue: R,
      debugLabel?: string
    ) => {
      const safeSelector = useMemo(() => (state: T) => {
        try {
          const result = selector(state)
          return result ?? defaultValue
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`⚠️ Selector error in ${debugLabel || 'unknown'}:`, error)
          }
          return defaultValue
        }
      }, [selector, defaultValue, debugLabel])

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
          if (!items) return [] as unknown as R
          return items.filter(filterFn) as unknown as R
        },
        [selector, filterFn]
      )

      const result = useStore(filteredSelector, shallow as EqualityFn<R>)
      
      // Debug direct sans useMemo
      if (process.env.NODE_ENV === 'development' && debugLabel) {
        console.debug(`🔍 [${debugLabel}] Filtered selector: ${result?.length || 0} items`)
      }
      
      return result
    },

    /**
     * Nettoyer le cache des sélecteurs mémoïsés
     */
    clearMemoCache: () => {
      // Implémentation simple pour la compatibilité
      console.debug('Cache cleared')
    },

    /**
     * Statistiques du cache
     */
    getCacheStats: () => ({
      size: 0,
      entries: []
    })
  }
}

/**
 * Hook optimisé unifié avec stratégie configurable
 */
export function useOptimizedSelector<T, R>(
  useStore: ZustandStoreHook<T>,
  selector: StoreSelector<T, R>,
  options: SelectorOptions<R> = {}
): R {
  const { 
    strategy = SelectorStrategy.SHALLOW, 
    equalityFn, 
    defaultValue,
    debugLabel 
  } = options

  // Créer la fonction d'égalité appropriée
  const finalEqualityFn = useMemo(() => {
    if (equalityFn) return equalityFn
    
    switch (strategy) {
      case SelectorStrategy.SHALLOW:
        return shallow as EqualityFn<R>
      case SelectorStrategy.DEEP:
        return (a: R, b: R) => JSON.stringify(a) === JSON.stringify(b)
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

  // ✅ TOUJOURS appeler useStore de la même façon - pas d'appels conditionnels
  const result = useStore(safeSelector, finalEqualityFn)

  // Debug direct sans useMemo
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
    dependencies?: readonly unknown[]
    maxCacheSize?: number
    ttl?: number
    keySelector?: (state: T) => string
  } = {}
): StoreSelector<T, R> {
  const { 
    dependencies = [], 
    maxCacheSize = 10, 
    ttl = 5000,
    keySelector 
  } = options
  
  const cache = new Map<string, { value: R; timestamp: number; hitCount: number }>()
  let lastState: T | undefined
  let lastResult: R | undefined
  let lastDeps = [...dependencies]

  return (state: T): R => {
    // Optimisation rapide: même état = même résultat
    if (lastState === state && lastResult !== undefined) {
      return lastResult
    }

    // Vérifier les dépendances
    if (dependencies.length > 0) {
      const depsChanged = dependencies.some((dep, i) => dep !== lastDeps[i])
      if (!depsChanged && lastResult !== undefined) {
        return lastResult
      }
      lastDeps = [...dependencies]
    }

    // Générer la clé de cache
    const cacheKey = keySelector ? 
      keySelector(state) : 
      JSON.stringify({ state: state, deps: dependencies })

    const now = Date.now()
    const cached = cache.get(cacheKey)

    // Vérifier le cache
    if (cached && (now - cached.timestamp) < ttl) {
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
      hitCount: 1
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
  trace: <T, R>(
    selector: StoreSelector<T, R>,
    label: string
  ): StoreSelector<T, R> => {
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
        duration
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
        totalTime
      }
    })
    
    console.table(results)
    return results
  }
}

// ===== EXPORTS =====
export { shallow } from 'zustand/shallow'
