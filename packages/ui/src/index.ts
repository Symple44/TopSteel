'use client'

// packages/ui/src/index.ts

// === RE-EXPORTS EXTERNES ===
export { cva, type VariantProps } from 'class-variance-authority'
export { type ClassValue, clsx } from 'clsx'
// Business components
export * from './components/business'
// Data Display
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
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
  type ColumnConfig,
  DataTable,
  DataTable as AdvancedDataTable,
  DataTableExample,
  HierarchicalDataTableExample,
  type SelectionState,
  SimpleDataTableExample,
  usePersistedTableSettings,
} from './components/data-display/datatable'
// Export ReorderableListConfig and related types
export type {
  ReorderableItem,
  ReorderableListConfig,
  ReorderableTheme,
  ThemedReorderableListProps,
} from './components/data-display/reorderable-list'
// Feedback - Export all including ConnectionLostDialog
export * from './components/feedback'
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
  CardContentProps,
  CardDescriptionProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from './components/layout/card/Card'

// Navigation - Export all including LanguageSelector and Tabs
export * from './components/navigation'
// Export DropdownMenu components explicitly
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './components/navigation/dropdown-menu'
// Export Tabs explicitly to ensure they're available
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './components/navigation/tabs'
// === COMPONENTS - EXPORT CENTRALISÉ ===
// Primitives
export {
  Button,
  Checkbox,
  CodeViewerDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Progress,
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
  SimpleTooltip,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/primitives'
// Export Button and other primitive types explicitly
export type { ButtonProps } from './components/primitives/button/Button'
export type { InputProps } from './components/primitives/input/Input'
export type { TextareaProps } from './components/primitives/textarea/Textarea'

// Theme
export * from './components/theme'

// === DESIGN SYSTEM UNIFIÉ ===
export * from './design-system'
export { useTheme } from './hooks'
// === HOOKS ===
export {
  useCheckboxGroupIds,
  useFormFieldIds,
  useRadioGroupIds,
  useUniqueId,
} from './hooks/useFormFieldIds'
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
// === SECURITY ===
export {
  DOMSanitizer,
  sanitizeBasic,
  sanitizeHighlight,
  sanitizeHtml,
  sanitizeRichText,
  validateHtmlSafety,
} from './lib/security/dom-sanitizer'
// === UTILS ===
export { cn } from './lib/utils'
