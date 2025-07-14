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
  useAppUser,
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
  useAuthUserDisplayName,
} from './auth.store'

export {
  useProjetError,
  useProjetFilters,
  useProjetLoading,
  useProjetStats,
  useProjetStore,
  useProjets,
  useSelectedProjet,
} from './projet.store'

// ===== STORES SPÉCIALISÉS =====
// export { useStockStore } from './stock.store'
// export { useProductionStore } from './production.store'

// ===== TYPES RÉEXPORTÉS DEPUIS @erp/types (SANS CONFLIT) =====
export type {
  // Types de base pour stores
  AppState,
  AppStore,
  AppStoreActions,
  BaseStoreActions,
  BaseStoreState,
  // Filtres existants (depuis modules respectifs)
  // FacturationFilters, // TODO: À ajouter à @erp/domains
  FilterState,
  InitialState,
  MetricsState,
  // ProductionFilters, // Importé depuis @erp/domains
  // ProjetFilters, // Importé depuis @erp/domains
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
  UIState,
} from '@erp/types'

// Imports depuis @erp/domains pour les filtres migrés
import type { ProjetFilters } from '@erp/domains/core'
// TODO: OperationFilters, ProductionFilters, FacturationFilters doivent être ajoutés à @erp/domains si nécessaire

// Re-exports des filtres depuis @erp/domains
export type { ProjetFilters }
// ===== HOOKS D'AUTHENTIFICATION =====
export {
  useAuth,
  useCurrentUser,
  useIsAuthenticated,
} from '@/hooks/use-auth'

// ===== HOOKS NOTIFICATIONS =====
export {
  useCreateNotification,
  useFilteredNotifications,
  useNotifications,
  useNotificationsActions,
  useNotificationsConnection,
  useNotificationsSettings,
  useNotificationsState,
  useNotificationsStats,
} from '@/hooks/use-notifications'
// ===== HOOKS UI =====
export {
  useSidebar,
  useToasts,
  useUI,
} from '@/hooks/use-ui'
export {
  createMemoizedSelector,
  createOptimizedSelectors,
  SelectorStrategy,
  selectorDebugUtils,
  useOptimizedSelector,
} from '@/lib/optimized-selectors'
// ===== UTILITAIRES =====
export {
  StoreMonitor,
  StoreUtils,
} from '@/lib/store-utils'
// ===== TYPES SPÉCIFIQUES AUTH (locaux) =====
export type {
  LoginAttempt,
  LoginCredentials,
  SessionInfo,
  User,
} from './auth.store'
// ===== SÉLECTEURS OPTIMISÉS RÉACTIVÉS =====
export {
  // Export collectif
  appSelectors,
  useActiveProjectsCount,
  useActiveProjets,
  // Sélecteurs authentification
  useAuthState,
  // Sélecteurs métriques
  useBasicMetrics,
  useCompletedProjets,
  useCriticalNotifications,
  // Sélecteurs combinés
  useDashboardData,
  useError,
  useFilteredProjets,
  useGlobalFilters,
  useIsAuthenticated as useIsAuthenticatedSelector,
  useLayoutSettings,
  useLoading,
  useOnlineStatus,
  usePendingChanges,
  usePendingProjets,
  usePerformanceMetrics,
  // Sélecteurs filtres
  useProjectFilters,
  useProjectsCount,
  useProjectsStats,
  // Sélecteurs projets
  useProjets as useProjetsList,
  useSelectedProjet as useSelectedProjetSelector,
  useSidebarSettings,
  // Sélecteurs synchronisation
  useSyncState,
  // Sélecteurs de base
  useTheme,
  // Sélecteurs UI
  useUISettings,
  // Sélecteurs notifications
  useUnreadNotificationsCount,
  useUser,
  useUserPermissions,
} from './selectors/app.selectors'

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
          hasError: !!useAppStore.getState().error,
        },
        auth: {
          size: JSON.stringify(useAuthStore.getState()).length,
          lastUpdate: useAuthStore.getState().lastUpdate,
          isAuthenticated: useAuthStore.getState().isAuthenticated,
        },
        projet: {
          size: JSON.stringify(useProjetStore.getState()).length,
          lastUpdate: useProjetStore.getState().lastUpdate,
          projetsCount: useProjetStore.getState().projets.length,
        },
        monitor: StoreMonitor.getStats(),
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
      console.groupEnd()
    }
  },
}

// ===== GLOBAL DEVTOOLS (DÉVELOPPEMENT UNIQUEMENT) =====
if (process.env.NODE_ENV === 'development') {
  // Ajouter les stores au window pour debug
  if (typeof window !== 'undefined') {
    ;(window as typeof window & { __TOPSTEEL_STORES__?: unknown }).__TOPSTEEL_STORES__ = {
      app: useAppStore,
      auth: useAuthStore,
      projet: useProjetStore,
      helpers: storeHelpers,
      monitor: StoreMonitor,
    }
  }
}

// ===== EXPORTS PAR DÉFAUT =====
const storesExport = {
  stores: {
    useAppStore,
    useAuthStore,
    useProjetStore,
  },
  helpers: storeHelpers,
  selectors: appSelectors,
  version: STORE_VERSION,
}

export default storesExport
