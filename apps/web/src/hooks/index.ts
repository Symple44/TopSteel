// apps/web/src/hooks/index.ts - Socle Hooks Index

// Performance hooks
export * from './performance-hooks'

// API and connection


// Settings and preferences
export { useAppearanceSettings } from './use-appearance-settings'

// Authentication and authorization
export { useAuth, useCurrentUser, useIsAuthenticated } from './use-auth'
export { useAvailablePages } from './use-available-pages'
export { useBackendHealth } from './use-backend-health'
export { useCompanyInfo } from './use-company-info'
export { useConfirm } from './use-confirm'
export { useDashboard } from './use-dashboard'
export { useDataView } from './use-data-view'
export { useDebounce } from './use-debounce'
export { useDesignSystem } from './use-design-system'

// Menu and navigation
export { useDynamicMenu, useMenu, useNavigation } from './use-dynamic-menu'
export { useFormValidation } from './use-form-validation'

// Search
export { useGlobalSearch, useSearch } from './use-global-search'

// Utilities
export { useImageUpload } from './use-image-upload'
export { useMenuMode } from './use-menu-mode'
export { useNotificationSettings } from './use-notification-settings'

export { useOptimizedQuery } from './use-optimized-query'

// Performance and optimization
export { usePerformance } from './use-performance'

// Permissions (API-driven unified system)
export {
  usePermissions,
  useRoles,
  useModuleAccess,
  useActionPermission,
  type Permission,
  type Role,
} from './use-permissions'

export { useSecureValidation } from './use-secure-validation'
export { useSelectedPages } from './use-selected-pages'
export { useStoreSsr } from './use-store-ssr'
export { useSyncNotifications } from './use-sync-notifications'
export { useSystemParameters } from './use-system-parameters'

// Session monitoring
export { useAutoLogout, useSessionMonitor } from './use-session-monitor'

// Synchronization
export { useTabSync } from './use-tab-sync'
export { useTemplates } from './use-templates'
export { useToast } from './use-toast'

// UI and interaction hooks
export { useSidebar, useToasts, useUI } from './use-ui'
export { useUserMenuPreferences } from './use-user-menu-preferences'
export { useUserSettings } from './use-user-settings'
export { useWebVitals } from './use-web-vitals'
