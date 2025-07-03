/**
 * ⚡ SELECTORS ZUSTAND OPTIMISÉS - TopSteel ERP
 * Sélecteurs granulaires pour éviter les re-renders inutiles
 */
import { shallow } from 'zustand/shallow'

// TYPE GÉNÉRIQUE POUR LES STORES
type StoreSelector<T, R> = (state: T) => R

/**
 * Créateur de sélecteurs optimisés
 */
export function createOptimizedSelectors<T>(useStore: (selector: StoreSelector<T, any>) => any) {
  return {
    // Sélecteur avec shallow comparison
    useShallow: <R>(selector: StoreSelector<T, R>) => 
      useStore(selector, shallow),

    // Sélecteur avec égalité profonde
    useDeep: <R>(selector: StoreSelector<T, R>, equalityFn?: (a: R, b: R) => boolean) => 
      useStore(selector, equalityFn),

    // Sélecteur simple (re-render à chaque changement)
    useSimple: <R>(selector: StoreSelector<T, R>) => 
      useStore(selector),
  }
}

/**
 * Hook de sélection optimisé générique
 */
export function useOptimizedSelector<T, R>(
  useStore: (selector: StoreSelector<T, any>) => any,
  selector: StoreSelector<T, R>,
  optimizationType: 'shallow' | 'deep' | 'simple' = 'shallow'
) {
  switch (optimizationType) {
    case 'shallow':
      return useStore(selector, shallow)
    case 'deep':
      return useStore(selector)
    case 'simple':
    default:
      return useStore(selector)
  }
}

/**
 * Mémoïsation avancée pour les sélecteurs
 */
export function createMemoizedSelector<T, R>(
  selector: StoreSelector<T, R>,
  dependencies?: any[]
): StoreSelector<T, R> {
  let lastResult: R
  let lastDeps: any[]

  return (state: T): R => {
    // Vérifier si les dépendances ont changé
    if (dependencies && lastDeps && 
        dependencies.length === lastDeps.length &&
        dependencies.every((dep, i) => dep === lastDeps[i])) {
      return lastResult
    }

    const result = selector(state)
    lastResult = result
    lastDeps = dependencies ? [...dependencies] : []
    
    return result
  }
}

// EXEMPLES D'USAGE POUR TOPSTEEL
/*
// Dans votre store app.store.ts :
import { createOptimizedSelectors } from '@/lib/optimized-selectors'

const selectors = createOptimizedSelectors(useAppStore)

export const useTheme = () => selectors.useSimple(state => state.theme)
export const useUser = () => selectors.useShallow(state => state.user)
export const useUISettings = () => selectors.useShallow(state => ({
  sidebarCollapsed: state.ui?.sidebarCollapsed,
  layoutMode: state.ui?.layoutMode,
  showTooltips: state.ui?.showTooltips
}))

// Dans vos composants :
const theme = useTheme()
const user = useUser()
const uiSettings = useUISettings()
*/
