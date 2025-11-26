// Component wrappers for integrating packages/ui components with app-specific dependencies

export { AutoBreadcrumbWrapper } from './auto-breadcrumb-wrapper'
export {
  BackendConnectionGuardWrapper,
  BackendStatusIndicatorWrapper,
} from './backend-status-indicator-wrapper'
export { CodeViewerDialogWrapper } from './code-viewer-dialog-wrapper'
export { CompanyLogoWrapper } from './company-logo-wrapper'
export { ConnectionLostDialogWrapper } from './connection-lost-dialog-wrapper'
export { LanguageSelectorWrapper } from './language-selector-wrapper'
export { TranslationFieldWrapper } from './translation-field-wrapper'

// Stubs for removed business components - socle version
interface ImageUploadWrapperProps {
  category?: string
  entityType?: string
  entityId?: string
  variant?: string
  maxSize?: number
  allowedTypes?: string[]
  onUploadSuccess?: (result: string) => void
  onUploadError?: (error: string) => void
  className?: string
}

export const ErpInfoModalWrapper = (_props: Record<string, unknown>) => null
export const ImageUploadWrapper = (_props: ImageUploadWrapperProps) => null
