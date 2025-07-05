/**
 * ⚡ SELECTORS ZUSTAND OPTIMISÉS - TopSteel ERP
 * Sélecteurs granulaires pour éviter les re-renders inutiles
 */
import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'

// TYPE GÉNÉRIQUE POUR LES STORES
type StoreSelector<T, R> = (state: T) => R

/**
 * ✅ Créateur de sélecteurs optimisés - HOOKS TOUJOURS APPELÉS
 */
export function createOptimizedSelectors<T>(useStore: (selector: StoreSelector<T, any>) => any) {
  return {
    // Sélecteur avec shallow comparison - TOUJOURS appelé
    useShallow: <R>(selector: StoreSelector<T, R>) => {
      return useStore(selector, useShallow)
    },

    // Sélecteur avec égalité profonde - TOUJOURS appelé
    useDeep: <R>(selector: StoreSelector<T, R>, equalityFn?: (a: R, b: R) => boolean) => {
      return useStore(selector, equalityFn)
    },

    // Sélecteur simple - TOUJOURS appelé
    useSimple: <R>(selector: StoreSelector<T, R>) => {
      return useStore(selector)
    },
  }
}

/**
 * ✅ Hook de sélection optimisé générique - HOOKS TOUJOURS APPELÉS
 */
export function useOptimizedSelector<T, R>(
  useStore: (selector: StoreSelector<T, any>) => any,
  selector: StoreSelector<T, R>,
  optimizationType: 'shallow' | 'deep' | 'simple' = 'shallow'
) {
  // ✅ TOUJOURS appeler les hooks dans le même ordre
  const shallowResult = useStore(selector, shallow)
  const deepResult = useStore(selector)
  const simpleResult = useStore(selector)

  // ✅ Sélection conditionnelle basée sur les résultats, pas les hooks
  return useMemo(() => {
    switch (optimizationType) {
      case 'shallow':
        return shallowResult
      case 'deep':
        return deepResult
      case 'simple':
      default:
        return simpleResult
    }
  }, [optimizationType, shallowResult, deepResult, simpleResult])
}

/**
 * ✅ Hook optimisé avec sélection de stratégie - VERSION SÉCURISÉE
 */
export function useSafeOptimizedSelector<T, R>(
  useStore: (selector: StoreSelector<T, any>, equalityFn?: (a: any, b: any) => boolean) => any,
  selector: StoreSelector<T, R>,
  strategy: {
    type: 'shallow' | 'deep' | 'simple'
    equalityFn?: (a: R, b: R) => boolean
  } = { type: 'shallow' }
) {
  // ✅ Déterminer la fonction d'égalité une seule fois
  const equalityFunction = useMemo(() => {
    switch (strategy.type) {
      case 'shallow':
        return shallow
      case 'deep':
        return strategy.equalityFn
      case 'simple':
      default:
        return undefined
    }
  }, [strategy.type, strategy.equalityFn])

  // ✅ Un seul appel de hook avec la bonne stratégie
  return useStore(selector, equalityFunction)
}

/**
 * ✅ Mémoïsation avancée pour les sélecteurs - VERSION AMÉLIORÉE
 */
export function createMemoizedSelector<T, R>(
  selector: StoreSelector<T, R>,
  dependencies?: any[]
): StoreSelector<T, R> {
  let lastResult: R
  let lastDeps: any[]
  let lastState: T

  return (state: T): R => {
    // Vérifier si l'état a changé
    if (lastState === state && lastResult !== undefined) {
      return lastResult
    }

    // Vérifier si les dépendances ont changé
    if (dependencies && lastDeps && 
        dependencies.length === lastDeps.length &&
        dependencies.every((dep, i) => dep === lastDeps[i])) {
      return lastResult
    }

    const result = selector(state)
    lastResult = result
    lastDeps = dependencies ? [...dependencies] : []
    lastState = state
    
    return result
  }
}

/**
 * ✅ Factory pour créer des sélecteurs performants
 */
export function createSelectorFactory<T>() {
  const selectorCache = new Map<string, any>()

  return {
    /**
     * Créer un sélecteur avec cache
     */
    create: <R>(
      key: string,
      selector: StoreSelector<T, R>,
      options: {
        memoize?: boolean
        dependencies?: any[]
        ttl?: number
      } = {}
    ): StoreSelector<T, R> => {
      const cacheKey = `${key}-${JSON.stringify(options.dependencies || [])}`
      
      if (selectorCache.has(cacheKey)) {
        return selectorCache.get(cacheKey)
      }

      let memoizedSelector = selector
      
      if (options.memoize !== false) {
        memoizedSelector = createMemoizedSelector(selector, options.dependencies)
      }

      // TTL pour le cache
      if (options.ttl) {
        setTimeout(() => {
          selectorCache.delete(cacheKey)
        }, options.ttl)
      }

      selectorCache.set(cacheKey, memoizedSelector)
      return memoizedSelector
    },

    /**
     * Nettoyer le cache
     */
    clearCache: () => {
      selectorCache.clear()
    },

    /**
     * Obtenir les statistiques du cache
     */
    getCacheStats: () => ({
      size: selectorCache.size,
      keys: Array.from(selectorCache.keys())
    })
  }
}

/**
 * ✅ Utilitaires pour les sélecteurs avec gestion d'erreur
 */
export const SelectorUtils = {
  /**
   * Sélecteur sécurisé avec valeur par défaut
   */
  withDefault: <T, R>(
    selector: StoreSelector<T, R>,
    defaultValue: R
  ): StoreSelector<T, R> => {
    return (state: T): R => {
      try {
        const result = selector(state)
        return result !== undefined && result !== null ? result : defaultValue
      } catch {
        return defaultValue
      }
    }
  },

  /**
   * Sélecteur avec transformation
   */
  withTransform: <T, R, U>(
    selector: StoreSelector<T, R>,
    transform: (value: R) => U
  ): StoreSelector<T, U> => {
    return (state: T): U => {
      const value = selector(state)
      return transform(value)
    }
  },

  /**
   * Combinateur de sélecteurs
   */
  combine: <T, R1, R2, R>(
    selector1: StoreSelector<T, R1>,
    selector2: StoreSelector<T, R2>,
    combiner: (value1: R1, value2: R2) => R
  ): StoreSelector<T, R> => {
    return (state: T): R => {
      const value1 = selector1(state)
      const value2 = selector2(state)
      return combiner(value1, value2)
    }
  },

  /**
   * Sélecteur avec cache basé sur une clé
   */
  withCache: <T, R>(
    selector: StoreSelector<T, R>,
    keySelector: StoreSelector<T, string>
  ) => {
    const cache = new Map<string, R>()
    
    return (state: T): R => {
      const key = keySelector(state)
      
      if (cache.has(key)) {
        return cache.get(key)!
      }
      
      const result = selector(state)
      cache.set(key, result)
      return result
    }
  }
}

/**
 * ✅ Hook pour mesurer les performances des sélecteurs
 */
export function useSelectorsPerformance() {
  const measurements = useMemo(() => new Map<string, number[]>(), [])

  const measureSelector = useMemo(() => {
    return <T, R>(
      name: string,
      selector: StoreSelector<T, R>
    ): StoreSelector<T, R> => {
      return (state: T): R => {
        const start = performance.now()
        const result = selector(state)
        const duration = performance.now() - start

        const history = measurements.get(name) || []
        history.push(duration)
        
        // Garder seulement les 100 dernières mesures
        if (history.length > 100) {
          history.shift()
        }
        
        measurements.set(name, history)

        // Log si c'est lent
        if (duration > 1) {
          console.warn(`Slow selector "${name}": ${duration.toFixed(2)}ms`)
        }

        return result
      }
    }
  }, [measurements])

  const getStats = useMemo(() => {
    return (name: string) => {
      const history = measurements.get(name) || []
      if (history.length === 0) return null

      const avg = history.reduce((a, b) => a + b, 0) / history.length
      const max = Math.max(...history)
      const min = Math.min(...history)

      return { avg, max, min, count: history.length }
    }
  }, [measurements])

  return { measureSelector, getStats }
}

// ✅ EXEMPLES D'USAGE POUR TOPSTEEL - SÉCURISÉS
/*
// Dans votre store app.store.ts :
import { createOptimizedSelectors, createSelectorFactory } from '@/lib/optimized-selectors'

const selectors = createOptimizedSelectors(useAppStore)
const selectorFactory = createSelectorFactory<AppState>()

// Sélecteurs optimisés
export const useTheme = () => selectors.useSimple(state => state.theme)
export const useUser = () => selectors.useShallow(state => state.user)

// Sélecteur avec cache et transformation
export const useUISettings = () => selectors.useShallow(
  selectorFactory.create(
    'ui-settings',
    SelectorUtils.withDefault(
      state => ({
        sidebarCollapsed: state.ui?.sidebarCollapsed,
        layoutMode: state.ui?.layoutMode,
        showTooltips: state.ui?.showTooltips
      }),
      { sidebarCollapsed: false, layoutMode: 'default', showTooltips: true }
    ),
    { memoize: true, ttl: 60000 }
  )
)

// Dans vos composants :
const theme = useTheme()
const user = useUser()
const uiSettings = useUISettings()
*/