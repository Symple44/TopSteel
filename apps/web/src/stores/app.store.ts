/**
 * 🏪 STORE PRINCIPAL CORRIGÉ - TopSteel ERP
 * Store principal de l'application avec types robustes et architecture évolutive
 * Fichier: apps/web/src/stores/app.store.ts
 */

import { StoreUtils } from '@/lib/store-utils'
import type {
  AppState,
  AppStore,
  AppStoreActions,
  InitialState,
  StoreCreator,
  StoreProjet,
  StoreUser
} from '@erp/types'

// ===== ÉTAT INITIAL =====

/**
 * État initial de l'application (sans les actions)
 * Type correct pour éviter l'erreur TypeScript
 */
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

/**
 * Créateur d'actions pour le store principal
 * Utilise la nouvelle signature TypeScript corrigée
 */
const createAppStoreActions: StoreCreator<AppState, AppStoreActions> = (set, get) => {
  // Actions de base communes
  const baseActions = StoreUtils.createBaseActions(initialAppState)

  return {
    // ===== ACTIONS DE BASE =====
    ...baseActions,

    // ===== ACTIONS UI =====
    setTheme: (theme) => set((state) => {
      state.theme = theme
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    setSidebarCollapsed: (collapsed) => set((state) => {
      state.ui.sidebarCollapsed = collapsed
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    setSidebarPinned: (pinned) => set((state) => {
      state.ui.sidebarPinned = pinned
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    setLayoutMode: (mode) => set((state) => {
      state.ui.layoutMode = mode
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    setActiveModule: (module) => set((state) => {
      state.ui.activeModule = module
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS UTILISATEUR =====
    setUser: (user: StoreUser | null) => set((state) => {
      state.user = user
      state.lastUpdate = Date.now()
      
      // Réinitialiser les permissions si pas d'utilisateur
      if (!user) {
        state.permissions = []
        state.session = null
      }
    }),

    setSession: (session) => set((state) => {
      state.session = session
      state.lastUpdate = Date.now()
      
      // Mettre à jour l'état de connexion
      if (!session) {
        state.user = null
        state.permissions = []
      }
    }),

    setPermissions: (permissions) => set((state) => {
      state.permissions = permissions
      state.lastUpdate = Date.now()
    }),

    logout: () => set((state) => {
      state.user = null
      state.session = null
      state.permissions = []
      state.selectedProjet = null
      state.notifications = []
      state.filters = {}
      state.lastUpdate = Date.now()
      
      // Réinitialiser les métriques de session
      state.metrics.sessionStart = Date.now()
      state.metrics.actionCount = 0
    }),

    // ===== ACTIONS DONNÉES MÉTIER =====
    setProjets: (projets: StoreProjet[]) => set((state) => {
      state.projets = projets
      state.lastUpdate = Date.now()
      
      // Vérifier si le projet sélectionné existe toujours
      if (state.selectedProjet && !projets.find(p => p.id === state.selectedProjet?.id)) {
        state.selectedProjet = null
      }
    }),

    addProjet: (projet: StoreProjet) => set((state) => {
      // Vérifier que le projet n'existe pas déjà
      const existingIndex = state.projets.findIndex(p => p.id === projet.id)
      if (existingIndex === -1) {
        state.projets.push(projet)
        state.lastUpdate = Date.now()
      }
    }),

    updateProjet: (id: string, updates: Partial<StoreProjet>) => set((state) => {
      const projetIndex = state.projets.findIndex(p => p.id === id)
      if (projetIndex !== -1) {
        state.projets[projetIndex] = { ...state.projets[projetIndex], ...updates }
        state.lastUpdate = Date.now()
        
        // Mettre à jour le projet sélectionné si nécessaire
        if (state.selectedProjet?.id === id) {
          state.selectedProjet = { ...state.selectedProjet, ...updates }
        }
      }
    }),

    removeProjet: (id) => set((state) => {
      state.projets = state.projets.filter(p => p.id !== id)
      state.lastUpdate = Date.now()
      
      // Désélectionner si c'était le projet sélectionné
      if (state.selectedProjet?.id === id) {
        state.selectedProjet = null
      }
    }),

    setSelectedProjet: (projet: StoreProjet | null) => set((state) => {
      state.selectedProjet = projet
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS NOTIFICATIONS =====
    addNotification: (notification) => set((state) => {
      const newNotification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date(),  // ✅ Utiliser Date au lieu de Date.now()
        read: false
      }
      
      state.notifications.unshift(newNotification)
      
      // Limiter à 50 notifications max
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
      
      state.lastUpdate = Date.now()
    }),

    removeNotification: (id) => set((state) => {
      state.notifications = state.notifications.filter(n => n.id !== id)
      state.lastUpdate = Date.now()
    }),

    clearNotifications: () => set((state) => {
      state.notifications = []
      state.lastUpdate = Date.now()
    }),

    markNotificationAsRead: (id) => set((state) => {
      const notification = state.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = true
        state.lastUpdate = Date.now()
      }
    }),

    markAllNotificationsAsRead: () => set((state) => {
      state.notifications.forEach(n => n.read = true)
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS FILTRES =====
    setFilters: (module, filters) => set((state) => {
      state.filters[module] = filters
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    clearFilters: (module) => set((state) => {
      delete state.filters[module]
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    resetAllFilters: () => set((state) => {
      state.filters = {}
      state.metrics.actionCount++
      state.lastUpdate = Date.now()
    }),

    // ===== ACTIONS SYNCHRONISATION =====
    setOnlineStatus: (isOnline) => set((state) => {
      state.sync.isOnline = isOnline
      state.lastUpdate = Date.now()
      
      if (isOnline && state.sync.pendingChanges > 0) {
        // Déclencher une sync automatique si on redevient en ligne
        console.log('Connexion restaurée, synchronisation en attente...')
      }
    }),

    setPendingChanges: (count) => set((state) => {
      state.sync.pendingChanges = count
      state.lastUpdate = Date.now()
    }),

    triggerSync: async () => {
      const currentState = get()
      if (!currentState.sync.isOnline) {
        console.warn('Synchronisation impossible: hors ligne')
        return
      }

      set((state) => {
        state.loading = true
        state.error = null
      })

      try {
        // Ici, implémenter la logique de synchronisation
        console.log('Synchronisation en cours...')
        
        // Simulation d'une sync
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        set((state) => {
          state.sync.lastSync = Date.now()
          state.sync.pendingChanges = 0
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

    resolveConflict: (conflictId, resolution) => set((state) => {
      // Ici, implémenter la résolution de conflits
      state.sync.conflictCount = Math.max(0, state.sync.conflictCount - 1)
      state.lastUpdate = Date.now()
      console.log(`Conflit résolu: ${conflictId}`, resolution)
    })
  }
}

// ===== CRÉATION DU STORE =====

/**
 * Store principal de l'application avec signature corrigée
 */
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

// ===== EXPORTS =====
export type { AppState, AppStore, AppStoreActions }
