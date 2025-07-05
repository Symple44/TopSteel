/**
 * 🏪 STORE PRINCIPAL ROBUSTE - TopSteel ERP
 * Store principal de l'application avec gestion robuste des états et évolutivité
 * Fichier: apps/web/src/stores/app.store.ts
 */
import { StoreUtils } from '@/lib/store-utils'
import type {
  AppState,
  MetricsState,
  NotificationItem,
  NotificationState,
  UIState
} from '@erp/types'

// ===== ÉTAT INITIAL =====
const initialUIState: UIState = {
  sidebarCollapsed: false,
  sidebarPinned: true,
  layoutMode: 'default',
  activeModule: null,
  showTooltips: true,
  theme: 'light',
  language: 'fr',
  timezone: 'Europe/Paris'
}

const initialMetricsState: MetricsState = {
  pageViews: 0,
  actionCount: 0,
  lastActivity: Date.now(),
  sessionStart: Date.now(),
  errorCount: 0,
  performanceMetrics: {
    averageLoadTime: 0,
    slowQueries: 0,
    memoryUsage: 0
  }
}

const initialNotificationState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  filters: {},
  settings: {
    enableSound: true,
    enableToast: true,
    enableBrowser: true,
    enableEmail: false,
    categories: {
      system: true,
      stock: true,
      projet: true,
      production: true,
      maintenance: true,
      qualite: true,
      facturation: true
    },
    priority: {
      low: true,
      normal: true,
      high: true,
      urgent: true
    }
  }
}

const initialAppState = {
  // État UI
  ui: initialUIState,
  
  // Données utilisateur
  user: null,
  session: null,
  permissions: [],
  
  // Données métier
  projets: [],
  selectedProjet: null,
  
  // Notifications
  notifications: initialNotificationState,
  
  // Filtres
  filters: {},
  
  // Métriques
  metrics: initialMetricsState,
  
  // État de synchronisation
  sync: {
    isOnline: navigator.onLine ?? true,
    lastSync: 0,
    pendingChanges: 0,
    conflictResolution: 'client' as const
  }
}

// ===== CRÉATION DU STORE =====
export const useAppStore = StoreUtils.createRobustStore<AppState>(
  initialAppState,
  (set, get) => ({
    ...initialAppState,
    
    // ===== ACTIONS UI =====
    setTheme: (theme) => set((state: AppState) => {
      state.ui.theme = theme
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
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    setLanguage: (language) => set((state: AppState) => {
      state.ui.language = language
      state.lastUpdate = Date.now()
    }),
    
    // ===== ACTIONS UTILISATEUR =====
    setUser: (user) => set((state: AppState) => {
      state.user = user
      state.lastUpdate = Date.now()
      
      // Auto-logout si user devient null
      if (!user) {
        state.session = null
        state.permissions = []
      }
    }),
    
    setSession: (session) => set((state: AppState) => {
      state.session = session
      state.lastUpdate = Date.now()
      
      // Vérifier la validité de la session
      if (session && session.expiresAt && session.expiresAt < Date.now()) {
        state.session = null
        state.user = null
        state.permissions = []
      }
    }),

    setPermissions: (permissions) => set((state: AppState) => {
      state.permissions = permissions
      state.lastUpdate = Date.now()
    }),

    updateUserPreferences: (preferences) => set((state: AppState) => {
      if (state.user) {
        state.user = { ...state.user, ...preferences }
        state.lastUpdate = Date.now()
      }
    }),
    
    // ===== ACTIONS DONNÉES =====
    setProjets: (projets) => set((state: AppState) => {
      state.projets = projets
      state.lastUpdate = Date.now()
    }),
    
    addProjet: (projet) => set((state: AppState) => {
      // Vérifier la duplication
      const exists = state.projets.some(p => p.id === projet.id)
      if (!exists) {
        state.projets.unshift(projet) // Ajouter au début
        state.metrics.actionCount++
      }
      state.lastUpdate = Date.now()
    }),
    
    updateProjet: (id, updates) => set((state: AppState) => {
      const index = state.projets.findIndex(p => p.id === id)
      if (index !== -1) {
        state.projets[index] = { ...state.projets[index], ...updates }
        
        // Mettre à jour le projet sélectionné si c'est le même
        if (state.selectedProjet?.id === id) {
          state.selectedProjet = state.projets[index]
        }
        
        state.metrics.actionCount++
      }
      state.lastUpdate = Date.now()
    }),
    
    removeProjet: (id) => set((state: AppState) => {
      const index = state.projets.findIndex(p => p.id === id)
      if (index !== -1) {
        state.projets.splice(index, 1)
        
        // Désélectionner si c'est le projet supprimé
        if (state.selectedProjet?.id === id) {
          state.selectedProjet = null
        }
        
        state.metrics.actionCount++
      }
      state.lastUpdate = Date.now()
    }),

    setSelectedProjet: (projet) => set((state: AppState) => {
      state.selectedProjet = projet
      state.lastUpdate = Date.now()
    }),
    
    // ===== ACTIONS NOTIFICATIONS =====
    addNotification: (notification) => set((state: AppState) => {
      const newNotification: NotificationItem = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      }
      
      state.notifications.notifications.unshift(newNotification)
      state.notifications.unreadCount = state.notifications.notifications.filter(n => !n.read).length
      
      // Limiter le nombre de notifications (garder les 100 plus récentes)
      if (state.notifications.notifications.length > 100) {
        state.notifications.notifications = state.notifications.notifications.slice(0, 100)
      }
      
      state.lastUpdate = Date.now()
    }),
    
    removeNotification: (id) => set((state: AppState) => {
      const notification = state.notifications.notifications.find(n => n.id === id)
      state.notifications.notifications = state.notifications.notifications.filter(n => n.id !== id)
      
      // Recalculer le compteur de non-lus
      state.notifications.unreadCount = state.notifications.notifications.filter(n => !n.read).length
      
      state.lastUpdate = Date.now()
    }),

    markNotificationAsRead: (id) => set((state: AppState) => {
      const notification = state.notifications.notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        notification.read = true
        state.notifications.unreadCount = Math.max(0, state.notifications.unreadCount - 1)
      }
      state.lastUpdate = Date.now()
    }),
    
    clearNotifications: () => set((state: AppState) => {
      state.notifications.notifications = []
      state.notifications.unreadCount = 0
      state.lastUpdate = Date.now()
    }),

    clearReadNotifications: () => set((state: AppState) => {
      state.notifications.notifications = state.notifications.notifications.filter(n => !n.read)
      // Le unreadCount ne change pas car on ne supprime que les lues
      state.lastUpdate = Date.now()
    }),

    updateNotificationSettings: (settings) => set((state: AppState) => {
      state.notifications.settings = { ...state.notifications.settings, ...settings }
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

    resetAllFilters: () => set((state: AppState) => {
      state.filters = {}
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    setGlobalSearch: (search) => set((state: AppState) => {
      if (!state.filters.global) {
        state.filters.global = { activeFilters: [] }
      }
      state.filters.global.search = search
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS MÉTRIQUES =====
    incrementPageView: () => set((state: AppState) => {
      state.metrics.pageViews++
      state.metrics.lastActivity = Date.now()
      state.lastUpdate = Date.now()
    }),

    incrementActionCount: () => set((state: AppState) => {
      state.metrics.actionCount++
      state.metrics.lastActivity = Date.now()
      state.lastUpdate = Date.now()
    }),

    recordError: () => set((state: AppState) => {
      state.metrics.errorCount++
      state.lastUpdate = Date.now()
    }),

    updatePerformanceMetric: (metric, value) => set((state: AppState) => {
      state.metrics.performanceMetrics[metric] = value
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS SYNCHRONISATION =====
    setOnlineStatus: (isOnline) => set((state: AppState) => {
      state.sync.isOnline = isOnline
      state.lastUpdate = Date.now()
      
      // Si on revient en ligne, marquer pour sync
      if (isOnline && state.sync.pendingChanges > 0) {
        // Trigger sync logic here
      }
    }),

    markAsNeedingSync: () => set((state: AppState) => {
      state.sync.pendingChanges++
      state.lastUpdate = Date.now()
    }),

    markAsSynced: () => set((state: AppState) => {
      state.sync.lastSync = Date.now()
      state.sync.pendingChanges = 0
      state.lastUpdate = Date.now()
    }),

    handleSyncConflict: (resolution) => set((state: AppState) => {
      state.sync.conflictResolution = resolution
      state.lastUpdate = Date.now()
    }),

    // Les actions de base sont automatiquement ajoutées par StoreUtils.createBaseActions
  }),
  {
    name: 'app-store',
    persist: true,
    devtools: true,
    immer: true,
    subscriptions: true,
    version: '2.0.0',
    migrations: {
      1: (state: any) => {
        // Migration de la v1 vers v2
        return {
          ...state,
          notifications: initialNotificationState,
          sync: initialAppState.sync
        }
      }
    }
  }
)

// ===== HOOKS DE CONVENANCE =====
export const useAppUser = () => useAppStore(state => state.user)
export const useAppSession = () => useAppStore(state => state.session)
export const useAppTheme = () => useAppStore(state => state.ui.theme)
export const useAppLoading = () => useAppStore(state => state.loading)
export const useAppError = () => useAppStore(state => state.error)
export const useAppOnlineStatus = () => useAppStore(state => state.sync.isOnline)

// ===== SÉLECTEURS COMPLEXES =====
export const appSelectors = {
  // Sélecteur pour l'état d'authentification complet
  authState: (state: AppState) => ({
    user: state.user,
    session: state.session,
    isAuthenticated: !!(state.user && state.session),
    permissions: state.permissions,
    isSessionValid: !!(state.session && state.session.expiresAt && state.session.expiresAt > Date.now())
  }),

  // Sélecteur pour les projets avec filtres appliqués
  filteredProjets: (state: AppState) => {
    let projets = state.projets
    const filters = state.filters.projets

    if (!filters) return projets

    if (filters.statut?.length) {
      projets = projets.filter(p => filters.statut!.includes(p.statut))
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      projets = projets.filter(p => 
        p.nom?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search) ||
        p.reference?.toLowerCase().includes(search)
      )
    }

    return projets
  },

  // Sélecteur pour les notifications non lues par priorité
  criticalNotifications: (state: AppState) => 
    state.notifications.notifications.filter(n => 
      !n.read && (n.priority === 'high' || n.priority === 'urgent')
    ),

  // Sélecteur pour les métriques de performance
  performanceStatus: (state: AppState) => ({
    ...state.metrics.performanceMetrics,
    sessionDuration: Date.now() - state.metrics.sessionStart,
    activityScore: state.metrics.actionCount / Math.max(1, state.metrics.pageViews),
    errorRate: state.metrics.errorCount / Math.max(1, state.metrics.actionCount)
  })
}

// ===== TYPES EXPORTÉS (réexports depuis @erp/types) =====
export type {
  AppState,
  AppState as AppStore, FilterState, MetricsState, NotificationItem,
  NotificationState, SessionState, // Alias pour compatibilité
  UIState
} from '@erp/types'
