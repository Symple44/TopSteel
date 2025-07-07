// apps/web/src/stores/ui.store.ts - SANS PERSIST (FIX HYDRATATION)
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
}

interface UIState {
  sidebarCollapsed: boolean
  dataView: 'grid' | 'table'
  toasts: Toast[]
  
  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDataView: (view: 'grid' | 'table') => void
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void
  removeToast: (id: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
}

export const _useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      sidebarCollapsed: false,
      dataView: 'grid',
      toasts: [],

      toggleSidebar: () => {
        set(state => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        }))
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      setDataView: (view) => {
        set({ dataView: view })
      },

      addToast: (toast) => {
        const newToast: Toast = {
          ...toast,
          id: Date.now().toString(),
          timestamp: Date.now()
        }
        
        set(state => ({
          toasts: [...state.toasts, newToast]
        }))
        
        // Auto-remove après 5 secondes
        setTimeout(() => {
          get().removeToast(newToast.id)
        }, 5000)
      },

      removeToast: (id) => {
        set(state => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
      },

      showSuccess: (title, message) => {
        get().addToast({
          type: 'success',
          title,
          message: message || ''
        })
      },

      showError: (title, message) => {
        get().addToast({
          type: 'error',
          title,
          message: message || ''
        })
      },
    }),
    { name: 'ui-store' }
  )
)

