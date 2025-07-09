// packages/ui/src/index.ts

// === COMPONENTS ===
export * from './components'

// === UTILS & VARIANTS ===
export {
  alertVariants,
  badgeVariants,
  buttonVariants
} from './lib/design-system'
export { cn } from './lib/utils'

// === TYPES ===
export type {
  AlertVariants,
  BadgeVariants,
  ButtonVariants
} from './lib/design-system'

// === RE-EXPORTS EXTERNES ===
export { cva, type VariantProps } from 'class-variance-authority'
export { clsx, type ClassValue } from 'clsx'

