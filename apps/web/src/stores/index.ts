/**
 * 📦 STORES INDEX - TopSteel ERP Socle
 * Point d'entrée unique pour tous les stores
 */

import { StoreMonitor } from '../lib/store-utils'
import { useAppStore } from './app.store'
import { useAuthStore } from './auth.store'

// ===== APP STORE =====
export {
  useAppError,
  useAppLoading,
  useAppOnlineStatus,
  useAppSession,
  useAppStore,
  useAppTheme,
  useAppUser,
} from './app.store'

export type {
  AppState,
  AppActions,
  AppUser,
  UIState,
  SessionState,
  NotificationItem,
} from './app.store'

// ===== AUTH STORE =====
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

export type {
  AuthActions,
  AuthState,
  LoginAttempt,
  LoginCredentials,
  SessionInfo,
  User,
} from './auth.store'

// ===== MEMOIZED SELECTORS =====
export {
  // App Store Selectors
  useUIState,
  useSidebarState,
  useUnreadNotifications,
  useUnreadNotificationCount,
  useAppUserInfo,
  useAppStatus,
  useUIActions,
  useNotificationActions,
  // Auth Store Selectors
  useAuthState,
  useSessionInfo,
  useUserPermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  useAuthActions,
  useUserFullName,
  useUserRole,
  useIsAdmin,
  useIsSuperAdmin,
  // Combined Selectors
  useUserContext,
  useGlobalAppState,
} from './selectors'

// ===== HOOKS =====
export { useAuth, useCurrentUser, useIsAuthenticated } from '../hooks/use-auth'
export { useSidebar, useToasts, useUI } from '../hooks/use-ui'

// ===== UTILITAIRES =====
export { StoreMonitor, StoreUtils, type StoreEvent } from '../lib/store-utils'

export {
  createMemoizedSelector,
  createOptimizedSelectors,
  SelectorStrategy,
  selectorDebugUtils,
  useOptimizedSelector,
} from '../lib/optimized-selectors'

// ===== CONSTANTES =====
export const STORE_VERSION = '3.0.0'
export const STORAGE_PREFIX = 'topsteel-erp'

// ===== HELPERS =====
export const storeHelpers = {
  createStorageKey: (storeName: string) => `${STORAGE_PREFIX}-${storeName}`,
  isStorePersisted: (storeName: string) => {
    try {
      return localStorage.getItem(storeHelpers.createStorageKey(storeName)) !== null
    } catch {
      return false
    }
  },
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
        monitor: StoreMonitor.getStats(),
      }
    } catch {
      return null
    }
  },
  resetAllStores: () => {
    try {
      useAppStore.getState().reset()
      useAuthStore.getState().reset()
    } catch {}
  },
}

// ===== DEVTOOLS =====
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  ;(window as any).__TOPSTEEL_STORES__ = { 
    app: useAppStore, 
    auth: useAuthStore, 
    helpers: storeHelpers, 
    monitor: StoreMonitor 
  }
}

export default { 
  stores: { useAppStore, useAuthStore }, 
  helpers: storeHelpers, 
  version: STORE_VERSION 
}
