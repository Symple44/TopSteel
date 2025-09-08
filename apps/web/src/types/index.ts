// Re-export only specific types to avoid conflicts
// export type * from '@erp/types'

// Local web app types
export type WebAppConfig = Record<string, unknown>

// API types
export * from './api-types'

// Authentication types
export * from './auth'

// Menu types
export * from './menu'

// Permission types - commented to avoid conflicts
// export * from './permissions'

// Stock types
export * from './stock'
