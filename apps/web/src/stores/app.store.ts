import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { shallow } from 'zustand/shallow'

type Theme = 'light' | 'dark' | 'system'
type Language = 'fr' | 'en' | 'es'
type Currency = 'EUR' | 'USD' | 'GBP'
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'

interface NotificationSettings {
  email: boolean
  push: boolean
  sound: boolean
  desktop: boolean
  frequency: 'immediate' | 'daily' | 'weekly'
}

interface UserPreferences {
  dateFormat: DateFormat
  currency: Currency
  language: Language
  timezone: string
  notifications: NotificationSettings
  accessibility: {
    highContrast: boolean
    fontSize: 'small' | 'medium' | 'large'
    reducedMotion: boolean
  }
}

interface UIState {
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  layoutMode: 'comfortable' | 'compact' | 'spacious'
  showBreadcrumbs: boolean
  showTooltips: boolean
  activeModule: string | null
}

interface FilterState {
  projets: Record<string, any>
  stocks: Record<string, any>
  production: Record<string, any>
  facturation: Record<string, any>
  clients: Record<string, any>
  fournisseurs: Record<string, any>
}

interface RecentActivity {
  id: string
  type: 'navigation' | 'action' | 'error'
  module: string
  action: string
  timestamp: number
  metadata?: Record<string, any>
}

interface AppMetrics {
  sessionStart: number
  pageViews: number
  actionCount: number
  errorCount: number
  lastActivity: number
  performance: {
    loadTime?: number
    renderTime?: number
    apiCalls: number
  }
}

interface AppState {
  theme: Theme
  preferences: UserPreferences
  ui: UIState
  filters: FilterState
  
  session: {
    id: string
    isOnline: boolean
    lastSync: number
  }
  metrics: AppMetrics
  recentActivity: RecentActivity[]
  
  errors: Array<{
    id: string
    message: string
    timestamp: number
    severity: 'low' | 'medium' | 'high'
    resolved: boolean
  }>
}

interface AppActions {
  setTheme: (theme: Theme) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPinned: (pinned: boolean) => void
  setLayoutMode: (mode: UIState['layoutMode']) => void
  setActiveModule: (module: string | null) => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  updateAccessibilitySettings: (settings: Partial<UserPreferences['accessibility']>) => void
  setFilters: (module: keyof FilterState, filters: Record<string, any>) => void
  clearFilters: (module: keyof FilterState) => void
  clearAllFilters: () => void
  trackActivity: (activity: Omit<RecentActivity, 'id' | 'timestamp'>) => void
  clearActivity: () => void
  addError: (error: Omit<AppState['errors'][0], 'id' | 'timestamp'>) => void
  resolveError: (errorId: string) => void
  clearErrors: () => void
  updateSession: (updates: Partial<AppState['session']>) => void
  incrementMetric: (metric: keyof AppMetrics | keyof AppMetrics['performance']) => void
  reset: () => void
  exportState: () => string
  importState: (state: string) => boolean
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  theme: 'system',
  preferences: {
    dateFormat: 'DD/MM/YYYY',
    currency: 'EUR',
    language: 'fr',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      email: true,
      push: true,
      sound: true,
      desktop: false,
      frequency: 'immediate'
    },
    accessibility: {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: false
    }
  },
  ui: {
    sidebarCollapsed: false,
    sidebarPinned: true,
    layoutMode: 'comfortable',
    showBreadcrumbs: true,
    showTooltips: true,
    activeModule: null
  },
  filters: {
    projets: {},
    stocks: {},
    production: {},
    facturation: {},
    clients: {},
    fournisseurs: {}
  },
  session: {
    id: '',
    isOnline: true,
    lastSync: Date.now()
  },
  metrics: {
    sessionStart: Date.now(),
    pageViews: 0,
    actionCount: 0,
    errorCount: 0,
    lastActivity: Date.now(),
    performance: {
      apiCalls: 0
    }
  },
  recentActivity: [],
  errors: []
}

const storage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  }

  return {
    getItem: (name: string) => {
      try {
        const item = localStorage.getItem(name)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.warn(`Storage read error for ${name}:`, error)
        return null
      }
    },
    setItem: (name: string, value: any) => {
      try {
        localStorage.setItem(name, JSON.stringify(value))
      } catch (error) {
        console.warn(`Storage write error for ${name}:`, error)
      }
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name)
      } catch (error) {
        console.warn(`Storage remove error for ${name}:`, error)
      }
    }
  }
})

// 🚀 UTILISEZ LES SELECTORS OPTIMISÉS POUR LES PERFORMANCES
// import { useTheme, useUser, useProjectFilters } from './selectors/app.selectors'
// Au lieu de: useAppStore(state => state.theme)
// Utilisez: useTheme()

// 🚀 UTILISEZ LES SELECTORS OPTIMISÉS POUR LES PERFORMANCES
// import { useTheme, useUser, useProjectFilters } from './selectors/app.selectors'
// Au lieu de: useAppStore(state => state.theme)
// Utilisez: useTheme()

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setTheme: (theme) => set((state) => {
          state.theme = theme
          state.metrics.actionCount++
          state.metrics.lastActivity = Date.now()
        }),

        setSidebarCollapsed: (collapsed) => set((state) => {
          state.ui.sidebarCollapsed = collapsed
          state.metrics.actionCount++
        }),

        setSidebarPinned: (pinned) => set((state) => {
          state.ui.sidebarPinned = pinned
        }),

        setLayoutMode: (mode) => set((state) => {
          state.ui.layoutMode = mode
        }),

        setActiveModule: (module) => set((state) => {
          state.ui.activeModule = module
          if (module) {
            state.metrics.pageViews++
          }
        }),

        updatePreferences: (preferences) => set((state) => {
          Object.assign(state.preferences, preferences)
        }),

        updateNotificationSettings: (settings) => set((state) => {
          Object.assign(state.preferences.notifications, settings)
        }),

        updateAccessibilitySettings: (settings) => set((state) => {
          Object.assign(state.preferences.accessibility, settings)
        }),

        setFilters: (module, filters) => set((state) => {
          state.filters[module] = filters
        }),

        clearFilters: (module) => set((state) => {
          state.filters[module] = {}
        }),

        clearAllFilters: () => set((state) => {
          Object.keys(state.filters).forEach(key => {
            state.filters[key as keyof FilterState] = {}
          })
        }),

        trackActivity: (activity) => set((state) => {
          const newActivity: RecentActivity = {
            ...activity,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
          }
          
          state.recentActivity.unshift(newActivity)
          
          if (state.recentActivity.length > 50) {
            state.recentActivity = state.recentActivity.slice(0, 50)
          }
          
          state.metrics.actionCount++
          state.metrics.lastActivity = Date.now()
        }),

        clearActivity: () => set((state) => {
          state.recentActivity = []
        }),

        addError: (error) => set((state) => {
          const newError = {
            ...error,
            id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
          }
          
          state.errors.unshift(newError)
          state.metrics.errorCount++
          
          if (state.errors.length > 20) {
            state.errors = state.errors.slice(0, 20)
          }
        }),

        resolveError: (errorId) => set((state) => {
          const error = state.errors.find(e => e.id === errorId)
          if (error) {
            error.resolved = true
          }
        }),

        clearErrors: () => set((state) => {
          state.errors = []
        }),

        updateSession: (updates) => set((state) => {
          Object.assign(state.session, updates)
        }),

        incrementMetric: (metric) => set((state) => {
          if (metric in state.metrics) {
            (state.metrics as any)[metric]++
          } else if (metric in state.metrics.performance) {
            (state.metrics.performance as any)[metric]++
          }
        }),

        reset: () => set(() => ({ ...initialState })),

        exportState: () => {
          try {
            return JSON.stringify(get(), null, 2)
          } catch (error) {
            console.error('Export failed:', error)
            return '{}'
          }
        },

        importState: (stateString) => {
          try {
            const importedState = JSON.parse(stateString)
            set(() => ({ ...initialState, ...importedState }))
            return true
          } catch (error) {
            console.error('Import failed:', error)
            return false
          }
        }
      })),
      {
        name: 'topsteel-app-state',
        version: 2,
        storage,
        
        partialize: (state) => ({
          theme: state.theme,
          preferences: state.preferences,
          ui: {
            sidebarCollapsed: state.ui.sidebarCollapsed,
            sidebarPinned: state.ui.sidebarPinned,
            layoutMode: state.ui.layoutMode,
            showBreadcrumbs: state.ui.showBreadcrumbs,
            showTooltips: state.ui.showTooltips
          },
          filters: state.filters
        }),
        
        migrate: (persistedState: any, version: number) => {
          if (version < 2) {
            return {
              ...initialState,
              ...persistedState,
              session: {
                ...initialState.session,
                id: `migrated-${Date.now()}`
              }
            }
          }
          return persistedState
        },

        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('Store rehydration failed:', error)
          } else if (state) {
            state.session.id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            state.session.lastSync = Date.now()
            state.metrics.sessionStart = Date.now()
          }
        }
      }
    ),
    {
      name: 'TopSteel App Store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

export const useTheme = () => useAppStore(state => state.theme)
export const useUIState = () => useAppStore(state => state.ui)
export const usePreferences = () => useAppStore(state => state.preferences)
export const useFilters = () => useAppStore(state => state.filters)
export const useMetrics = () => useAppStore(state => state.metrics)
export const useErrors = () => useAppStore(state => state.errors)
export const useSession = () => useAppStore(state => state.session)

export const useSidebarState = () => useAppStore(
  state => ({
    collapsed: state.ui.sidebarCollapsed,
    pinned: state.ui.sidebarPinned,
    toggle: state.setSidebarCollapsed,
    pin: state.setSidebarPinned
  })
)

export const useModuleFilters = (module: keyof FilterState) => useAppStore(
  state => ({
    filters: state.filters[module],
    setFilters: (filters: Record<string, any>) => state.setFilters(module, filters),
    clearFilters: () => state.clearFilters(module)
  })
)
