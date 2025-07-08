// apps/web/src/components/ui/error-alert.tsx

import type { FormattedError } from '@/lib/error-handler'
import { AlertCircle, X } from 'lucide-react'

interface ErrorAlertProps {
  error: FormattedError | null
  onDismiss?: () => void
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800">{error.title}</h3>
          <p className="mt-1 text-sm text-red-700">{error.message}</p>
          {error.field && (
            <p className="mt-1 text-xs text-red-600">Champ concerné : {error.field}</p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
            onClick={onDismiss}
            aria-label="Fermer le message d'erreur"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}




