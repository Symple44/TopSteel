/**
 * ⚡ SELECTORS ZUSTAND OPTIMISÉS - TopSteel ERP
 * Version corrigée pour résoudre les erreurs TypeScript et améliorer la robustesse
 */
import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'

// ===== TYPES FONDAMENTAUX =====
type StoreSelector<T, R> = (state: T) => R
type EqualityFn<T> = (a: T, b: T) => boolean

/**
 * ✅ API Zustand moderne - Signature correcte
 */
interface ZustandStoreHook<T> {
  <R>(selector: StoreSelector<T, R>): R
  <R>(selector: StoreSelector<T, R>, equalityFn: EqualityFn<R>): R
}

/**
 * ✅ Créateur de sélecteurs optimisés - HOOKS REACT CORRECTS
 */
export function createOptimizedSelectors<T>(useStore: ZustandStoreHook<T>) {
  return {
    /**
     * Sélecteur avec shallow comparison
     */
    useShallow: <R>(selector: StoreSelector<T, R>) => {
      return useStore(selector, shallow as EqualityFn<R>)
    },

    /**
     * Sélecteur avec fonction d'égalité personnalisée
     */
    useDeep: <R>(selector: StoreSelector<T, R>, equalityFn?: EqualityFn<R>) => {
      return useStore(selector, equalityFn || Object.is)
    },

    /**
     * Sélecteur simple sans optimisation
     */
    useSimple: <R>(selector: StoreSelector<T, R>) => {
      return useStore(selector)
    },

    /**
     * Sélecteur avec valeur par défaut sécurisée
     */
    useSafe: <R>(selector: StoreSelector<T, R>, defaultValue: R) => {
      return useStore((state: T) => {
        try {
          const result = selector(state)
          return result ?? defaultValue
        } catch {
          return defaultValue
        }
      })
    },

    /**
     * Sélecteur avec transformation des données
     */
    useTransformed: <R, U>(
      selector: StoreSelector<T, R>,
      transform: (value: R) => U,
      equalityFn?: EqualityFn<U>
    ) => {
      const transformedSelector = useMemo(
        () => (state: T) => transform(selector(state)),
        [selector, transform]
      )
      return useStore(transformedSelector, equalityFn || shallow as EqualityFn<U>)
    }
  }
}

/**
 * ✅ Hook optimisé avec stratégie unifiée - VERSION SÉCURISÉE
 */
export function useOptimizedSelector<T, R>(
  useStore: ZustandStoreHook<T>,
  selector: StoreSelector<T, R>,
  options: {
    strategy?: 'shallow' | 'deep' | 'simple'
    equalityFn?: EqualityFn<R>
    defaultValue?: R
  } = {}
): R {
  const { strategy = 'shallow', equalityFn, defaultValue } = options

  // ✅ Préparer la fonction d'égalité une seule fois
  const finalEqualityFn = useMemo(() => {
    if (equalityFn) return equalityFn
    
    switch (strategy) {
      case 'shallow':
        return shallow as EqualityFn<R>
      case 'deep':
        return Object.is
      case 'simple':
      default:
        // ✅ Pour 'simple', utiliser Object.is au lieu d'undefined
        return Object.is
    }
  }, [strategy, equalityFn])

  // ✅ Préparer le sélecteur sécurisé une seule fois
  const safeSelector = useMemo(() => {
    if (defaultValue === undefined) return selector
    
    return (state: T): R => {
      try {
        const result = selector(state)
        return result ?? defaultValue
      } catch {
        return defaultValue
      }
    }
  }, [selector, defaultValue])

  // ✅ TOUJOURS appeler useStore de la même façon avec les mêmes arguments
  // Plus d'appels conditionnels - toujours deux paramètres
  return useStore(safeSelector, finalEqualityFn)
}

/**
 * ✅ Mémoïsation avancée pour sélecteurs - PERFORMANCE OPTIMISÉE
 */
export function createMemoizedSelector<T, R>(
  selector: StoreSelector<T, R>,
  options: {
    dependencies?: readonly unknown[]
    maxCacheSize?: number
    ttl?: number
  } = {}
): StoreSelector<T, R> {
  const { dependencies = [], maxCacheSize = 10, ttl } = options
  
  // Cache avec LRU simple
  const cache = new Map<string, { value: R; timestamp: number; hitCount: number }>()
  let lastState: T | undefined
  let lastResult: R | undefined
  let lastDeps = [...dependencies]

  return (state: T): R => {
    // Optimisation: même état = même résultat
    if (lastState === state && lastResult !== undefined) {
      return lastResult
    }

    // Optimisation: dépendances inchangées
    if (dependencies.length > 0) {
      const depsChanged = dependencies.some((dep, i) => dep !== lastDeps[i])
      if (!depsChanged && lastResult !== undefined) {
        return lastResult
      }
      lastDeps = [...dependencies]
    }

    // Clé de cache basée sur l'état et les dépendances
    const cacheKey = JSON.stringify({
      stateHash: state ? Object.keys(state as object).join('|') : 'null',
      deps: dependencies
    })

    const now = Date.now()
    const cached = cache.get(cacheKey)

    // Vérifier si le cache est valide
    if (cached && (!ttl || (now - cached.timestamp) < ttl)) {
      cached.hitCount++
      lastState = state
      lastResult = cached.value
      return cached.value
    }

    // Calculer le nouveau résultat
    const result = selector(state)

    // Nettoyer le cache si nécessaire
    if (cache.size >= maxCacheSize) {
      // Supprimer l'entrée la moins utilisée
      let leastUsed = { key: '', hitCount: Infinity }
      for (const [key, value] of cache.entries()) {
        if (value.hitCount < leastUsed.hitCount) {
          leastUsed = { key, hitCount: value.hitCount }
        }
      }
      if (leastUsed.key) cache.delete(leastUsed.key)
    }

    // Mettre en cache le nouveau résultat
    cache.set(cacheKey, {
      value: result,
      timestamp: now,
      hitCount: 1
    })

    lastState = state
    lastResult = result
    return result
  }
}

/**
 * ✅ Factory de sélecteurs avec gestion d'erreur avancée
 */
export function createSelectorFactory<T>() {
  const selectorRegistry = new Map<string, StoreSelector<T, any>>()
  const performanceMetrics = new Map<string, { calls: number; totalTime: number; errors: number }>()

  return {
    /**
     * Créer et enregistrer un sélecteur
     */
    register: <R>(
      name: string,
      selector: StoreSelector<T, R>,
      options: {
        memoize?: boolean
        dependencies?: readonly unknown[]
        onError?: (error: Error, state: T) => R
        logPerformance?: boolean
      } = {}
    ): StoreSelector<T, R> => {
      const { memoize = true, dependencies, onError, logPerformance = false } = options

      let finalSelector = selector

      // Ajouter la mémoïsation si demandée
      if (memoize) {
        finalSelector = createMemoizedSelector(finalSelector, { dependencies })
      }

      // Ajouter la gestion d'erreur
      if (onError) {
        const errorHandlingSelector = finalSelector
        finalSelector = (state: T): R => {
          try {
            return errorHandlingSelector(state)
          } catch (error) {
            const metrics = performanceMetrics.get(name) || { calls: 0, totalTime: 0, errors: 0 }
            metrics.errors++
            performanceMetrics.set(name, metrics)
            
            console.warn(`Erreur dans le sélecteur "${name}":`, error)
            return onError(error as Error, state)
          }
        }
      }

      // Ajouter le monitoring des performances
      if (logPerformance) {
        const monitoredSelector = finalSelector
        finalSelector = (state: T): R => {
          const start = performance.now()
          const result = monitoredSelector(state)
          const duration = performance.now() - start

          const metrics = performanceMetrics.get(name) || { calls: 0, totalTime: 0, errors: 0 }
          metrics.calls++
          metrics.totalTime += duration
          performanceMetrics.set(name, metrics)

          if (duration > 1) {
            console.warn(`Sélecteur lent "${name}": ${duration.toFixed(2)}ms`)
          }

          return result
        }
      }

      selectorRegistry.set(name, finalSelector)
      return finalSelector
    },

    /**
     * Obtenir un sélecteur enregistré
     */
    get: <R>(name: string): StoreSelector<T, R> | undefined => {
      return selectorRegistry.get(name) as StoreSelector<T, R> | undefined
    },

    /**
     * Obtenir les métriques de performance
     */
    getMetrics: (name?: string) => {
      if (name) {
        const metrics = performanceMetrics.get(name)
        if (metrics) {
          return {
            ...metrics,
            averageTime: metrics.totalTime / metrics.calls
          }
        }
        return null
      }
      
      const allMetrics: Record<string, any> = {}
      for (const [key, metrics] of performanceMetrics.entries()) {
        allMetrics[key] = {
          ...metrics,
          averageTime: metrics.totalTime / metrics.calls
        }
      }
      return allMetrics
    },

    /**
     * Nettoyer le registre
     */
    clear: () => {
      selectorRegistry.clear()
      performanceMetrics.clear()
    }
  }
}

/**
 * ✅ Utilitaires pour sélecteurs communs
 */
export const SelectorUtils = {
  /**
   * Combinateur de sélecteurs multiples
   */
  combine: <T, R1, R2, R>(
    selector1: StoreSelector<T, R1>,
    selector2: StoreSelector<T, R2>,
    combiner: (v1: R1, v2: R2) => R
  ): StoreSelector<T, R> => {
    return (state: T) => combiner(selector1(state), selector2(state))
  },

  /**
   * Sélecteur avec filtre
   */
  filter: <T, R>(
    selector: StoreSelector<T, R[]>,
    predicate: (item: R) => boolean
  ): StoreSelector<T, R[]> => {
    return (state: T) => selector(state).filter(predicate)
  },

  /**
   * Sélecteur avec tri
   */
  sort: <T, R>(
    selector: StoreSelector<T, R[]>,
    compareFn: (a: R, b: R) => number
  ): StoreSelector<T, R[]> => {
    return (state: T) => [...selector(state)].sort(compareFn)
  },

  /**
   * Sélecteur avec pagination
   */
  paginate: <T, R>(
    selector: StoreSelector<T, R[]>,
    page: number,
    pageSize: number
  ): StoreSelector<T, { items: R[]; total: number; hasMore: boolean }> => {
    return (state: T) => {
      const items = selector(state)
      const start = page * pageSize
      const end = start + pageSize
      
      return {
        items: items.slice(start, end),
        total: items.length,
        hasMore: end < items.length
      }
    }
  }
}

// ===== EXEMPLES D'USAGE SÉCURISÉ =====
/*
// Dans votre store (app.store.ts) :
import { createOptimizedSelectors } from '@/lib/optimized-selectors'

const selectors = createOptimizedSelectors(useAppStore)

// Sélecteurs optimisés
export const useTheme = () => selectors.useSimple(state => state.theme)
export const useUser = () => selectors.useShallow(state => state.user)
export const useUISettings = () => selectors.useShallow(state => ({
  sidebarCollapsed: state.ui?.sidebarCollapsed || false,
  layoutMode: state.ui?.layoutMode || 'default'
}))

// Avec factory
const selectorFactory = createSelectorFactory<AppState>()

export const useProjectsFiltered = (filters: ProjectFilters) => {
  const selector = selectorFactory.register(
    'projects-filtered',
    state => state.projets?.filter(p => matchesFilters(p, filters)) || [],
    { 
      memoize: true,
      dependencies: [filters],
      logPerformance: true
    }
  )
  return useAppStore(selector)
}
*/