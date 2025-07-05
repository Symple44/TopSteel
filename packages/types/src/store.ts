/**
 * 📝 TYPES STORES - TopSteel ERP
 * Types spécifiques aux stores Zustand (sans doublons)
 * Fichier: packages/types/src/store.ts
 */

// Import des types existants depuis les autres fichiers
import type { ProductionFilters } from './production'
import type { Projet, ProjetFilters } from './projet'
import type { StocksFilters } from './stocks'
import type { User } from './user'

// Import conditionnel pour les filtres de facturation (si le fichier existe)
// import type { FacturationFilters } from './facturation'

// ===== TYPES DE BASE STORE =====
export interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdate: number
  version: string
}

// ===== TYPES UI =====
export interface UIState {
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  layoutMode: 'compact' | 'default' | 'wide'
  activeModule: string | null
  showTooltips: boolean
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
}

// ===== TYPES MÉTRICS =====
export interface MetricsState {
  pageViews: number
  actionCount: number
  lastActivity: number
  sessionStart: number
  errorCount: number
  performanceMetrics: {
    averageLoadTime: number
    slowQueries: number
    memoryUsage: number
  }
}

// ===== TYPES SESSION =====
export interface SessionState {
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
  issuedAt: number | null
  sessionId: string | null
  device: string | null
  lastActivity: number
}

// ===== TYPES NOTIFICATIONS =====
export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'stock' | 'projet' | 'production' | 'maintenance' | 'qualite' | 'facturation'
  read: boolean
  timestamp: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
  metadata?: Record<string, any>
  persistent?: boolean
  actionUrl?: string
  actionLabel?: string
  expiresAt?: number
}

export interface NotificationState {
  notifications: NotificationItem[]
  unreadCount: number
  filters: {
    category?: string[]
    type?: string[]
    priority?: string[]
    read?: boolean
  }
  settings: {
    enableSound: boolean
    enableToast: boolean
    enableBrowser: boolean
    enableEmail: boolean
    categories: Record<string, boolean>
    priority: Record<string, boolean>
  }
}

// ===== TYPES FILTRES COMBINÉS =====
export interface FilterState {
  projets?: ProjetFilters
  stocks?: StocksFilters
  production?: ProductionFilters
  // facturation?: FacturationFilters // Décommenter si le fichier facturation.ts l'exporte
  global?: {
    search?: string
    dateRange?: { from?: string; to?: string }
    activeFilters: string[]
  }
}

// ===== TYPES ÉTAT PRINCIPAL =====
export interface AppState extends BaseStoreState {
  // État UI
  ui: UIState
  
  // Données utilisateur
  user: User | null
  session: SessionState | null
  permissions: string[]
  
  // Données métier
  projets: Projet[]
  selectedProjet: Projet | null
  
  // Notifications
  notifications: NotificationState
  
  // Filtres
  filters: FilterState
  
  // Métriques
  metrics: MetricsState
  
  // État de synchronisation
  sync: {
    isOnline: boolean
    lastSync: number
    pendingChanges: number
    conflictResolution: 'client' | 'server' | 'manual'
  }

  // ===== ACTIONS UI =====
  setTheme: (theme: UIState['theme']) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPinned: (pinned: boolean) => void
  setLayoutMode: (mode: UIState['layoutMode']) => void
  setActiveModule: (module: string | null) => void
  setLanguage: (language: string) => void
  
  // ===== ACTIONS UTILISATEUR =====
  setUser: (user: User | null) => void
  setSession: (session: SessionState | null) => void
  setPermissions: (permissions: string[]) => void
  updateUserPreferences: (preferences: Partial<User>) => void
  
  // ===== ACTIONS DONNÉES =====
  setProjets: (projets: Projet[]) => void
  addProjet: (projet: Projet) => void
  updateProjet: (id: string, updates: Partial<Projet>) => void
  removeProjet: (id: string) => void
  setSelectedProjet: (projet: Projet | null) => void
  
  // ===== ACTIONS NOTIFICATIONS =====
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
  clearReadNotifications: () => void
  updateNotificationSettings: (settings: Partial<NotificationState['settings']>) => void
  
  // ===== ACTIONS FILTRES =====
  setFilters: (module: keyof FilterState, filters: any) => void
  clearFilters: (module: keyof FilterState) => void
  resetAllFilters: () => void
  setGlobalSearch: (search: string) => void
  
  // ===== ACTIONS MÉTRIQUES =====
  incrementPageView: () => void
  incrementActionCount: () => void
  recordError: () => void
  updatePerformanceMetric: (metric: keyof MetricsState['performanceMetrics'], value: number) => void
  
  // ===== ACTIONS SYNCHRONISATION =====
  setOnlineStatus: (isOnline: boolean) => void
  markAsNeedingSync: () => void
  markAsSynced: () => void
  handleSyncConflict: (resolution: 'client' | 'server' | 'manual') => void
  
  // ===== ACTIONS DE BASE =====
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
  updateLastActivity: () => void
}

// ===== TYPES D'ACTIONS =====
export type AppActions = Pick<AppState, 
  | 'setTheme' | 'setSidebarCollapsed' | 'setSidebarPinned' | 'setLayoutMode' 
  | 'setActiveModule' | 'setLanguage' | 'setUser' | 'setSession' | 'setPermissions'
  | 'updateUserPreferences' | 'setProjets' | 'addProjet' | 'updateProjet' 
  | 'removeProjet' | 'setSelectedProjet' | 'addNotification' | 'removeNotification'
  | 'markNotificationAsRead' | 'clearNotifications' | 'clearReadNotifications'
  | 'updateNotificationSettings' | 'setFilters' | 'clearFilters' | 'resetAllFilters'
  | 'setGlobalSearch' | 'incrementPageView' | 'incrementActionCount' | 'recordError'
  | 'updatePerformanceMetric' | 'setOnlineStatus' | 'markAsNeedingSync' 
  | 'markAsSynced' | 'handleSyncConflict' | 'setLoading' | 'setError' 
  | 'clearError' | 'reset' | 'updateLastActivity'
>

// ===== TYPES POUR STORE UTILS =====
export interface StoreConfig {
  name: string
  persist?: boolean
  devtools?: boolean
  immer?: boolean
  subscriptions?: boolean
  version?: string
  migrations?: Record<number, (state: any) => any>
}

export interface AsyncActionConfig<T, R> {
  onStart?: (state: T) => void
  onSuccess?: (state: T, result: R) => void
  onError?: (state: T, error: Error) => void
  onFinally?: (state: T) => void
  retries?: number
  retryDelay?: number
}

// ===== TYPES POUR HOOKS =====
export interface UseStoreOptions {
  selector?: (state: AppState) => any
  equalityFn?: (a: any, b: any) => boolean
  defaultValue?: any
}

export interface StoreSubscriptionOptions {
  immediate?: boolean
  fireImmediately?: boolean
  equalityFn?: (a: any, b: any) => boolean
}

// ===== TYPES POUR PERSISTANCE =====
export interface StorageConfig {
  name: string
  version: number
  migrations?: Record<number, (state: any) => any>
  partialize?: (state: AppState) => Partial<AppState>
  merge?: (persistedState: any, currentState: AppState) => AppState
}

// ===== TYPES POUR DEVTOOLS =====
export interface DevtoolsConfig {
  name: string
  serialize?: boolean
  trace?: boolean
  traceLimit?: number
  features?: {
    pause?: boolean
    lock?: boolean
    persist?: boolean
    export?: boolean
    import?: string | boolean
    jump?: boolean
    skip?: boolean
    reorder?: boolean
    dispatch?: boolean
    test?: boolean
  }
}

// ===== ALIAS POUR COMPATIBILITÉ =====
export type AppStore = AppState