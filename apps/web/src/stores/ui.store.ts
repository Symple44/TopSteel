// apps/web/src/stores/ui.store.ts - VERSION ENTERPRISE SSR-SAFE
import { ID } from '@/lib/id-system'
import { createStoreWithPersist, StoreMonitor } from '@/lib/store-utils'
import { create } from 'zustand'

// ✅ TYPES ENTERPRISE POUR TOASTS
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  timestamp: number // ✅ Ajout timestamp pour tri et expiration
  priority?: 'low' | 'normal' | 'high' // ✅ Priorité pour file d'attente
  actions?: ToastAction[] // ✅ Actions personnalisées
  persistent?: boolean // ✅ Toast qui ne disparaît pas automatiquement
}

interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'destructive'
}

// ✅ CONFIGURATION TOAST ENTERPRISE
interface ToastConfig {
  maxToasts?: number
  defaultDuration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
  stackDirection?: 'up' | 'down'
  animations?: boolean
}

// ✅ ÉTAT UI ENTERPRISE
interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  sidebarPinned: boolean // ✅ Nouveau: sidebar épinglée
  
  // Vues
  dataView: 'grid' | 'table' | 'kanban' // ✅ Ajout vue kanban
  compactMode: boolean // ✅ Mode compact
  
  // Toasts avec système avancé
  toasts: Toast[]
  toastConfig: ToastConfig
  toastQueue: Toast[] // ✅ File d'attente si trop de toasts
  
  // Thème et apparence
  theme: 'light' | 'dark' | 'auto'
  accentColor: string // ✅ Couleur d'accent personnalisable
  
  // Performance et état
  isLoading: boolean
  lastActivity: number // ✅ Tracking activité utilisateur
  
  // === ACTIONS ===
  
  // Sidebar
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarPin: () => void
  
  // Vues
  setDataView: (view: 'grid' | 'table' | 'kanban') => void
  toggleCompactMode: () => void
  
  // Toasts Enterprise
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
  updateToastConfig: (config: Partial<ToastConfig>) => void
  
  // Raccourcis toasts
  showSuccess: (title: string, message?: string, actions?: ToastAction[]) => void
  showError: (title: string, message?: string, persistent?: boolean) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
  
  // Thème
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setAccentColor: (color: string) => void
  
  // Utilitaires
  updateActivity: () => void
  setLoading: (loading: boolean) => void
}

/**
 * ✅ STORE UI ENTERPRISE AVEC SSR-SAFE
 */
export const useUIStore = create<UIState>()(
  createStoreWithPersist(
    (set, get) => ({
      // ✅ ÉTAT INITIAL
      sidebarCollapsed: false,
      sidebarPinned: true,
      dataView: 'grid',
      compactMode: false,
      toasts: [],
      toastQueue: [],
      toastConfig: {
        maxToasts: 5,
        defaultDuration: 5000,
        position: 'top-right',
        stackDirection: 'down',
        animations: true
      },
      theme: 'auto',
      accentColor: '#3b82f6',
      isLoading: false,
      lastActivity: Date.now(),

      // ✅ ACTIONS SIDEBAR AVEC MONITORING
      toggleSidebar: StoreMonitor.measureAction('ui', 'toggleSidebar', () => {
        set((state) => {
          state.sidebarCollapsed = !state.sidebarCollapsed
          state.lastActivity = Date.now()
        })
      }),

      setSidebarCollapsed: StoreMonitor.measureAction('ui', 'setSidebarCollapsed', (collapsed: boolean) => {
        set((state) => {
          state.sidebarCollapsed = collapsed
          state.lastActivity = Date.now()
        })
      }),

      toggleSidebarPin: () => set((state) => {
        state.sidebarPinned = !state.sidebarPinned
        state.lastActivity = Date.now()
      }),

      // ✅ ACTIONS VUES
      setDataView: (view) => set((state) => {
        state.dataView = view
        state.lastActivity = Date.now()
      }),

      toggleCompactMode: () => set((state) => {
        state.compactMode = !state.compactMode
        state.lastActivity = Date.now()
      }),

      // ✅ SYSTÈME TOAST ENTERPRISE
      addToast: StoreMonitor.measureAction('ui', 'addToast', (toastData) => {
        const state = get()
        
        // ✅ GÉNÉRATION ID SSR-SAFE
        const id = typeof window !== 'undefined' ? ID.toast() : `toast-ssr-${Date.now()}`
        
        const newToast: Toast = {
          ...toastData,
          id,
          timestamp: Date.now(),
          priority: toastData.priority || 'normal'
        }

        set((draft) => {
          // ✅ Gestion file d'attente si trop de toasts
          if (draft.toasts.length >= draft.toastConfig.maxToasts!) {
            if (newToast.priority === 'high') {
              // Remplacer le plus ancien toast normal/low
              const indexToReplace = draft.toasts.findIndex(t => t.priority !== 'high')
              if (indexToReplace !== -1) {
                draft.toasts.splice(indexToReplace, 1)
              } else {
                // Ajouter à la queue
                draft.toastQueue.push(newToast)
                return
              }
            } else {
              draft.toastQueue.push(newToast)
              return
            }
          }

          draft.toasts.push(newToast)
          draft.lastActivity = Date.now()
        })

        // ✅ AUTO-REMOVAL SSR-SAFE
        if (!newToast.persistent && typeof window !== 'undefined') {
          const duration = newToast.duration || state.toastConfig.defaultDuration!
          
          setTimeout(() => {
            const currentState = get()
            if (currentState.toasts.some(t => t.id === id)) {
              currentState.removeToast(id)
            }
          }, duration)
        }
      }),

      removeToast: StoreMonitor.measureAction('ui', 'removeToast', (id: string) => {
        set((draft) => {
          // Supprimer le toast
          const index = draft.toasts.findIndex(t => t.id === id)
          if (index !== -1) {
            draft.toasts.splice(index, 1)
          }

          // ✅ Traiter la queue
          if (draft.toastQueue.length > 0 && draft.toasts.length < draft.toastConfig.maxToasts!) {
            const nextToast = draft.toastQueue.shift()
            if (nextToast) {
              draft.toasts.push(nextToast)
              
              // Auto-removal pour le toast de la queue
              if (!nextToast.persistent && typeof window !== 'undefined') {
                const duration = nextToast.duration || draft.toastConfig.defaultDuration!
                setTimeout(() => {
                  const currentState = get()
                  if (currentState.toasts.some(t => t.id === nextToast.id)) {
                    currentState.removeToast(nextToast.id)
                  }
                }, duration)
              }
            }
          }

          draft.lastActivity = Date.now()
        })
      }),

      clearAllToasts: () => set((state) => {
        state.toasts = []
        state.toastQueue = []
        state.lastActivity = Date.now()
      }),

      updateToastConfig: (config) => set((state) => {
        state.toastConfig = { ...state.toastConfig, ...config }
      }),

      // ✅ RACCOURCIS TOAST AVEC STYLES ENTERPRISE
      showSuccess: (title, message, actions) => {
        get().addToast({
          type: 'success',
          title,
          message,
          actions,
          duration: 4000,
          priority: 'normal'
        })
      },

      showError: (title, message, persistent = false) => {
        get().addToast({
          type: 'error',
          title,
          message,
          duration: persistent ? 0 : 8000,
          priority: 'high',
          persistent
        })
      },

      showWarning: (title, message) => {
        get().addToast({
          type: 'warning',
          title,
          message,
          duration: 6000,
          priority: 'normal'
        })
      },

      showInfo: (title, message) => {
        get().addToast({
          type: 'info',
          title,
          message,
          duration: 5000,
          priority: 'low'
        })
      },

      // ✅ THÈME ET APPARENCE
      setTheme: (theme) => set((state) => {
        state.theme = theme
        state.lastActivity = Date.now()
        
        // ✅ Appliquer le thème immédiatement
        if (typeof window !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
          } else {
            // Auto: suivre préférence système
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          }
        }
      }),

      setAccentColor: (color) => set((state) => {
        state.accentColor = color
        
        // ✅ Appliquer couleur d'accent via CSS custom properties
        if (typeof window !== 'undefined') {
          document.documentElement.style.setProperty('--color-primary', color)
        }
      }),

      // ✅ UTILITAIRES
      updateActivity: () => set((state) => {
        state.lastActivity = Date.now()
      }),

      setLoading: (loading) => set((state) => {
        state.isLoading = loading
      }),
    }),
    'ui',
    ['sidebarCollapsed', 'sidebarPinned', 'dataView', 'compactMode', 'toastConfig', 'theme', 'accentColor'], // ✅ Persister préférences UI
    2 // Version 2 pour migration
  )
)

// ✅ EXPORT DES TYPES POUR UTILISATION EXTERNE
export type { Toast, ToastAction, ToastConfig }
