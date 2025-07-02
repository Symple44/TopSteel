// apps/web/src/hooks/use-ui.ts - SANS ZUSTAND
import { useState, useCallback } from 'react'

export const useUI = () => {
  const [dataView, setDataView] = useState<'grid' | 'table'>('table')

  return {
    dataView,
    setDataView
  }
}

export const useToasts = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast: any) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { ...toast, id }])
    
    // Auto remove after delay
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showSuccess = useCallback((title: string, message: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const showError = useCallback((title: string, message: string) => {
    addToast({ type: 'error', title, message })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError
  }
}

export const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  return {
    collapsed,
    toggle,
    setCollapsed
  }
}
