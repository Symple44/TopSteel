'use client'

import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

/**
 * Composant Toaster - Affiche les toasts/notifications temporaires
 * Compatible avec le système de toast existant du projet
 */
export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Types d'icônes pour chaque variant
  const toastIcons = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle,
    warning: AlertTriangle,
  } as const

  // Styles pour chaque variant
  const toastStyles = {
    default: 'bg-background border-border text-foreground',
    destructive: 'bg-destructive border-destructive text-destructive-foreground',
    success: 'bg-success/10 border-success text-success-foreground',
    warning: 'bg-warning/10 border-warning text-warning-foreground',
  } as const

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const variant = toast.variant || 'default'
        const Icon = toastIcons[variant] || Info
        
        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismiss}
            Icon={Icon}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg',
              'animate-in slide-in-from-top-2 duration-300',
              'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full',
              toastStyles[variant]
            )}
          />
        )
      })}
    </div>
  )
}

/**
 * Composant individuel de toast
 */
interface ToastItemProps {
  toast: {
    id: string
    title?: string
    description?: string
    variant?: 'default' | 'destructive' | 'success' | 'warning'
    duration?: number
  }
  onDismiss: (id: string) => void
  Icon: React.ComponentType<{ className?: string }>
  className?: string
}

function ToastItem({ toast, onDismiss, Icon, className }: ToastItemProps) {
  // Auto-dismiss après la durée spécifiée
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }

    // Retourner une fonction vide si pas de timer
    return () => {}
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div className={className}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-sm leading-tight">
            {toast.title}
          </div>
        )}
        {toast.description && (
          <div className="text-sm opacity-90 mt-1 leading-tight">
            {toast.description}
          </div>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fermer la notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Hook personnalisé pour créer des toasts avec des raccourcis
 */
export function useToastNotifications() {
  const { toast } = useToast()

  return {
    /**
     * Toast de succès
     */
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'success',
        duration: 4000,
      })
    },

    /**
     * Toast d'erreur
     */
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'destructive',
        duration: 6000,
      })
    },

    /**
     * Toast d'avertissement
     */
    warning: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'warning',
        duration: 5000,
      })
    },

    /**
     * Toast d'information
     */
    info: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'default',
        duration: 4000,
      })
    },

    /**
     * Toast avec action personnalisée
     */
    withAction: (
      title: string, 
      description: string, 
      actionLabel: string, 
      actionFn: () => void
    ) => {
      toast({
        title,
        description,
        // Note: L'action sera ajoutée dans une future version
        duration: 8000,
      })
      
      // Pour l'instant, on peut ajouter un bouton dans la description
      console.log(`Action disponible: ${actionLabel}`, actionFn)
    },

    /**
     * Toast de chargement avec promesse
     */
    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading?: string
        success?: string | ((data: T) => string)
        error?: string | ((error: any) => string)
      }
    ) => {
      // Toast de chargement
      const loadingId = `loading-${Date.now()}`
      toast({
        title: options.loading || 'Chargement...',
        variant: 'default',
        duration: 0, // Pas de dismiss automatique
      })

      try {
        const data = await promise
        
        // Toast de succès
        toast({
          title: typeof options.success === 'function' 
            ? options.success(data) 
            : options.success || 'Terminé avec succès',
          variant: 'success',
          duration: 4000,
        })

        return data
      } catch (error) {
        // Toast d'erreur
        toast({
          title: typeof options.error === 'function' 
            ? options.error(error) 
            : options.error || 'Une erreur est survenue',
          variant: 'destructive',
          duration: 6000,
        })

        throw error
      }
    },

    /**
     * Toast personnalisé avec toutes les options
     */
    custom: toast,
  }
}

/**
 * Provider simple pour les toasts (si pas déjà dans le contexte)
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}