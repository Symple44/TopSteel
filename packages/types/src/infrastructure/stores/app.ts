/**
 * 🏪 APP STORE TYPES - TopSteel ERP
 * Types pour le store principal de l'application
 * Fichier: packages/types/src/infrastructure/stores/app.ts
 */

import type { BaseStoreActions, BaseStoreState } from './base'
import type {
  StoreMetrics,
  StoreNotification,
  StoreProjet,
  StoreSyncState,
  StoreUser,
} from './entities'

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
