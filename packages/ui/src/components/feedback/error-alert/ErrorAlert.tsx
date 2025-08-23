'use client'

import { AlertTriangle, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'

export interface ErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string | Error | { message: string }
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
}

const ErrorAlert = React.forwardRef<HTMLDivElement, ErrorAlertProps>(
  ({ error, title = 'Erreur', dismissible, onDismiss, className, ...props }, ref) => {
    const errorMessage = React.useMemo(() => {
      if (!error) return 'Une erreur est survenue'
      if (typeof error === 'string') return error
      if (error instanceof Error) return error.message
      if (typeof error === 'object' && 'message' in error) return error.message
      return 'Une erreur est survenue'
    }, [error])

    if (!error) return null

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full rounded-lg border border-destructive/50 bg-destructive/10 p-4',
          className
        )}
        {...props}
      >
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />

          <div className="flex-1 space-y-1">
            <h4 className="font-medium text-destructive">{title}</h4>
            <p className="text-sm text-destructive/90">{errorMessage}</p>
          </div>

          {dismissible && onDismiss && (
            <Button
              onClick={onDismiss}
              className="flex-shrink-0 rounded-md p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)

ErrorAlert.displayName = 'ErrorAlert'

export { ErrorAlert }
