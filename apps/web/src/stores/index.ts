/**
 * 📦 EXPORTS CENTRALISÉS DES STORES - TopSteel ERP
 * Point d'entrée unique pour tous les stores et utilitaires
 * Version corrigée - Évite les conflits d'exports avec @erp/types
 * Fichier: apps/web/src/stores/index.ts
 */


// Import des stores pour les helpers
import { StoreMonitor } from '@/lib/store-utils'
import { useAppStore } from './app.store'
import { useAuthStore } from './auth.store'
import { useProjetStore } from './projet.store'

// ===== STORES ZUSTAND =====
export {
    useAppError,
    useAppLoading, useAppOnlineStatus, useAppSession, useAppStore, useAppTheme, useAppUser
} from './app.store'

export {
    useAuthCanAccess, useAuthError, useAuthIsAuthenticated,
    useAuthLoading, useAuthPermissions,
    useAuthRole, useAuthSessionTimeLeft, useAuthStore,
    useAuthUser, useAuthUserDisplayName
} from './auth.store'

export {
    useProjetError, useProjetFilters, useProjetLoading, useProjets, useProjetStats, useProjetStore, useSelectedProjet
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

// ===== SELECTORS OPTIMISÉS =====
// Commenté temporairement pour éviter les erreurs de build
// Les sélecteurs seront réactivés une fois le fichier selectors/app.selectors.ts corrigé
/*
export {
  useTheme,
  useUser,
  useLoading,
  useError,
  useUISettings,
  useAuthState,
  useIsAuthenticated,
  useUserPermissions,
  useNotifications,
  useProjectFilters,
  useActiveProjectsCount,
  useProjectsCount
} from './selectors/app.selectors'
*/

// ===== TYPES RÉEXPORTÉS DEPUIS @erp/types (SANS CONFLIT) =====
// Note: Les types sont importés depuis @erp/types pour éviter les doublons
export type {
    // Types de base pour stores
    AppState,
    AppStore,
    AppStoreActions, BaseStoreActions, BaseStoreState,
    // Filtres existants (depuis modules respectifs)
    FacturationFilters, FilterState, InitialState, MetricsState, // depuis facturation.ts
    ProductionFilters, // depuis production.ts
    ProjetFilters, // alias vers StoreProjetFilters


    // Stats et métriques
    ProjetStats, SessionState, StoreClient, StoreConfig,
    StoreCreator, StoreNotification,
    // Types métier (alias depuis store-entities)
    StoreProjet,
    StoreUser,
    // Types UI et états
    UIState
} from '@erp/types'

// ===== TYPES SPÉCIFIQUES AUTH (locaux) =====
export type {
    LoginAttempt, LoginCredentials, SessionInfo, User
} from './auth.store'

// ===== UTILITAIRES =====
export {
    StoreMonitor, StoreUtils
} from '@/lib/store-utils'

export {
    createOptimizedSelectors,
    useOptimizedSelector
} from '@/lib/optimized-selectors'

// ===== CONSTANTES ET CONFIG =====
export const STORE_VERSION = '2.1.0'
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
   * Nettoyer tous les stores persistés
   */
  clearAllStores: () => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key))
      return true
    } catch {
      return false
    }
  },
  
  /**
   * Exporter l'état de tous les stores
   */
  exportStores: () => {
    try {
      const stores: Record<string, any> = {}
      
      // Exporter les stores principaux
      stores.app = useAppStore.getState()
      stores.auth = useAuthStore.getState()
      stores.projet = useProjetStore.getState()
      
      return {
        stores,
        timestamp: Date.now(),
        version: STORE_VERSION
      }
    } catch (error) {
      console.error('Erreur lors de l\'export des stores:', error)
      return null
    }
  },
  
  /**
   * Importer l'état des stores
   */
  importStores: (data: any) => {
    try {
      if (!data || !data.stores) {
        throw new Error('Données d\'import invalides')
      }
      
      if (data.stores.app) {
        useAppStore.setState(data.stores.app)
      }
      
      if (data.stores.auth) {
        useAuthStore.setState(data.stores.auth)
      }

      if (data.stores.projet) {
        useProjetStore.setState(data.stores.projet)
      }
      
      console.log('Stores importés avec succès')
      return true
    } catch (error) {
      console.error('Erreur lors de l\'import des stores:', error)
      return false
    }
  },
  
  /**
   * Obtenir les statistiques des stores
   */
  getStoreStats: () => {
    try {
      return {
        app: {
          size: JSON.stringify(useAppStore.getState()).length,
          lastUpdate: useAppStore.getState().lastUpdate
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
    
    return {
      valid: issues.length === 0,
      issues
    }
  }
}

// ===== GESTIONNAIRE GLOBAL DES STORES =====
export class StoreManager {
  private static config = {
    enableDevtools: process.env.NODE_ENV === 'development',
    enablePersistence: true,
    enableMonitoring: process.env.NODE_ENV === 'development',
    storagePrefix: STORAGE_PREFIX,
    version: STORE_VERSION,
    autoValidation: process.env.NODE_ENV === 'development'
  }

  static configure(config: Partial<typeof StoreManager.config>) {
    this.config = { ...this.config, ...config }
  }

  static getConfig() {
    return { ...this.config }
  }

  static async initializeStores() {
    try {
      console.log('🚀 Initialisation des stores TopSteel ERP...')
      
      if (this.config.enableMonitoring) {
        StoreMonitor.enable()
        console.log('📊 Monitoring des stores activé')
      }

      await this.checkAndMigrateStores()

      if (this.config.autoValidation) {
        const validation = storeHelpers.validateStores()
        if (!validation.valid) {
          console.warn('⚠️ Problèmes détectés dans les stores:', validation.issues)
        } else {
          console.log('✅ Validation des stores réussie')
        }
      }

      console.log('📦 Stores initialisés avec succès')
      return true
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des stores:', error)
      return false
    }
  }

  private static async checkAndMigrateStores() {
    try {
      const currentVersion = localStorage.getItem(`${STORAGE_PREFIX}-version`)
      
      if (!currentVersion || currentVersion !== this.config.version) {
        console.log(`🔄 Migration de la version ${currentVersion || 'inconnue'} vers ${this.config.version}`)
        
        // Sauvegarder la nouvelle version
        localStorage.setItem(`${STORAGE_PREFIX}-version`, this.config.version!)
        console.log('✅ Migration terminée')
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la migration des stores:', error)
      storeHelpers.clearAllStores()
    }
  }

  static getStoresList() {
    return [
      'app-store',
      'auth-store',
      'projet-store'
    ]
  }

  static async resetAllStores() {
    try {
      storeHelpers.clearAllStores()
      
      useAppStore.getState().reset()
      useAuthStore.getState().reset()
      useProjetStore.getState().reset()
      
      StoreMonitor.reset()
      
      console.log('🔄 Tous les stores ont été réinitialisés')
      return true
    } catch (error) {
      console.error('Erreur lors du reset des stores:', error)
      return false
    }
  }

  static async performHealthCheck() {
    const health = {
      status: 'healthy' as 'healthy' | 'warning' | 'error',
      checks: [] as Array<{ name: string; status: 'ok' | 'warning' | 'error'; message?: string }>,
      timestamp: Date.now()
    }

    try {
      useAppStore.getState()
      health.checks.push({ name: 'App Store', status: 'ok' })
      
      useAuthStore.getState()
      health.checks.push({ name: 'Auth Store', status: 'ok' })

      useProjetStore.getState()
      health.checks.push({ name: 'Projet Store', status: 'ok' })
      
      const validation = storeHelpers.validateStores()
      health.checks.push({
        name: 'Store Validation',
        status: validation.valid ? 'ok' : 'warning',
        message: validation.valid ? undefined : validation.issues.join(', ')
      })
      
      // Vérifier le localStorage
      try {
        localStorage.setItem('test', 'test')
        localStorage.removeItem('test')
        health.checks.push({ name: 'Local Storage', status: 'ok' })
      } catch {
        health.checks.push({
          name: 'Local Storage',
          status: 'error',
          message: 'Local Storage non disponible'
        })
      }
      
      if (health.checks.some(check => check.status === 'error')) {
        health.status = 'error'
      } else if (health.checks.some(check => check.status === 'warning')) {
        health.status = 'warning'
      }
      
    } catch (error) {
      health.status = 'error'
      health.checks.push({
        name: 'Health Check',
        status: 'error',
        message: `Erreur lors du health check: ${error}`
      })
    }

    return health
  }
}

// ===== HOOKS AVANCÉS =====
export const useStoreManager = () => ({
  config: StoreManager.getConfig(),
  initializeStores: StoreManager.initializeStores,
  resetAllStores: StoreManager.resetAllStores,
  performHealthCheck: StoreManager.performHealthCheck,
  exportStores: storeHelpers.exportStores,
  importStores: storeHelpers.importStores,
  validateStores: storeHelpers.validateStores,
  getStats: storeHelpers.getStoreStats,
  storesList: StoreManager.getStoresList()
})

// ===== INITIALISATION AUTOMATIQUE =====
if (typeof window !== 'undefined') {
  StoreManager.initializeStores().catch(console.error)
  
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true)
  })
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false)
  })
  
  if (process.env.NODE_ENV === 'development') {
    setInterval(async () => {
      const health = await StoreManager.performHealthCheck()
      if (health.status !== 'healthy') {
        console.warn('🏥 Health Check stores:', health)
      }
    }, 5 * 60 * 1000)
  }
}