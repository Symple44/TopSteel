/**
 * 🏪 TYPES STORES CENTRALISÉS - TopSteel ERP
 * Types robustes et évolutifs pour tous les stores Zustand
 * Fichier: packages/types/src/stores.ts
 */

import type {
  StoreMetrics,
  StoreNotification,
  StoreProjet,
  StoreProjetFilters,
  StoreProjetStats,
  StoreSyncState,
  StoreUser,
} from './store-entities'
import type { ProjetFilters } from './domains/project'

// ===== TYPES DE BASE POUR STORES =====

/**
 * État de base commun à tous les stores
 */
export interface BaseStoreState {
  loading: boolean
  error: string | null
  lastUpdate: number
}

/**
 * Configuration pour la création des stores
 */
export interface StoreConfig {
  name: string
  persist?: boolean
  devtools?: boolean
  immer?: boolean
  subscriptions?: boolean
}

/**
 * Actions de base communes à tous les stores
 */
export interface BaseStoreActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

/**
 * Type générique pour créateur de store
 * Sépare les données (TState) des actions (TActions)
 */
export type StoreCreator<TState extends BaseStoreState, TActions = {}> = (
  set: (fn: (state: TState & TActions) => void) => void,
  get: () => TState & TActions
) => TActions

// ===== TYPES SPÉCIFIQUES APP STORE =====

/**
 * Interface pour les notifications (alias vers StoreNotification)
 */
export type NotificationItem = StoreNotification

/**
 * État de l'interface utilisateur
 */
export interface UIState {
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  layoutMode: 'compact' | 'default' | 'wide'
  activeModule: string | null
  showTooltips: boolean
}

/**
 * Métriques de performance (alias vers StoreMetrics)
 */
export type MetricsState = StoreMetrics

/**
 * Session utilisateur
 */
export interface SessionState {
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
}

/**
 * Filtres par module
 */
export interface FilterState {
  projets?: Record<string, any>
  stocks?: Record<string, any>
  production?: Record<string, any>
}

/**
 * État de synchronisation (alias vers StoreSyncState)
 */
export type SyncState = StoreSyncState

// ===== ÉTAT PRINCIPAL DE L'APP =====

/**
 * État de données de l'application (sans actions)
 */
export interface AppState extends BaseStoreState {
  // Configuration UI
  theme: 'light' | 'dark' | 'auto'
  ui: UIState

  // Données utilisateur
  user: StoreUser | null
  session: SessionState | null
  permissions: string[]

  // Données métier
  projets: StoreProjet[]
  selectedProjet: StoreProjet | null
  notifications: NotificationItem[]

  // Filtres et recherche
  filters: FilterState

  // Métriques et performance
  metrics: MetricsState

  // Synchronisation
  sync: SyncState
}

// ===== ACTIONS DE L'APP STORE =====

/**
 * Actions pour l'interface utilisateur
 */
export interface AppUIActions {
  setTheme: (theme: AppState['theme']) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPinned: (pinned: boolean) => void
  setLayoutMode: (mode: UIState['layoutMode']) => void
  setActiveModule: (module: string | null) => void
}

/**
 * Actions pour l'utilisateur
 */
export interface AppUserActions {
  setUser: (user: StoreUser | null) => void
  setSession: (session: SessionState | null) => void
  setPermissions: (permissions: string[]) => void
  logout: () => void
}

/**
 * Actions pour les données métier
 */
export interface AppDataActions {
  setProjets: (projets: StoreProjet[]) => void
  addProjet: (projet: StoreProjet) => void
  updateProjet: (id: string, updates: Partial<StoreProjet>) => void
  removeProjet: (id: string) => void
  setSelectedProjet: (projet: StoreProjet | null) => void
}

/**
 * Actions pour les notifications
 */
export interface AppNotificationActions {
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
}

/**
 * Actions pour les filtres
 */
export interface AppFilterActions {
  setFilters: (module: keyof FilterState, filters: Record<string, any>) => void
  clearFilters: (module: keyof FilterState) => void
  resetAllFilters: () => void
}

/**
 * Actions pour la synchronisation
 */
export interface AppSyncActions {
  setOnlineStatus: (isOnline: boolean) => void
  setPendingChanges: (count: number) => void
  triggerSync: () => Promise<void>
  resolveConflict: (conflictId: string, resolution: any) => void
}

/**
 * Toutes les actions de l'app store
 */
export interface AppStoreActions
  extends BaseStoreActions,
    AppUIActions,
    AppUserActions,
    AppDataActions,
    AppNotificationActions,
    AppFilterActions,
    AppSyncActions {}

/**
 * Store complet de l'application
 */
export type AppStore = AppState & AppStoreActions

// ===== TYPES POUR PROJET STORE =====

/**
 * Filtres pour les projets (utilise le type du domaine project)
 */
// Note: ProjetFilters est maintenant exporté depuis domains/project pour éviter les conflits

/**
 * Statistiques des projets (alias vers StoreProjetStats)
 */
export type ProjetStats = StoreProjetStats

/**
 * État du store projets
 */
export interface ProjetState extends BaseStoreState {
  projets: StoreProjet[]
  selectedProjet: StoreProjet | null
  filters: StoreProjetFilters
  searchTerm: string
  sortBy: keyof StoreProjet
  sortOrder: 'asc' | 'desc'
  currentPage: number
  pageSize: number
  totalCount: number
  lastFetch: number
  cacheTTL: number
  isSyncing: boolean
  stats: ProjetStats | null
}

/**
 * Actions du store projets
 */
export interface ProjetStoreActions extends BaseStoreActions {
  // Actions de données
  fetchProjets: (options?: { force?: boolean; filters?: StoreProjetFilters }) => Promise<StoreProjet[]>
  createProjet: (
    projet: Omit<StoreProjet, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<StoreProjet | null>
  updateProjet: (id: string, updates: Partial<StoreProjet>) => Promise<StoreProjet | null>
  deleteProjet: (id: string) => Promise<boolean>
  duplicateProjet: (id: string) => Promise<StoreProjet | null>

  // Actions de sélection
  setSelectedProjet: (projet: StoreProjet | null) => void
  selectProjetById: (id: string) => void

  // Actions de filtrage
  setFilters: (filters: Partial<StoreProjetFilters>) => void
  clearFilters: () => void
  setSearchTerm: (term: string) => void

  // Actions de tri et pagination
  setSorting: (sortBy: keyof StoreProjet, sortOrder?: 'asc' | 'desc') => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void

  // Actions de cache
  invalidateCache: () => void
  refreshStats: () => Promise<void>
}

/**
 * Store complet des projets
 */
export type ProjetStore = ProjetState & ProjetStoreActions

// ===== TYPES UTILITAIRES =====

/**
 * Extracteur du state d'un store
 */
export type ExtractState<T> = T extends infer U & BaseStoreActions
  ? Omit<U, keyof BaseStoreActions>
  : never

/**
 * Extracteur des actions d'un store
 */
export type ExtractActions<T> = T extends infer U & BaseStoreState
  ? Omit<U, keyof BaseStoreState>
  : never

/**
 * Type pour l'état initial d'un store
 */
export type InitialState<T extends BaseStoreState> = Omit<T, keyof BaseStoreActions>

/**
 * Type pour la définition d'un store
 */
export type StoreDefinition<TState extends BaseStoreState, TActions> = StoreCreator<
  TState,
  TActions
>
