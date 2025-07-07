/**
 * 📦 EXPORTS CENTRALISÉS DES STORES CORRIGÉS - TopSteel ERP
 * Point d'entrée unique pour tous les stores et utilitaires
 * Version corrigée - Types stricts, sélecteurs réactivés
 * Fichier: apps/web/src/stores/index.ts
 */

// Import des stores pour les helpers
import { StoreMonitor } from '@/lib/store-utils'
import { useAppStore } from './app.store'
import { useAuthStore } from './auth.store'
import { useProjetStore } from './projet.store'

// Import des sélecteurs
import { appSelectors } from './selectors/app.selectors'

// ===== STORES ZUSTAND =====
export {
    useAppError,
    useAppLoading,
    useAppOnlineStatus,
    useAppSession,
    useAppStore,
    useAppTheme,
    useAppUser
} from './app.store'

export {
    useAuthCanAccess,
    useAuthError,
    useAuthIsAuthenticated,
    useAuthLoading,
    useAuthPermissions,
    useAuthRole,
    useAuthSessionTimeLeft,
    useAuthStore,
    useAuthUser,
    useAuthUserDisplayName
} from './auth.store'

export {
    useProjetError,
    useProjetFilters,
    useProjetLoading,
    useProjets,
    useProjetStats,
    useProjetStore,
    useSelectedProjet
} from './projet.store'

// ===== STORES SPÉCIALISÉS =====
// export { useStockStore } from './stock.store'
// export { useProductionStore } from './production.store'

// ===== HOOKS D'AUTHENTIFICATION =====
export {
    useAuth,
    useCurrentUser,
    useIsAuthenticated
} from '@/hooks/use-auth'

// ===== HOOKS UI =====
export {
    useSidebar,
    useToasts,
    useUI
} from '@/hooks/use-ui'

// ===== HOOKS NOTIFICATIONS =====
export {
    useCreateNotification,
    useFilteredNotifications,
    useNotifications,
    useNotificationsActions,
    useNotificationsConnection,
    useNotificationsSettings,
    useNotificationsState,
    useNotificationsStats
} from '@/hooks/use-notifications'

// ===== SÉLECTEURS OPTIMISÉS RÉACTIVÉS =====
export {

    // Export collectif
    appSelectors, useActiveProjectsCount, useActiveProjets,
    // Sélecteurs authentification
    useAuthState,
    // Sélecteurs métriques
    useBasicMetrics, useCompletedProjets, useCriticalNotifications,
    // Sélecteurs combinés
    useDashboardData, useError, useFilteredProjets, useGlobalFilters, useIsAuthenticated as useIsAuthenticatedSelector, useLayoutSettings, useLoading, useOnlineStatus,
    usePendingChanges, usePendingProjets, usePerformanceMetrics,
    // Sélecteurs filtres
    useProjectFilters, useProjectsCount, useProjectsStats,
    // Sélecteurs projets
    useProjets as useProjetsList,
    useSelectedProjet as useSelectedProjetSelector, useSidebarSettings,
    // Sélecteurs synchronisation
    useSyncState,
    // Sélecteurs de base
    useTheme,
    // Sélecteurs UI
    useUISettings,
    // Sélecteurs notifications
    useUnreadNotificationsCount, useUser, useUserPermissions
} from './selectors/app.selectors'

// ===== TYPES RÉEXPORTÉS DEPUIS @erp/types (SANS CONFLIT) =====
export type {
    // Types de base pour stores
    AppState,
    AppStore,
    AppStoreActions,
    BaseStoreActions,
    BaseStoreState,

    // Filtres existants (depuis modules respectifs)
    FacturationFilters,
    FilterState,
    InitialState,
    MetricsState,
    ProductionFilters,
    ProjetFilters,

    // Stats et métriques
    ProjetStats,
    SessionState,
    StoreClient,
    StoreConfig,
    StoreCreator,
    StoreNotification,

    // Types métier (alias depuis store-entities)
    StoreProjet,
    StoreUser,

    // Types UI et états
    UIState
} from '@erp/types'

// ===== TYPES SPÉCIFIQUES AUTH (locaux) =====
export type {
    LoginAttempt,
    LoginCredentials,
    SessionInfo,
    User
} from './auth.store'

// ===== UTILITAIRES =====
export {
    StoreMonitor,
    StoreUtils
} from '@/lib/store-utils'

export {
    createMemoizedSelector, createOptimizedSelectors, selectorDebugUtils,
    SelectorStrategy, useOptimizedSelector
} from '@/lib/optimized-selectors'

// ===== CONSTANTES ET CONFIG =====
export const STORE_VERSION = '2.2.0' // Incrémenté pour les corrections
export const STORAGE_PREFIX = 'topsteel-erp'

// ===== HELPERS POUR LES STORES =====
export const storeHelpers = {
  /**
   * Créer une clé de storage unique pour un store
   */
  createStorageKey: (storeName: string) => `${STORAGE_PREFIX}-${storeName}`,
  
  /**
   * Vérifier si un store est persisté
   */
  isStorePersisted: (storeName: string) => {
    try {
      const key = storeHelpers.createStorageKey(storeName)
      return localStorage.getItem(key) !== null
    } catch {
      return false
    }
  },
  
  /**
   * Récupérer les statistiques de tous les stores
   */
  getAllStoresStats: () => {
    try {
      return {
        app: {
          size: JSON.stringify(useAppStore.getState()).length,
          lastUpdate: useAppStore.getState().lastUpdate,
          isLoading: useAppStore.getState().loading,
          hasError: !!useAppStore.getState().error
        },
        auth: {
          size: JSON.stringify(useAuthStore.getState()).length,
          lastUpdate: useAuthStore.getState().lastUpdate,
          isAuthenticated: useAuthStore.getState().isAuthenticated
        },
        projet: {
          size: JSON.stringify(useProjetStore.getState()).length,
          lastUpdate: useProjetStore.getState().lastUpdate,
          projetsCount: useProjetStore.getState().projets.length
        },
        monitor: StoreMonitor.getStats()
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error)
      return null
    }
  },
  
  /**
   * Valider la cohérence des stores
   */
  validateStores: () => {
    const issues: string[] = []
    
    try {
      const appState = useAppStore.getState()
      const authState = useAuthStore.getState()
      const projetState = useProjetStore.getState()
      
      // Validation App Store
      if (typeof appState.loading !== 'boolean') {
        issues.push('App Store: loading doit être un boolean')
      }
      
      if (appState.error !== null && typeof appState.error !== 'string') {
        issues.push('App Store: error doit être null ou string')
      }
      
      // Validation Auth Store
      if (typeof authState.isAuthenticated !== 'boolean') {
        issues.push('Auth Store: isAuthenticated doit être un boolean')
      }
      
      if (authState.isAuthenticated && !authState.user) {
        issues.push('Auth Store: utilisateur manquant malgré authentification')
      }

      // Validation Projet Store
      if (!Array.isArray(projetState.projets)) {
        issues.push('Projet Store: projets doit être un array')
      }

      if (typeof projetState.loading !== 'boolean') {
        issues.push('Projet Store: loading doit être un boolean')
      }
      
      // Cohérence entre stores
      if (appState.user && authState.user && appState.user.id !== authState.user.id) {
        issues.push('Incohérence: utilisateurs différents entre App et Auth stores')
      }
      
    } catch (error) {
      issues.push(`Erreur de validation: ${error}`)
    }
    
    return issues
  },
  
  /**
   * Réinitialiser tous les stores
   */
  resetAllStores: () => {
    try {
      useAppStore.getState().reset()
      useAuthStore.getState().reset()
      useProjetStore.getState().reset()
      console.log('✅ Tous les stores ont été réinitialisés')
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation des stores:', error)
    }
  },
  
  /**
   * Debug helper pour visualiser l'état complet
   */
  debugStoresState: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Debug Stores State')
      console.log('App Store:', useAppStore.getState())
      console.log('Auth Store:', useAuthStore.getState())
      console.log('Projet Store:', useProjetStore.getState())
      console.log('Stats:', storeHelpers.getAllStoresStats())
      console.log('Validation:', storeHelpers.validateStores())
      console.groupEnd()
    }
  }
}

// ===== GLOBAL DEVTOOLS (DÉVELOPPEMENT UNIQUEMENT) =====
if (process.env.NODE_ENV === 'development') {
  // Ajouter les stores au window pour debug
  if (typeof window !== 'undefined') {
    (window as any).__TOPSTEEL_STORES__ = {
      app: useAppStore,
      auth: useAuthStore,
      projet: useProjetStore,
      helpers: storeHelpers,
      monitor: StoreMonitor
    }
    
    console.log('🛠️ TopSteel Stores disponibles via window.__TOPSTEEL_STORES__')
  }
}

// ===== EXPORTS PAR DÉFAUT =====
const storesExport = {
  stores: {
    useAppStore,
    useAuthStore,
    useProjetStore
  },
  helpers: storeHelpers,
  selectors: appSelectors,
  version: STORE_VERSION
}

export default storesExport