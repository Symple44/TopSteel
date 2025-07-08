import { useCallback, useState } from 'react'

/**
 * Interface pour un toast avec toutes les options possibles
 */
export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
  action?: React.ReactNode // ✅ Ajout de la propriété action manquante
  onDismiss?: () => void
}

/**
 * Type pour les options lors de la création d'un toast
 */
export type ToastOptions = Omit<Toast, 'id'>

/**
 * Interface du contexte de toast
 */
interface ToastContextType {
  toasts: Toast[]
  toast: (options: ToastOptions) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

/**
 * Compteur global pour les IDs uniques
 */

let toastCounter = 0

/**
 * Hook principal pour la gestion des toasts
 *
 * @returns Contexte des toasts avec toutes les actions
 */
export function useToast(): ToastContextType {
  const [toasts, setToasts] = useState<Toast[]>([])

  /**
   * Ferme un toast spécifique
   */
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  /**
   * Ferme tous les toasts
   */
  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  /**
   * Crée un nouveau toast
   */
  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${++toastCounter}-${Date.now()}`
      const newToast: Toast = {
        id,
        duration: 5000, // 5 secondes par défaut
        variant: 'default',
        ...options,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-dismiss après la durée spécifiée
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, newToast.duration)
      }

      // Appeler le callback onDismiss si fourni
      if (newToast.onDismiss) {
        setTimeout(() => {
          newToast.onDismiss?.()
        }, newToast.duration || 5000)
      }
    },
    [dismiss]
  )

  return {
    toasts,
    toast,
    dismiss,
    dismissAll,
  }
}

/**
 * Hook avec raccourcis pour différents types de toasts
 */
export function useToastShortcuts() {
  const { toast, dismiss, dismissAll } = useToast()

  return {
    /**
     * Toast de succès avec style vert
     */
    success: useCallback(
      (title: string, description?: string, duration = 4000) => {
        toast({
          title,
          description,
          variant: 'success',
          duration,
        })
      },
      [toast]
    ),

    /**
     * Toast d'erreur avec style rouge
     */
    error: useCallback(
      (title: string, description?: string, duration = 6000) => {
        toast({
          title,
          description,
          variant: 'destructive',
          duration,
        })
      },
      [toast]
    ),

    /**
     * Toast d'avertissement avec style orange
     */
    warning: useCallback(
      (title: string, description?: string, duration = 5000) => {
        toast({
          title,
          description,
          variant: 'warning',
          duration,
        })
      },
      [toast]
    ),

    /**
     * Toast d'information avec style bleu
     */
    info: useCallback(
      (title: string, description?: string, duration = 4000) => {
        toast({
          title,
          description,
          variant: 'default',
          duration,
        })
      },
      [toast]
    ),

    /**
     * Toast persistant (ne se ferme pas automatiquement)
     */
    persistent: useCallback(
      (title: string, description?: string, variant: Toast['variant'] = 'default') => {
        toast({
          title,
          description,
          variant,
          duration: 0, // Pas de fermeture automatique
        })
      },
      [toast]
    ),

    /**
     * Toast avec action personnalisée
     */
    withAction: useCallback(
      (
        title: string,
        description: string,
        action: React.ReactNode,
        variant: Toast['variant'] = 'default',
        duration = 8000
      ) => {
        toast({
          title,
          description,
          action,
          variant,
          duration,
        })
      },
      [toast]
    ),

    /**
     * Méthodes de gestion
     */
    dismiss,
    dismissAll,

    /**
     * Accès au toast principal pour les cas avancés
     */
    custom: toast,
  }
}

/**
 * Hook pour surveiller les toasts (utile pour les analytics)
 */
export function useToastMetrics() {
  const { toasts } = useToast()

  const metrics = {
    total: toasts.length,
    byVariant: toasts.reduce(
      (acc, toast) => {
        const variant = toast.variant || 'default'

        acc[variant] = (acc[variant] || 0) + 1

        return acc
      },
      {} as Record<string, number>
    ),
    persistent: toasts.filter((t) => t.duration === 0).length,
  }

  return metrics
}

/**
 * Hook pour gérer les toasts avec promesses (utile pour les appels API)
 */
export function useToastWithPromise() {
  const { toast } = useToast()

  const promiseToast = useCallback(
    async <T>(
      promise: Promise<T>,
      messages: {
        loading?: string
        success?: string | ((data: T) => string)
        error?: string | ((error: Error) => string)
      }
    ): Promise<T> => {
      let toastId: string | undefined

      // Toast de chargement
      if (messages.loading) {
        toastId = `promise-${Date.now()}`
        toast({
          title: messages.loading,
          variant: 'default',
          duration: 0, // Persistant pendant le chargement
        })
      }

      try {
        const result = await promise

        // Succès
        if (messages.success) {
          const successMessage =
            typeof messages.success === 'function' ? messages.success(result) : messages.success

          toast({
            title: successMessage,
            variant: 'success',
            duration: 4000,
          })
        }

        return result
      } catch (error) {
        // Erreur
        if (messages.error) {
          const errorMessage =
            typeof messages.error === 'function' ? messages.error(error as Error) : messages.error

          toast({
            title: errorMessage,
            variant: 'destructive',
            duration: 6000,
          })
        }

        throw error
      }
    },
    [toast]
  )

  return { promiseToast }
}




