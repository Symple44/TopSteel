// apps/web/src/hooks/use-ui.ts
import { useUIStore } from '@/stores/ui.store'
import { shallow } from 'zustand/shallow'

export const useUI = () => {
  return useUIStore(
    (state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      dataView: state.dataView,
      toggleSidebar: state.toggleSidebar,
      setSidebarCollapsed: state.setSidebarCollapsed,
      setDataView: state.setDataView,
    }),
    shallow
  )
}

export const useToasts = () => {
  return useUIStore(
    (state) => ({
      toasts: state.toasts,
      addToast: state.addToast,
      removeToast: state.removeToast,
      showSuccess: state.showSuccess,
      showError: state.showError,
    }),
    shallow
  )
}

export const useSidebar = () => {
  return useUIStore(
    (state) => ({
      collapsed: state.sidebarCollapsed,
      toggle: state.toggleSidebar,
      setCollapsed: state.setSidebarCollapsed,
    }),
    shallow
  )
}