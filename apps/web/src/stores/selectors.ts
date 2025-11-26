/**
 * Selectors mémoïsés pour les stores Zustand
 *
 * Ces selectors évitent les re-renders inutiles en retournant
 * des références stables pour les objets et tableaux.
 */

import { useShallow } from 'zustand/react/shallow'
import { useAppStore, type AppState, type UIState } from './app.store'
import { useAuthStore, type AuthState } from './auth.store'

// ============================================
// APP STORE SELECTORS
// ============================================

/**
 * Sélectionne l'état UI complet avec mémoïsation
 */
export const useUIState = () =>
  useAppStore(
    useShallow((state: AppState) => state.ui)
  )

/**
 * Sélectionne les propriétés de la sidebar
 */
export const useSidebarState = () =>
  useAppStore(
    useShallow((state: AppState) => ({
      collapsed: state.ui.sidebarCollapsed,
      pinned: state.ui.sidebarPinned,
    }))
  )

/**
 * Sélectionne les notifications non lues
 */
export const useUnreadNotifications = () =>
  useAppStore(
    useShallow((state: AppState) =>
      state.notifications.filter((n) => !n.read)
    )
  )

/**
 * Sélectionne le nombre de notifications non lues
 */
export const useUnreadNotificationCount = () =>
  useAppStore((state: AppState) =>
    state.notifications.filter((n) => !n.read).length
  )

/**
 * Sélectionne les infos utilisateur essentielles
 */
export const useAppUserInfo = () =>
  useAppStore(
    useShallow((state: AppState) => ({
      user: state.user,
      permissions: state.permissions,
      isOnline: state.isOnline,
    }))
  )

/**
 * Sélectionne l'état de chargement et erreur
 */
export const useAppStatus = () =>
  useAppStore(
    useShallow((state: AppState) => ({
      loading: state.loading,
      error: state.error,
    }))
  )

/**
 * Sélectionne les actions UI
 */
export const useUIActions = () =>
  useAppStore(
    useShallow((state) => ({
      setSidebarCollapsed: state.setSidebarCollapsed,
      setSidebarPinned: state.setSidebarPinned,
      setLayoutMode: state.setLayoutMode,
      setActiveModule: state.setActiveModule,
    }))
  )

/**
 * Sélectionne les actions de notification
 */
export const useNotificationActions = () =>
  useAppStore(
    useShallow((state) => ({
      addNotification: state.addNotification,
      markNotificationRead: state.markNotificationRead,
      clearNotifications: state.clearNotifications,
    }))
  )

// ============================================
// AUTH STORE SELECTORS
// ============================================

/**
 * Sélectionne l'état d'authentification complet
 */
export const useAuthState = () =>
  useAuthStore(
    useShallow((state: AuthState) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
    }))
  )

/**
 * Sélectionne les informations de session
 */
export const useSessionInfo = () =>
  useAuthStore(
    useShallow((state: AuthState) => ({
      token: state.token,
      refreshToken: state.refreshToken,
      sessionExpiry: state.sessionExpiry,
      lastActivity: state.lastActivity,
    }))
  )

/**
 * Sélectionne les permissions utilisateur
 */
export const useUserPermissions = () =>
  useAuthStore(
    useShallow((state: AuthState) => state.permissions)
  )

/**
 * Vérifie si l'utilisateur a une permission spécifique
 */
export const useHasPermission = (permission: string) =>
  useAuthStore((state: AuthState) => state.permissions.includes(permission))

/**
 * Vérifie si l'utilisateur a au moins une des permissions
 */
export const useHasAnyPermission = (permissions: string[]) =>
  useAuthStore((state: AuthState) =>
    permissions.some((p) => state.permissions.includes(p))
  )

/**
 * Vérifie si l'utilisateur a toutes les permissions
 */
export const useHasAllPermissions = (permissions: string[]) =>
  useAuthStore((state: AuthState) =>
    permissions.every((p) => state.permissions.includes(p))
  )

/**
 * Sélectionne les actions d'authentification
 */
export const useAuthActions = () =>
  useAuthStore(
    useShallow((state) => ({
      login: state.login,
      logout: state.logout,
      refreshTokens: state.refreshTokens,
      setError: state.setError,
      clearError: state.clearError,
    }))
  )

/**
 * Sélectionne le nom complet de l'utilisateur
 */
export const useUserFullName = () =>
  useAuthStore((state: AuthState) => {
    if (!state.user) return ''
    return `${state.user.prenom || ''} ${state.user.nom || ''}`.trim()
  })

/**
 * Sélectionne le rôle de l'utilisateur
 */
export const useUserRole = () =>
  useAuthStore((state: AuthState) => state.user?.role)

/**
 * Vérifie si l'utilisateur est admin
 */
export const useIsAdmin = () =>
  useAuthStore((state: AuthState) => {
    const role = state.user?.role?.toUpperCase()
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
  })

/**
 * Vérifie si l'utilisateur est super admin
 */
export const useIsSuperAdmin = () =>
  useAuthStore((state: AuthState) =>
    state.user?.role?.toUpperCase() === 'SUPER_ADMIN'
  )

// ============================================
// COMBINED SELECTORS
// ============================================

/**
 * Sélectionne tout le contexte utilisateur nécessaire pour l'affichage
 */
export const useUserContext = () => {
  const authState = useAuthState()
  const appUserInfo = useAppUserInfo()

  return {
    ...authState,
    ...appUserInfo,
  }
}

/**
 * Sélectionne l'état global de l'application
 */
export const useGlobalAppState = () => {
  const appStatus = useAppStatus()
  const authState = useAuthState()
  const isOnline = useAppStore((state) => state.isOnline)

  return {
    ...appStatus,
    ...authState,
    isOnline,
  }
}
