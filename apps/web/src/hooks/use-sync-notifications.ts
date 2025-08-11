'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { syncChecker } from '@/lib/sync-checker'

export function useSyncNotifications() {
  const { toast } = useToast()

  useEffect(() => {
    // Configurer le callback pour les notifications de sync
    syncChecker.setToastCallback((issue) => {
      // Ignorer les notifications de faible priorité
      if (issue.severity === 'low') {
        return
      }

      const severityToType = {
        medium: 'default' as const,
        high: 'destructive' as const,
      }

      toast({
        title: 'Erreur de synchronisation',
        description: issue.message,
        variant: severityToType[issue.severity],
        duration: issue.severity === 'high' ? 8000 : 5000, // Plus long pour les erreurs critiques
      })
    })

    // Cleanup function pour éviter les fuites mémoire
    return () => {
      syncChecker.setToastCallback(undefined as unknown)
    }
  }, [toast])
}
