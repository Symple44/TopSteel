// apps/web/src/hooks/use-ui.ts - Types corrigés
import { useCallback, useState } from 'react'

// Interface pour les toasts
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export const useUI = () => {
  const [dataView, setDataView] = useState<'grid' | 'table'>('table')

  return {
    dataView,
    setDataView,
  }
}

export const useToasts = () => {
  // Typage explicite du state toasts
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto remove after delay
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, toast.duration || 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showSuccess = useCallback(
    (title: string, message = '', duration?: number) => {
      addToast({ type: 'success', title, message, duration })
    },
    [addToast]
  )

  const showError = useCallback(
    (title: string, message = '', duration?: number) => {
      addToast({ type: 'error', title, message, duration })
    },
    [addToast]
  )

  const showWarning = useCallback(
    (title: string, message = '', duration?: number) => {
      addToast({ type: 'warning', title, message, duration })
    },
    [addToast]
  )

  const showInfo = useCallback(
    (title: string, message = '', duration?: number) => {
      addToast({ type: 'info', title, message, duration })
    },
    [addToast]
  )

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllToasts,
  }
}

export const useSidebar = () => {
  const [collapsed, setCollapsed] = useState(false)

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  const expand = useCallback(() => {
    setCollapsed(false)
  }, [])

  const collapse = useCallback(() => {
    setCollapsed(true)
  }, [])

  return {
    collapsed,
    toggle,
    expand,
    collapse,
    setCollapsed,
  }
}

/**
 * Hook pour gérer l'état de chargement global
 */
export const useLoading = () => {
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')

  const startLoading = useCallback((message = 'Chargement...') => {
    setLoading(true)
    setLoadingMessage(message)
  }, [])

  const stopLoading = useCallback(() => {
    setLoading(false)
    setLoadingMessage('')
  }, [])

  return {
    loading,
    loadingMessage,
    startLoading,
    stopLoading,
  }
}

/**
 * Hook pour gérer les modales
 */
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [modalData, setModalData] = useState<any>(null)

  const openModal = useCallback((data?: unknown) => {
    setModalData(data)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setModalData(null)
  }, [])

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return {
    isOpen,
    modalData,
    openModal,
    closeModal,
    toggleModal,
  }
}

/**
 * Export de types pour utilisation externe
 */
export type { Toast }
