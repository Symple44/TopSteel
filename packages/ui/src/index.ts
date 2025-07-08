// === PRIMITIVES ===
export * from './components/primitives/button'
export * from './components/primitives/input'
export * from './components/primitives/textarea'
export * from './components/primitives/checkbox'
export * from './components/primitives/radio-group'
export * from './components/primitives/switch'
export * from './components/primitives/select'

// === LAYOUT ===
export * from './components/layout/card'
export * from './components/layout/separator'

// === NAVIGATION ===
export * from './components/navigation/tabs'
export * from './components/navigation/dropdown-menu'

// === DATA DISPLAY ===
export * from './components/data-display/badge'
export * from './components/data-display/avatar'
export * from './components/data-display/progress'
export * from './components/data-display/table'

// === FEEDBACK ===
export * from './components/feedback/alert'
export * from './components/feedback/dialog'
export * from './components/feedback/tooltip'

// === FORMS ===
export * from './components/forms/label'

// === UTILS & VARIANTS ===
export { cn } from './lib/utils'
export { 
  buttonVariants, 
  badgeVariants, 
  alertVariants 
} from './lib/design-system'

// === TYPES ===
export type { 
  ButtonVariants, 
  BadgeVariants, 
  AlertVariants 
} from './lib/design-system'

// === RE-EXPORTS EXTERNES ===
export { cva, type VariantProps } from 'class-variance-authority'
export { clsx, type ClassValue } from 'clsx'


