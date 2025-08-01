'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { syncChecker } from '@/lib/sync-checker'

export function useSyncNotifications() {
  const { toast } = useToast()

  useEffect(() => {
    // Configurer le callback pour les notifications de sync
    syncChecker.setToastCallback((issue) => {
      const severityToType = {
        low: 'default' as const,
        medium: 'warning' as const,
        high: 'destructive' as const,
      }

      toast({
        title: 'Problème de synchronisation',
        description: issue.message,
        variant: severityToType[issue.severity],
        duration: issue.severity === 'high' ? 8000 : 5000, // Plus long pour les erreurs critiques
      })
    })

    // Cleanup function pour éviter les fuites mémoire
    return () => {
      syncChecker.setToastCallback(undefined as any)
    }
  }, [toast])
}
