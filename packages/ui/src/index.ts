// packages/ui/src/index.ts

// === COMPONENTS ===
export * from './components'

// === UTILS & VARIANTS ===
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
export { cn } from './lib/utils'

// === TYPES ===
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

// === RE-EXPORTS EXTERNES ===
export { cva, type VariantProps } from 'class-variance-authority'
export { clsx, type ClassValue } from 'clsx'
