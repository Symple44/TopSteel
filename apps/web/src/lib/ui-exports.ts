/**
 * Centralized UI exports with proper typing
 * This file resolves import issues and provides type-safe exports
 * React 19 compatible component exports
 */

import type { ReactNode } from 'react'

// === CORRECT IMPORTS FROM @erp/ui MODULES ===

// Data Display components (only what exists in data-display)
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp/ui'

// Import and re-export ColumnConfig (use our own type definition to avoid import errors)
export interface ColumnConfig<T = Record<string, unknown>> {
  key: string
  title: string | ReactNode
  sortable?: boolean
  searchable?: boolean
  width?: number | string
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  render?: (row: T) => ReactNode
  accessorKey?: string
  accessorFn?: (row: T) => unknown
  visible?: boolean
  locked?: boolean
  className?: string
  headerClassName?: string
  align?: 'left' | 'center' | 'right'
}

// Layout components
// Form components - only import Label which we know exists
// Primitives components
// Navigation components
// Feedback components
export {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  PageHeader,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@erp/ui'

// === TYPE EXPORTS ===

// Export available types from @erp/ui
export type {
  BadgeProps,
  ButtonProps,
  CardContentProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from '@erp/ui'

// Re-export additional types from @erp/ui
export type { InputProps, TextareaProps } from '@erp/ui'

// Base component props - inline definitions
interface BaseComponentProps {
  children?: ReactNode
  className?: string
}

// Alert types
export interface AlertProps extends BaseComponentProps {
  variant?: 'default' | 'destructive'
}
export interface AlertDescriptionProps extends BaseComponentProps {}
export interface AlertTitleProps extends BaseComponentProps {}

// Dialog types
export interface DialogProps extends BaseComponentProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
export interface DialogContentProps extends BaseComponentProps {}
export interface DialogHeaderProps extends BaseComponentProps {}
export interface DialogTitleProps extends BaseComponentProps {}
export interface DialogDescriptionProps extends BaseComponentProps {}
export interface DialogFooterProps extends BaseComponentProps {}

// Form types
export interface LabelProps extends BaseComponentProps {
  htmlFor?: string
}

// Select types
export interface SelectProps extends BaseComponentProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}
export interface SelectTriggerProps extends BaseComponentProps {}
export interface SelectContentProps extends BaseComponentProps {}
export interface SelectItemProps extends BaseComponentProps {
  value: string
}

// Tabs types
export interface TabsProps extends BaseComponentProps {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}
export interface TabsListProps extends BaseComponentProps {}
export interface TabsTriggerProps extends BaseComponentProps {
  value: string
  disabled?: boolean
}
export interface TabsContentProps extends BaseComponentProps {
  value: string
}

// Other types
export interface PageHeaderProps extends BaseComponentProps {
  title: string
  description?: string
  actions?: ReactNode
}
export interface ProgressProps extends BaseComponentProps {
  value?: number
  max?: number
}

// Form components are commented out due to export issues from UI package
// If needed, these can be imported directly from '@erp/ui' in individual components

// Type guard functions
export function isColumnConfig<T = Record<string, unknown>>(obj: unknown): obj is ColumnConfig<T> {
  return typeof obj === 'object' && obj !== null && 'key' in obj && 'title' in obj
}

// Helper to create column configs with proper typing
export function createColumn<T = Record<string, unknown>>(
  config: ColumnConfig<T>
): ColumnConfig<T> {
  return {
    ...config,
    visible: config.visible !== false,
    sortable: config.sortable ?? false,
    searchable: config.searchable ?? false,
    resizable: config.resizable ?? true,
  }
}

// Helper to create multiple columns
export function createColumns<T = Record<string, unknown>>(
  configs: ColumnConfig<T>[]
): ColumnConfig<T>[] {
  return configs?.map(createColumn)
}

// === UTILITY INTERFACES ===

// Form-related exports
export interface FormFieldConfig<T = Record<string, unknown>> {
  name: keyof T
  label: string
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'date'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  validation?: {
    required?: string
    min?: number | { value: number; message: string }
    max?: number | { value: number; message: string }
    minLength?: number | { value: number; message: string }
    maxLength?: number | { value: number; message: string }
    pattern?: RegExp | { value: RegExp; message: string }
    validate?: (value: unknown) => boolean | string
  }
  options?: Array<{ value: string | number; label: string }>
  defaultValue?: unknown
}

// Table state management
export interface TableState<T = Record<string, unknown>> {
  data: T[]
  loading: boolean
  error: Error | null
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  sorting: {
    column: string | null
    direction: 'asc' | 'desc'
  }
  filters: Record<string, unknown>
  selection: Set<string>
}

// Action handlers for tables
export interface TableActions<T = Record<string, unknown>> {
  onSort: (column: string) => void
  onFilter: (filters: Record<string, unknown>) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSelectionChange: (selection: Set<string>) => void
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onExport?: () => void
}

// Complete table props interface
export interface CustomDataTableProps<T = Record<string, unknown>> {
  columns: ColumnConfig<T>[]
  data: T[]
  loading?: boolean
  error?: Error | null
  state?: Partial<TableState<T>>
  actions?: Partial<TableActions<T>>
  className?: string
  emptyMessage?: string
  errorMessage?: string
  showPagination?: boolean
  showFilters?: boolean
  showExport?: boolean
  showSelection?: boolean
  selectionMode?: 'single' | 'multiple'
  rowKey?: keyof T | ((row: T) => string)
}

// Utility function to get row key
export function getRowKey<T extends Record<string, unknown>>(
  row: T,
  rowKey?: keyof T | ((row: T) => string),
  index?: number
): string {
  if (typeof rowKey === 'function') {
    return rowKey(row)
  }
  if (rowKey && row[rowKey] != null) {
    return String(row[rowKey])
  }
  if ('id' in row && row.id != null) {
    return String(row.id)
  }
  return index?.toString() ?? '0'
}
