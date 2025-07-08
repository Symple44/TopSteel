/**
 * 🌐 TYPES SPÉCIFIQUES WEB APP - TOPSTEEL ERP
 * Types exclusifs à l'application web Next.js
 *
 * Structure:
 * - Types spécifiques Next.js
 * - Types de pages et layouts
 * - Types de providers et contextes
 * - Types de hooks custom web
 * - Types de composants web-only
 * - Augmentations des modules externes
 */

// Import des augmentations (doit être en premier)
import './augmentations'

import type { DeepPartial, User } from '@erp/types'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
import type { ReactNode } from 'react'

// =============================================
// TYPES NEXT.JS ÉTENDUS
// =============================================

export interface TopSteelPageProps {
  user?: User
  permissions?: string[]
  initialData?: Record<string, unknown>
  metadata?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

export type TopSteelPage<P = {}> = NextPage<P & TopSteelPageProps> & {
  getLayout?: (page: ReactNode) => ReactNode
  requireAuth?: boolean
  permissions?: string[]
}

export interface TopSteelAppProps extends AppProps {
  pageProps: TopSteelPageProps
}

// =============================================
// TYPES PROVIDERS WEB
// =============================================

export interface ProvidersProps {
  children: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorBoundaryState>
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

export interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  systemTheme: 'light' | 'dark'
}

// =============================================
// TYPES HOOKS WEB CUSTOM
// =============================================

export interface UseApiOptions<T> {
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  refetchInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface UseLocalStorageOptions {
  serialize?: (value: unknown) => string
  deserialize?: (value: string) => unknown
  defaultValue?: unknown
}

export interface UseDebounceOptions {
  delay?: number
  leading?: boolean
  trailing?: boolean
}

export interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

// =============================================
// TYPES COMPOSANTS WEB
// =============================================

export interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showSidebar?: boolean
  showHeader?: boolean
  breadcrumbs?: Breadcrumb[]
}

export interface Breadcrumb {
  label: string
  href?: string
  icon?: string
}

export interface SidebarItem {
  id: string
  label: string
  href: string
  icon?: string
  badge?: string | number
  children?: SidebarItem[]
  permissions?: string[]
}

export interface HeaderProps {
  user?: User
  notifications?: Notification[]
  showSearch?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
}

export interface SearchResult {
  id: string
  type: 'projet' | 'client' | 'devis' | 'production'
  title: string
  subtitle?: string
  href: string
}

// =============================================
// TYPES FORMULAIRES WEB
// =============================================

export interface FormState<T = Record<string, unknown>> {
  data: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

export interface FormOptions<T = Record<string, unknown>> {
  initialValues?: DeepPartial<T>
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit: (values: T) => Promise<void> | void
  resetOnSubmit?: boolean
}

export interface FieldProps<T = unknown> {
  name: string
  value: T
  onChange: (value: T) => void
  onBlur: () => void
  error?: string
  disabled?: boolean
  required?: boolean
}

// =============================================
// TYPES MODALES ET OVERLAYS
// =============================================

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
  children: ReactNode
}

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export interface ToastOptions {
  id?: string
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// =============================================
// TYPES NAVIGATION ET ROUTING
// =============================================

export interface RouteConfig {
  path: string
  component: React.ComponentType
  exact?: boolean
  permissions?: string[]
  title?: string
  icon?: string
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: string
  badge?: string | number
  children?: NavigationItem[]
  permissions?: string[]
  external?: boolean
}

// =============================================
// TYPES TABLEAUX ET LISTES
// =============================================

export interface TableColumn<T = unknown> {
  key: string
  header: string
  accessor?: keyof T | ((item: T) => unknown)
  width?: number | string
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, item: T, index: number) => ReactNode
}

export interface TableProps<T = unknown> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string
  emptyMessage?: string
  selectable?: boolean
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onRowClick?: (item: T) => void
  pagination?: PaginationProps
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
}

export interface PaginationProps {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  showSizeSelect?: boolean
  showInfo?: boolean
}

export interface SortingState {
  column: string
  direction: 'asc' | 'desc'
}

export interface FilterState {
  [key: string]: unknown
}

// =============================================
// TYPES DASHBOARD ET WIDGETS
// =============================================

export interface DashboardWidget {
  id: string
  title: string
  type: 'chart' | 'metric' | 'list' | 'table' | 'custom'
  size: 'sm' | 'md' | 'lg'
  position: { x: number; y: number }
  data?: unknown
  config?: Record<string, unknown>
}

export interface MetricWidgetProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period?: string
  }
  icon?: string
  color?: string
}

export interface ChartWidgetProps {
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  data: unknown[]
  config?: Record<string, unknown>
}

// =============================================
// TYPES DEVTOOLS WEB
// =============================================

export interface DevToolsConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  initialIsOpen: boolean
  panelPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  closeOnEsc: boolean
  toggleButtonProps?: {
    style?: React.CSSProperties
    className?: string
  }
}

export interface DevToolsWrapperProps {
  config?: Partial<DevToolsConfig>
  fallback?: React.ComponentType
  onError?: (error: Error) => void
}

export interface AdvancedDevToolsProps extends DevToolsWrapperProps {
  enablePerformanceMonitoring?: boolean
  enableNetworkMonitoring?: boolean
  customPanels?: Array<{
    name: string
    component: React.ComponentType
  }>
}

// =============================================
// TYPES PERFORMANCE ET MONITORING
// =============================================

export interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  firstInputDelay: number
  cumulativeLayoutShift: number
}

export interface ErrorReport {
  id: string
  timestamp: Date
  message: string
  stack?: string
  url: string
  userAgent: string
  userId?: string
  additional?: Record<string, unknown>
}

// =============================================
// EXPORTS POUR EXTENSIONS FUTURES
// =============================================

export interface WebPlugin {
  name: string
  version: string
  routes?: RouteConfig[]
  components?: Record<string, React.ComponentType>
  hooks?: Record<string, () => unknown>
  providers?: React.ComponentType[]
}

export interface WebTheme {
  name: string
  colors: Record<string, string>
  fonts: Record<string, string>
  spacing: Record<string, string>
  breakpoints: Record<string, string>
}
