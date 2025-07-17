'use client'

import { useEffect } from 'react'
import { useToast } from '@erp/ui'
import { syncChecker } from '@/lib/sync-checker'

export function useSyncNotifications() {
  const { addToast } = useToast()

  useEffect(() => {
    // Configurer le callback pour les notifications de sync
    syncChecker.setToastCallback((issue) => {
      const severityToType = {
        low: 'default' as const,
        medium: 'warning' as const,
        high: 'error' as const,
      }

      addToast({
        title: 'Problème de synchronisation',
        description: issue.message,
        type: severityToType[issue.severity],
        duration: issue.severity === 'high' ? 8000 : 5000, // Plus long pour les erreurs critiques
      })
    })

    // Cleanup function pour éviter les fuites mémoire
    return () => {
      syncChecker.setToastCallback(null)
    }
  }, [addToast])
}