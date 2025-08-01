'use client'

import { useEffect } from 'react'
import { useConnection } from '@/contexts/connection-context'
import { apiClientEnhanced } from '@/lib/api-client-enhanced'

/**
 * Hook pour synchroniser l'état de connexion avec le client API
 */
export function useApiConnection() {
  const { setConnectionLost, setConnectionRestored } = useConnection()

  useEffect(() => {
    // S'abonner aux changements de connexion du client API
    const unsubscribe = apiClientEnhanced.onConnectionChange((isConnected) => {
      if (isConnected) {
        setConnectionRestored()
      } else {
        setConnectionLost()
      }
    })

    // Nettoyer l'abonnement
    return unsubscribe
  }, [setConnectionLost, setConnectionRestored])
}
