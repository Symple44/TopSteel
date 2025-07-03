/**
 * 🚀 SELECTORS ZUSTAND OPTIMISÉS
 */
import { useAppStore } from '../app.store'
import { shallow } from 'zustand/shallow'

// Selectors granulaires pour éviter les re-renders
export const useTheme = () => useAppStore(state => state.theme)
export const useUser = () => useAppStore(state => state.user)
export const useLoading = () => useAppStore(state => state.loading)

export const useProjectFilters = () => useAppStore(
  state => state.filters?.projets || {},
  shallow
)

export const useUISettings = () => useAppStore(
  state => ({
    sidebarCollapsed: state.ui?.sidebarCollapsed || false,
    layoutMode: state.ui?.layoutMode || 'default',
    showTooltips: state.ui?.showTooltips || true
  }),
  shallow
)

export const useNotifications = () => useAppStore(
  state => state.notifications || [],
  shallow
)

// Selectors avec transformations
export const useProjectsCount = () => useAppStore(
  state => state.projets?.length || 0
)

export const useActiveProjectsCount = () => useAppStore(
  state => state.projets?.filter(p => p.statut === 'EN_COURS').length || 0
)

// Selectors pour performance
export const useIsAuthenticated = () => useAppStore(
  state => !!state.user && !!state.session?.token
)

export const useUserPermissions = () => useAppStore(
  state => state.user?.permissions || [],
  shallow
)
