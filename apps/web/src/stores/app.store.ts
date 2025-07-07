/**
 * 🏪 STORE PRINCIPAL CORRIGÉ - TopSteel ERP
 * Store principal de l'application avec hooks et architecture évolutive
 * Fichier: apps/web/src/stores/app.store.ts
 */

import { StoreUtils } from '@/lib/store-utils'
import type {
  AppState,
  AppStore,
  AppStoreActions,
  InitialState,
  StoreCreator,
  StoreUser
} from '@erp/types'

// ===== ÉTAT INITIAL =====

const initialAppState: InitialState<AppState> = {
  // État de base (BaseStoreState)
  loading: false,
  error: null,
  lastUpdate: Date.now(),
  
  // Configuration UI
  theme: 'light',
  ui: {
    sidebarCollapsed: false,
    sidebarPinned: true,
    layoutMode: 'default',
    activeModule: null,
    showTooltips: true
  },
  
  // Données utilisateur
  user: null,
  session: null,
  permissions: [],
  
  // Données métier
  projets: [],
  selectedProjet: null,
  notifications: [],
  
  // Filtres et recherche
  filters: {},
  
  // Métriques
  metrics: {
    pageViews: 0,
    actionCount: 0,
    lastActivity: Date.now(),
    sessionStart: Date.now(),
    userCount: 0,
    projectCount: 0,
    orderCount: 0,
    revenue: 0,
    performance: {
      loadTime: 0,
      errorRate: 0,
      uptime: 100
    }
  },
  
  // Synchronisation
  sync: {
    isOnline: navigator?.onLine ?? true,
    pendingChanges: 0,
    lastSync: Date.now(),
    conflictCount: 0,
    syncInProgress: false,
    autoSyncEnabled: true
  }
}

// ===== DÉFINITION DU STORE =====

const createAppStoreActions: StoreCreator<AppState, AppStoreActions> = (set, get) => ({
  // ===== ACTIONS DE BASE =====
  setLoading: (loading: boolean) => {
    set((state) => {
      state.loading = loading
      state.lastUpdate = Date.now()
    })
  },

  setError: (error: string | null) => {
    set((state) => {
      state.error = error
      state.loading = false
      state.lastUpdate = Date.now()
    })
  },

  clearError: () => {
    set((state) => {
      state.error = null
      state.lastUpdate = Date.now()
    })
  },

  reset: () => {
    set((state) => {
      Object.assign(state, {
        ...initialAppState,
        loading: false,
        error: null,
        lastUpdate: Date.now()
      })
    })
  },

  // ===== ACTIONS UI =====
  setTheme: (theme) => {
    set((state) => {
      state.theme = theme
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  setSidebarCollapsed: (collapsed) => {
    set((state) => {
      state.ui.sidebarCollapsed = collapsed
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  setSidebarPinned: (pinned) => {
    set((state) => {
      state.ui.sidebarPinned = pinned
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  setLayoutMode: (mode) => {
    set((state) => {
      state.ui.layoutMode = mode
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  setActiveModule: (module) => {
    set((state) => {
      state.ui.activeModule = module
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS UTILISATEUR =====
  setUser: (user: StoreUser | null) => {
    set((state) => {
      state.user = user
      state.lastUpdate = Date.now()
      
      if (!user) {
        state.permissions = []
        state.session = null
      }
    })
  },

  setSession: (session) => {
    set((state) => {
      state.session = session
      state.lastUpdate = Date.now()
    })
  },

  setPermissions: (permissions) => {
    set((state) => {
      state.permissions = permissions
      state.lastUpdate = Date.now()
    })
  },

  logout: () => {
    set((state) => {
      state.user = null
      state.session = null
      state.permissions = []
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS DONNÉES MÉTIER =====
  setProjets: (projets) => {
    set((state) => {
      state.projets = projets
      state.metrics.projectCount = projets.length
      state.lastUpdate = Date.now()
    })
  },

  addProjet: (projet) => {
    set((state) => {
      state.projets.push(projet)
      state.metrics.projectCount = state.projets.length
      state.lastUpdate = Date.now()
    })
  },

  updateProjet: (id, updates) => {
    set((state) => {
      const index = state.projets.findIndex(p => p.id === id)
      if (index !== -1) {
        state.projets[index] = { ...state.projets[index], ...updates }
        
        // Mettre à jour le projet sélectionné si c'est le même
        if (state.selectedProjet?.id === id) {
          state.selectedProjet = state.projets[index]
        }
        
        state.lastUpdate = Date.now()
      }
    })
  },

  removeProjet: (id) => {
    set((state) => {
      state.projets = state.projets.filter(p => p.id !== id)
      
      // Désélectionner si c'était le projet sélectionné
      if (state.selectedProjet?.id === id) {
        state.selectedProjet = null
      }
      
      state.metrics.projectCount = state.projets.length
      state.lastUpdate = Date.now()
    })
  },

  setSelectedProjet: (projet) => {
    set((state) => {
      state.selectedProjet = projet
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS NOTIFICATIONS =====
  addNotification: (notification) => {
    set((state) => {
      const newNotification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date()
      }
      state.notifications.unshift(newNotification)
      state.lastUpdate = Date.now()
    })
  },

  removeNotification: (id) => {
    set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id)
      state.lastUpdate = Date.now()
    })
  },

  clearNotifications: () => {
    set((state) => {
      state.notifications = []
      state.lastUpdate = Date.now()
    })
  },

  markNotificationAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
        state.lastUpdate = Date.now()
      }
    })
  },

  markAllNotificationsAsRead: () => {
    set((state) => {
      state.notifications.forEach(n => n.read = true)
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS FILTRES =====
  setFilters: (module, filters) => {
    set((state) => {
      state.filters[module] = filters
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  clearFilters: (module) => {
    set((state) => {
      delete state.filters[module]
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  resetAllFilters: () => {
    set((state) => {
      state.filters = {}
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    })
  },

  // ===== ACTIONS SYNCHRONISATION =====
  setOnlineStatus: (isOnline) => {
    set((state) => {
      if (state.sync) {
        state.sync.isOnline = isOnline
      }
      state.lastUpdate = Date.now()
      
      if (isOnline && state.sync && state.sync.pendingChanges > 0) {
        console.log('Connexion restaurée, synchronisation en attente...')
      }
    })
  },

  setPendingChanges: (count) => {
    set((state) => {
      if (state.sync) {
        state.sync.pendingChanges = count
      }
      state.lastUpdate = Date.now()
    })
  },

  triggerSync: async () => {
    const currentState = get()
    if (!currentState.sync?.isOnline) {
      console.warn('Synchronisation impossible: hors ligne')
      return
    }

    set((state) => {
      state.loading = true
      state.error = null
    })

    try {
      console.log('Synchronisation en cours...')
      
      // Simulation d'une sync
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      set((state) => {
        if (state.sync) {
          state.sync.lastSync = Date.now()
          state.sync.pendingChanges = 0
        }
        state.loading = false
        state.lastUpdate = Date.now()
      })
      
      console.log('Synchronisation terminée')
    } catch (error) {
      set((state) => {
        state.loading = false
        state.error = error instanceof Error ? error.message : 'Erreur de synchronisation'
        state.lastUpdate = Date.now()
      })
      
      console.error('Erreur de synchronisation:', error)
    }
  },

  resolveConflict: (conflictId, resolution) => {
    set((state) => {
      if (state.sync) {
        state.sync.conflictCount = Math.max(0, state.sync.conflictCount - 1)
      }
      state.lastUpdate = Date.now()
      console.log(`Conflit résolu: ${conflictId}`, resolution)
    })
  }
})

// ===== CRÉATION DU STORE =====

export const useAppStore = StoreUtils.createRobustStore<AppState, AppStoreActions>(
  initialAppState,
  createAppStoreActions,
  {
    name: 'app-store',
    persist: true,
    devtools: true,
    immer: true,
    subscriptions: true
  }
)

// ===== HOOKS SÉLECTEURS POUR COMPATIBILITÉ =====

export const useAppError = () => useAppStore(state => state.error)
export const useAppLoading = () => useAppStore(state => state.loading)
export const useAppUser = () => useAppStore(state => state.user)
export const useAppTheme = () => useAppStore(state => state.theme)
export const useAppSession = () => useAppStore(state => state.session)
export const useAppOnlineStatus = () => useAppStore(state => state.sync?.isOnline ?? true)

// ===== EXPORTS =====
export type { AppState, AppStore, AppStoreActions }
