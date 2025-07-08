'use client'

import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui.store'
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

// Types basés sur le store UI
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: number
}

type ToastType = Toast['type']

const toastIcons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

// Guard pour vérifier si le type est valide
const isValidToastType = (type: any): type is ToastType => {
  return ['success', 'error', 'warning', 'info'].includes(type)
}

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        // Vérification type-safe avec fallback
        const toastType: ToastType = isValidToastType(toast.type) ? toast.type : 'info'
        const Icon = toastIcons[toastType]

        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-top-2',
              toastStyles[toastType],
              'max-w-md'
            )}
          >
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />

            <div className="flex-1">
              <div className="font-medium">{toast.title}</div>
              {toast.message && <div className="text-sm opacity-90 mt-1">{toast.message}</div>}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Fermer le toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
