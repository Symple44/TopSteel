'use client'

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

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = `toast-${++toastCounter}`
      const newToast: Toast = {
        id,
        duration: 5000,
        variant: 'default',
        ...props,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss avec globalThis pour compatibilité universelle
      if (newToast.duration && newToast.duration > 0) {
        const timeoutId = globalThis.setTimeout(() => {
          dismiss(id)
        }, newToast.duration)

        // Retourner une fonction de nettoyage
        return () => {
          if (typeof globalThis.clearTimeout !== 'undefined') {
            globalThis.clearTimeout(timeoutId)
          }
        }
      }
    },
    [dismiss]
  )

  return {
    toasts,
    toast,
    dismiss,
  }
}

// Hook pour les toasts simples avec types stricts
export function useSimpleToast() {
  const { toast } = useToast()

  return {
    success: (message: string) => toast({ description: message, variant: 'success' }),
    error: (message: string) => toast({ description: message, variant: 'destructive' }),
    warning: (message: string) => toast({ description: message, variant: 'warning' }),
    info: (message: string) => toast({ description: message, variant: 'default' }),
  }
}
