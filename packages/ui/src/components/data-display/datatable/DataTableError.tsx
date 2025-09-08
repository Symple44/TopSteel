'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Button } from '../../primitives/button'

interface DataTableErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

export function DataTableError({ error, onRetry, className }: DataTableErrorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        'border rounded-lg bg-red-50 border-red-200',
        className
      )}
    >
      <div className="mb-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
      </div>

      <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur lors du chargement</h3>

      <p className="text-sm text-red-700 mb-6 max-w-md">{error}</p>

      {onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      )}
    </div>
  )
}

export default DataTableError
