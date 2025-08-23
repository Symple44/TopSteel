'use client'

// packages/ui/src/index.ts

// === RE-EXPORTS EXTERNES ===
export { cva, type VariantProps } from 'class-variance-authority'
export { type ClassValue, clsx } from 'clsx'

// === COMPONENTS - EXPORT CENTRALISÉ ===
// Primitives
export {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/primitives'

// Export Button types explicitly
export type { ButtonProps } from './components/primitives/button/Button'

// Data Display
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  DataTable,
  Progress,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './components/data-display'

// Export Badge type explicitly
export type { BadgeProps } from './components/data-display/badge/Badge'

// Advanced DataTable avec types explicites
export { 
  DataTable as AdvancedDataTable,
  type ColumnConfig,
  type SelectionState,
  usePersistedTableSettings,
} from './components/data-display/datatable'

// Layout
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  PageHeader,
  ScrollArea,
  ScrollBar,
  Separator,
} from './components/layout'

// Export Card types explicitly
export type { 
  CardProps,
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardTitleProps,
} from './components/layout/card/Card'

// Forms
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Label,
  TranslationField,
  useFormField,
} from './components/forms'

// Navigation - Export all including LanguageSelector
export * from './components/navigation'

// Feedback - Export all including ConnectionLostDialog
export * from './components/feedback'

// Business components
export * from './components/business'

// Theme
export * from './components/theme'

// === DESIGN SYSTEM UNIFIÉ ===
export * from './design-system'

// === UTILS ===
export { cn } from './lib/utils'

// === LEGACY COMPATIBILITY ===
export type {
  AlertVariants,
  DialogContentVariants,
  InputVariants,
  ScrollAreaVariants,
  SidebarVariants,
  SwitchVariants,
  TableVariants,
} from './lib/design-system'

export {
  alertVariants,
  dialogContentVariants,
  inputVariants,
  scrollAreaVariants,
  sidebarVariants,
  switchVariants,
  tableVariants,
} from './lib/design-system'