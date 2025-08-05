// packages/ui/src/index.ts

// === RE-EXPORTS EXTERNES ===
export { cva, type VariantProps } from 'class-variance-authority'
export { type ClassValue, clsx } from 'clsx'
// === COMPONENTS ===
export * from './components'
// === DESIGN SYSTEM UNIFIÉ ===
export * from './design-system'

// === LEGACY COMPATIBILITY ===
// Re-export des variants existants pour compatibilité backward
export type {
  AlertVariants,
  BadgeVariants,
  ButtonVariants,
  CardVariants,
  DialogContentVariants,
  InputVariants,
  ScrollAreaVariants,
  SidebarVariants,
  SwitchVariants,
  TableVariants,
} from './lib/design-system'

export {
  alertVariants,
  badgeVariants,
  buttonVariants,
  cardVariants,
  dialogContentVariants,
  inputVariants,
  scrollAreaVariants,
  sidebarVariants,
  switchVariants,
  tableVariants,
} from './lib/design-system'

// === UTILS ===
export { cn } from './lib/utils'
