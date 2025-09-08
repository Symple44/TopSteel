// apps/web/src/hooks/index.ts - INDEX POUR FACILITER IMPORTS

// Performance hooks
export * from './performance-hooks'
// API and connection
export { useApiConnection } from './use-api-connection'
// Settings and preferences
export { useAppearanceSettings } from './use-appearance-settings'

// Business data hooks
export { useArticles } from './use-articles'
// Authentication and authorization
export { useAuth, useCurrentUser, useIsAuthenticated } from './use-auth'
export { useAvailablePages } from './use-available-pages'
export { useBackendHealth } from './use-backend-health'
export { useClients } from './use-clients'
export { useCompanyInfo } from './use-company-info'
export { useConfirm } from './use-confirm'
export { useDashboard } from './use-dashboard'
export { useDataView } from './use-data-view'
export { useDataTable } from './use-datatable'
export { useDebounce } from './use-debounce'
export { useDebouncedValue } from './use-debounced-value'
export { useDesignSystem } from './use-design-system'
// Menu and navigation
export { useDynamicMenu, useMenu, useNavigation } from './use-dynamic-menu'
export { useFormValidation } from './use-form-validation'

// Search and data
export { useGlobalSearch, useSearch } from './use-global-search'
// Utilities
export { useImageUpload } from './use-image-upload'
export { useMaterials } from './use-materials'
export { useMenuMode } from './use-menu-mode'
export { useNotificationSettings } from './use-notification-settings'
export { useNotifications } from './use-notifications'
export { useOptimizedQuery } from './use-optimized-query'
export { usePartners } from './use-partners'
// Partner details exports are imported directly where needed
// Performance and optimization
export { usePerformance } from './use-performance'
export { usePermissions } from './use-permissions'
export { usePermissions as usePermissionsV2 } from './use-permissions-v2'
// Business specific
export { usePriceCalculation } from './use-price-calculation'
export { usePriceRules } from './use-price-rules'
export { useProjet, useProjets } from './use-projets'
export { useSecureValidation } from './use-secure-validation'
export { useSelectedPages } from './use-selected-pages'
export { useStoreSsr } from './use-store-ssr'
export { useSyncNotifications } from './use-sync-notifications'
export { useSystemParameters } from './use-system-parameters'
// Synchronization
export { useTabSync } from './use-tab-sync'
export { useTemplates } from './use-templates'
export { useToast } from './use-toast'
// UI and interaction hooks
export { useSidebar, useToasts, useUI } from './use-ui'
export { useUserMenuPreferences } from './use-user-menu-preferences'
export { useUserSettings } from './use-user-settings'
export { useWebVitals } from './use-web-vitals'
