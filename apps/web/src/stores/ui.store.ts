// apps/web/src/stores/ui.store.ts
import { create } from 'zustand'
import { createStoreWithPersist, generateId } from '@/lib/store-utils'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface UIState {
  sidebarCollapsed: boolean
  dataView: 'grid' | 'table'
  toasts: Toast[]
  
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDataView: (view: 'grid' | 'table') => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
}

export const useUIStore = create<UIState>()(
  createStoreWithPersist(
    (set, get) => ({
      sidebarCollapsed: false,
      dataView: 'grid',
      toasts: [],

      toggleSidebar: () => set((state) => {
        state.sidebarCollapsed = !state.sidebarCollapsed
      }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setDataView: (view) => set({ dataView: view }),

      addToast: (toast) => {
        const id = generateId()
        const newToast = { ...toast, id }
        
        set((state) => {
          state.toasts.push(newToast)
        })

        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id)
          }, toast.duration || 5000)
        }
      },

      removeToast: (id) => set((state) => {
        state.toasts = state.toasts.filter(toast => toast.id !== id)
      }),

      showSuccess: (title, message) => {
        get().addToast({ type: 'success', title, message, duration: 4000 })
      },

      showError: (title, message) => {
        get().addToast({ type: 'error', title, message, duration: 6000 })
      },
    }),
    'ui',
    ['sidebarCollapsed', 'dataView']
  )
)