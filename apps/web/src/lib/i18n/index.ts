// Main exports for the i18n system

export * from './hooks'
export { translations } from './translations'
export * from './translator'
// Re-export for convenience
export { translator as i18n } from './translator'
export * from './types'

// Export generated types for strict type checking
export type { TranslationKey, TRANSLATION_KEY_COUNT } from './generated-types'
