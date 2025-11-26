// Main components barrel export - Socle

// Admin components
export * from './admin'

// App components
export * from './app/app-initializer'

// Authentication components
export * from './auth/admin-guard'
export * from './auth/auth-guard'
export * from './auth/company-selector'
export * from './auth/mfa-verification'
export * from './auth/permission-guard'
export * from './auth/sync-indicator'
export * from './auth/tab-sync-notification'

// Charts
export * from './charts'

// Core components
export { ClientOnly } from './client-only'
export { DevToolsWrapper } from './devtools-wrapper'
export { ErrorBoundary } from './error-boundary'

// Layout components
export * from './layout/dashboard-content'
export * from './layout/header'
export * from './layout/sidebar'

// Lazy loading
export { MonitoringInitializer } from './monitoring-initializer'
export { default as NoSSR } from './NoSSR'

// Provider components
export * from './providers/appearance-provider'
export * from './providers/monitoring-provider'
export * from './providers/theme-provider'
export * from './providers/translation-override-provider'

// Query builder components
export * from './query-builder'

// Search components
export * from './search/command-palette'

// Security
export * from './security/csp-style'

// Settings
export * from './settings'

// UI components
export * from './ui/optimized-image'
export * from './ui/under-construction'

// Wrapper components
export * from './wrappers'
