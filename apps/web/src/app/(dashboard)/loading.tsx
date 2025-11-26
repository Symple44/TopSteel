'use client'

import { LoadingSpinner } from '@erp/ui'

/**
 * Loading state pour le dashboard
 * Affiche un spinner centre pendant le chargement
 */
export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" showLabel label="Chargement du tableau de bord..." />
    </div>
  )
}
