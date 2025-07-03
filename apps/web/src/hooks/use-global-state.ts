import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTheme, useUser, useProjectFilters, useUISettings } from '@/stores/selectors/app.selectors'

interface AppState {
  sidebarCollapsed: boolean
  preferences: {
    dateFormat: string
    currency: string
    language: string
    notifications: {
      email: boolean
      push: boolean
      sound: boolean
    }
  }
  filters: {
    projets: Record<string, any>
    stocks: Record<string, any>
    production: Record<string, any>
    facturation: Record<string, any>
  }
  setSidebarCollapsed: (collapsed: boolean) => void
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void
  setFilters: (module: keyof AppState['filters'], filters: Record<string, any>) => void
  clearFilters: (module: keyof AppState['filters']) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      preferences: {
        dateFormat: 'DD/MM/YYYY',
        currency: 'EUR',
        language: 'fr',
        notifications: {
          email: true,
          push: true,
          sound: true
        }
      },
      filters: {
        projets: {},
        stocks: {},
        production: {},
        facturation: {}
      },
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      updatePreferences: (newPreferences) => set((state) => ({
        preferences: { ...state.preferences, ...newPreferences }
      })),
      setFilters: (module, filters) => set((state) => ({
        filters: { ...state.filters, [module]: filters }
      })),
      clearFilters: (module) => set((state) => ({
        filters: { ...state.filters, [module]: {} }
      }))
    }),
    {
      name: 'erp-app-state',
      partialize: (state) => ({
        preferences: state.preferences,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
)

export const useUserPreferences = () => {
  const preferences = useAppStore(state => state.preferences)
  const updatePreferences = useAppStore(state => state.updatePreferences)
  return { preferences, updatePreferences }
}

export const useUIState = () => {
  const sidebarCollapsed = useAppStore(state => state.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore(state => state.setSidebarCollapsed)
  return { sidebarCollapsed, setSidebarCollapsed }
}

export const useFilters = (module: keyof AppState['filters']) => {
  const filters = useAppStore(state => state.filters[module])
  const setFilters = useAppStore(state => state.setFilters)
  const clearFilters = useAppStore(state => state.clearFilters)
  return {
    filters,
    setFilters: (newFilters: Record<string, any>) => setFilters(module, newFilters),
    clearFilters: () => clearFilters(module)
  }
}
