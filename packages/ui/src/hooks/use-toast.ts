import { useCallback, useState } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

export interface ToastContextType {
  toasts: Toast[]
  toast: (props: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

let toastCounter = 0

export function useToast(): ToastContextType {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCounter}`
    const newToast: Toast = {
      id,
      duration: 5000,
      variant: 'default',
      ...props,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss après duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}

// Hook pour les toasts simples
export function useSimpleToast() {
  const { toast } = useToast()

  return {
    success: (message: string) => toast({ description: message, variant: 'success' }),
    error: (message: string) => toast({ description: message, variant: 'destructive' }),
    warning: (message: string) => toast({ description: message, variant: 'warning' }),
    info: (message: string) => toast({ description: message, variant: 'default' }),
  }
}

// Export pour compatibilité
export { useToast as toast }
