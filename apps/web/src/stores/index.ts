/**
 * 📦 EXPORTS CENTRALISÉS DES STORES - TopSteel ERP
 * Point d'entrée unique pour tous les stores et utilitaires
 * Fichier: apps/web/src/stores/index.ts
 */

// ===== STORES ZUSTAND =====
export {
    appSelectors, useAppError, useAppLoading, useAppOnlineStatus, useAppSession, useAppStore, useAppTheme, useAppUser
} from './app.store'

// ===== STORES SPÉCIALISÉS =====
// Export des autres stores quand ils seront créés
// export { useAuthStore } from './auth.store'
// export { useProjetStore } from './projet.store' 
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
    useCreateNotification, useFilteredNotifications, useNotifications, useNotificationsActions, useNotificationsConnection, useNotificationsSettings, useNotificationsState, useNotificationsStats
} from '@/hooks/use-notifications'

// ===== SELECTORS OPTIMISÉS =====
export {
    useActiveProjectsCount,
    useNotifications as useNotificationsSelector,
    useProjectFilters,
    useProjectsCount,
    useTheme,
    useUISettings,
    useUser,
    useUserPermissions
} from './selectors/app.selectors'

// ===== TYPES PRINCIPAUX (réexportés depuis @erp/types) =====
export type {
    AppState,
    AppStore, AsyncActionConfig, BaseStoreState, FacturationFilters, FilterState, MetricsState, NotificationItem,
    NotificationState, ProductionFilters, ProjetFilters, SessionState, StockFilters, StoreConfig, UIState
} from '@erp/types'

// ===== UTILITAIRES =====
export {
    StoreMonitor, StoreUtils
} from '@/lib/store-utils'

export {
    createOptimizedSelectors,
    useOptimizedSelector
} from '@/lib/optimized-selectors'

// ===== CONSTANTES ET CONFIG =====
export const STORE_VERSION = '2.0.0'
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
    const stores: Record<string, any> = {}
    
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => {
          const storeName = key.replace(`${STORAGE_PREFIX}-`, '').replace('-storage', '')
          const data = localStorage.getItem(key)
          if (data) {
            stores[storeName] = JSON.parse(data)
          }
        })
      
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
      
      Object.entries(data.stores).forEach(([storeName, storeData]) => {
        const key = `${STORAGE_PREFIX}-${storeName}-storage`
        localStorage.setItem(key, JSON.stringify(storeData))
      })
      
      // Recharger la page pour appliquer les changements
      window.location.reload()
      return true
    } catch (error) {
      console.error('Erreur lors de l\'import des stores:', error)
      return false
    }
  }
}

// ===== TYPES DE CONFIGURATION =====
export interface StoreManagerConfig {
  enableDevtools?: boolean
  enablePersistence?: boolean
  enableMonitoring?: boolean
  storagePrefix?: string
  version?: string
}

// ===== GESTIONNAIRE GLOBAL DES STORES =====
export class StoreManager {
  private static config: StoreManagerConfig = {
    enableDevtools: process.env.NODE_ENV === 'development',
    enablePersistence: true,
    enableMonitoring: process.env.NODE_ENV === 'development',
    storagePrefix: STORAGE_PREFIX,
    version: STORE_VERSION
  }

  static configure(config: Partial<StoreManagerConfig>) {
    this.config = { ...this.config, ...config }
  }

  static getConfig() {
    return { ...this.config }
  }

  static async initializeStores() {
    try {
      // Initialiser le monitoring si activé
      if (this.config.enableMonitoring) {
        StoreMonitor.enable()
      }

      // Vérifier la version des stores et migrer si nécessaire
      await this.checkAndMigrateStores()

      console.log('📦 Stores initialisés avec succès')
      return true
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des stores:', error)
      return false
    }
  }

  private static async checkAndMigrateStores() {
    // Logique de migration des stores
    // À implémenter selon les besoins spécifiques
  }

  static getStoresList() {
    return [
      'app-store',
      // 'auth-store',
      // 'projet-store',
      // 'stock-store',
      // 'production-store'
    ]
  }

  static async resetAllStores() {
    try {
      storeHelpers.clearAllStores()
      
      // Forcer le rechargement pour réinitialiser les stores en mémoire
      window.location.reload()
      return true
    } catch (error) {
      console.error('Erreur lors du reset des stores:', error)
      return false
    }
  }
}

// ===== HOOKS AVANCÉS =====
export const useStoreManager = () => ({
  config: StoreManager.getConfig(),
  initializeStores: StoreManager.initializeStores,
  resetAllStores: StoreManager.resetAllStores,
  exportStores: storeHelpers.exportStores,
  importStores: storeHelpers.importStores,
  storesList: StoreManager.getStoresList()
})

// ===== INITIALISATION AUTOMATIQUE =====
if (typeof window !== 'undefined') {
  // Initialiser les stores au chargement de l'application
  StoreManager.initializeStores().catch(console.error)
  
  // Écouter les changements de connexion
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true)
  })
  
  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false)
  })
}