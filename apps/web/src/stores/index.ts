/**
 * 📦 EXPORTS CENTRALISÉS DES STORES - TopSteel ERP
 */

// ===== STORES ZUSTAND =====
export { useAppStore } from './app.store'

// ===== HOOKS D'AUTHENTIFICATION =====
export {
    useAuth,
    useCurrentUser,
    useIsAuthenticated
} from '@/hooks/use-auth'

// ===== HOOKS UI =====
export {
    useSidebar, useToasts,
    useUI
} from '@/hooks/use-ui'

// ===== SELECTORS OPTIMISÉS =====
export {
    useActiveProjectsCount, useNotifications, useProjectFilters, useProjectsCount, useTheme, useUISettings, useUser, useUserPermissions
} from './selectors/app.selectors'

// ===== TYPES =====
export type {
    AppStore, FilterState, MetricsState, NotificationState, UIState
} from './app.store'

// ===== UTILITIES =====
export { StoreMonitor } from '@/lib/store-utils'
