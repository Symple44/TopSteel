/**
 * 🏪 STORE PRINCIPAL - TopSteel ERP
 * Store principal de l'application avec gestion robuste des états
 * Fichier: apps/web/src/stores/app.store.ts
 */
import { StoreUtils, type BaseStoreState } from '@/lib/store-utils'
import type { Projet, User } from '@erp/types'

// ===== INTERFACES =====
interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: number
}

interface UIState {
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  layoutMode: 'compact' | 'default' | 'wide'
  activeModule: string | null
  showTooltips: boolean
}

interface MetricsState {
  pageViews: number
  actionCount: number
  lastActivity: number
  sessionStart: number
}

interface SessionState {
  token: string | null
  refreshToken: string | null
  expiresAt: number | null
}

interface AppState extends BaseStoreState {
  // État UI
  theme: 'light' | 'dark' | 'auto'
  ui: UIState
  
  // Données utilisateur
  user: User | null
  session: SessionState | null
  
  // Données métier
  projets: Projet[]
  notifications: NotificationItem[]
  
  // Filtres
  filters: {
    projets?: Record<string, any>
    stocks?: Record<string, any>
    production?: Record<string, any>
  }
  
  // Métriques
  metrics: MetricsState

  // ===== ACTIONS =====
  // Actions UI
  setTheme: (theme: AppState['theme']) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPinned: (pinned: boolean) => void
  setLayoutMode: (mode: UIState['layoutMode']) => void
  setActiveModule: (module: string | null) => void
  
  // Actions utilisateur
  setUser: (user: User | null) => void
  setSession: (session: SessionState | null) => void
  
  // Actions données
  setProjets: (projets: Projet[]) => void
  addProjet: (projet: Projet) => void
  updateProjet: (id: string, updates: Partial<Projet>) => void
  removeProjet: (id: string) => void
  
  // Actions notifications
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Actions filtres
  setFilters: (module: keyof AppState['filters'], filters: Record<string, any>) => void
  clearFilters: (module: keyof AppState['filters']) => void
  
  // Actions de base
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  reset: () => void
}

// ===== ÉTAT INITIAL =====
const initialAppState: Omit<AppState, 'setTheme' | 'setSidebarCollapsed' | 'setSidebarPinned' | 'setLayoutMode' | 'setActiveModule' | 'setUser' | 'setSession' | 'setProjets' | 'addProjet' | 'updateProjet' | 'removeProjet' | 'addNotification' | 'removeNotification' | 'clearNotifications' | 'setFilters' | 'clearFilters' | 'setLoading' | 'setError' | 'clearError' | 'reset'> = {
  // État de base
  loading: false,
  error: null,
  lastUpdate: 0,
  
  // UI
  theme: 'light',
  ui: {
    sidebarCollapsed: false,
    sidebarPinned: true,
    layoutMode: 'default',
    activeModule: null,
    showTooltips: true
  },
  
  // Utilisateur
  user: null,
  session: null,
  
  // Données
  projets: [],
  notifications: [],
  filters: {},
  
  // Métriques
  metrics: {
    pageViews: 0,
    actionCount: 0,
    lastActivity: Date.now(),
    sessionStart: Date.now()
  }
}

// ===== CRÉATION DU STORE =====
export const useAppStore = StoreUtils.createRobustStore<AppState>(
  initialAppState as AppState,
  (set, get) => {
    const baseActions = StoreUtils.createBaseActions<AppState>()
    
    return {
      ...initialAppState,
      
      // ===== ACTIONS UI =====
      setTheme: (theme) => set((state: AppState) => {
        state.theme = theme
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      setSidebarCollapsed: (collapsed) => set((state: AppState) => {
        state.ui.sidebarCollapsed = collapsed
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      setSidebarPinned: (pinned) => set((state: AppState) => {
        state.ui.sidebarPinned = pinned
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      setLayoutMode: (mode) => set((state: AppState) => {
        state.ui.layoutMode = mode
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      setActiveModule: (module) => set((state: AppState) => {
        state.ui.activeModule = module
        if (module) {
          state.metrics.pageViews++
        }
        state.metrics.lastActivity = Date.now()
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS UTILISATEUR =====
      setUser: (user) => set((state: AppState) => {
        state.user = user
        state.metrics.lastActivity = Date.now()
        state.lastUpdate = Date.now()
      }),
      
      setSession: (session) => set((state: AppState) => {
        state.session = session
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS DONNÉES =====
      setProjets: (projets) => set((state: AppState) => {
        state.projets = projets
        state.lastUpdate = Date.now()
      }),
      
      addProjet: (projet) => set((state: AppState) => {
        state.projets.push(projet)
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      updateProjet: (id, updates) => set((state: AppState) => {
        const index = state.projets.findIndex(p => p.id === id)
        if (index !== -1) {
          Object.assign(state.projets[index], updates)
          state.metrics.actionCount++
          state.lastUpdate = Date.now()
        }
      }),
      
      removeProjet: (id) => set((state: AppState) => {
        state.projets = state.projets.filter(p => p.id !== id)
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS NOTIFICATIONS =====
      addNotification: (notification) => set((state: AppState) => {
        state.notifications.push({
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        })
        state.lastUpdate = Date.now()
      }),
      
      removeNotification: (id) => set((state: AppState) => {
        state.notifications = state.notifications.filter(n => n.id !== id)
        state.lastUpdate = Date.now()
      }),
      
      clearNotifications: () => set((state: AppState) => {
        state.notifications = []
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS FILTRES =====
      setFilters: (module, filters) => set((state: AppState) => {
        state.filters[module] = filters
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      clearFilters: (module) => set((state: AppState) => {
        delete state.filters[module]
        state.metrics.actionCount++
        state.lastUpdate = Date.now()
      }),
      
      // ===== ACTIONS DE BASE =====
      setLoading: baseActions.setLoading,
      setError: baseActions.setError,
      clearError: baseActions.clearError,
      reset: () => set((state: AppState) => {
        Object.assign(state, {
          ...initialAppState,
          metrics: {
            ...initialAppState.metrics,
            sessionStart: Date.now()
          }
        })
      })
      
    } as AppState
  },
  {
    name: 'app-store',
    persist: true,
    devtools: true,
    immer: true,
    subscriptions: true
  }
)

// ===== TYPES EXPORTÉS =====
export type { AppState, MetricsState, NotificationItem, SessionState, UIState }
