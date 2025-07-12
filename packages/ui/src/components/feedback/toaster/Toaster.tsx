import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'
import { useToast } from './ToastProvider'

export interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

const Toaster = React.forwardRef<HTMLDivElement, ToasterProps>(
  ({ position = 'top-right', className, ...props }, ref) => {
    const { toasts, removeToast } = useToast()

    const positionClasses = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
    }

    const getTypeStyles = (type?: string) => {
      switch (type) {
        case 'success':
          return 'border-green-200 bg-green-50 text-green-800'
        case 'error':
          return 'border-red-200 bg-red-50 text-red-800'
        case 'warning':
          return 'border-yellow-200 bg-yellow-50 text-yellow-800'
        default:
          return 'border-gray-200 bg-white text-gray-900'
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col space-y-2 w-96',
          positionClasses[position],
          className
        )}
        {...props}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
              'animate-in slide-in-from-top-2',
              getTypeStyles(toast.type)
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {toast.title && <div className="font-medium">{toast.title}</div>}
                {toast.description && (
                  <div className="text-sm opacity-90 mt-1">{toast.description}</div>
                )}
              </div>
              <Button
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-sm opacity-70 hover:opacity-100"
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }
)

Toaster.displayName = 'Toaster'

export { Toaster }
