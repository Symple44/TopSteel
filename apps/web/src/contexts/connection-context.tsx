'use client'

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { ConnectionLostDialogWrapper as ConnectionLostDialog } from '@/components/wrappers'
import { apiClientEnhanced } from '@/lib/api-client-enhanced'

interface ConnectionContextType {
  isConnected: boolean
  isChecking: boolean
  checkConnection: () => Promise<boolean>
  setConnectionLost: () => void
  setConnectionRestored: () => void
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider')
  }
  return context
}

interface ConnectionProviderProps {
  children: ReactNode
  checkInterval?: number // Intervalle de vérification en ms (défaut: 30s)
}

export function ConnectionProvider({ children, checkInterval = 60000 }: ConnectionProviderProps) {
  const [isConnected, setIsConnected] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [showConnectionLostDialog, setShowConnectionLostDialog] = useState(false)

  // Fonction pour vérifier la connexion
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true)
    try {
      // Endpoint léger pour vérifier la connexion
      const healthData = await apiClientEnhanced?.get('/health', {
        timeout: 8000, // Timeout de 8 secondes (plus long)
        retry: false, // Pas de retry pour le health check
        cache: false, // Pas de cache pour le health check
      })

      // Si on reçoit des données, c'est que la connexion fonctionne
      // Peu importe le statut de la base de données dans le health check
      const connected = !!healthData
      setIsConnected(connected)

      if (connected && showConnectionLostDialog) {
        setShowConnectionLostDialog(false)
      }

      return connected
    } catch (_error) {
      // Erreur réseau = pas de connexion
      setIsConnected(false)
      setShowConnectionLostDialog(true)
      return false
    } finally {
      setIsChecking(false)
    }
  }, [showConnectionLostDialog])

  // Fonctions pour gérer manuellement l'état de connexion
  const setConnectionLost = useCallback(() => {
    setIsConnected(false)
    setShowConnectionLostDialog(true)
  }, [])

  const setConnectionRestored = useCallback(() => {
    setIsConnected(true)
    setShowConnectionLostDialog(false)
  }, [])

  // Vérification périodique de la connexion
  useEffect(() => {
    // Vérifier immédiatement au montage
    checkConnection()

    // Configurer la vérification périodique
    const intervalId = setInterval(() => {
      if (!showConnectionLostDialog) {
        // Ne pas vérifier si le dialog est déjà affiché
        checkConnection()
      }
    }, checkInterval)

    // Écouter les événements de connexion/déconnexion réseau
    const handleOnline = () => {
      checkConnection()
    }

    const handleOffline = () => {
      setConnectionLost()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkInterval, checkConnection, showConnectionLostDialog, setConnectionLost])

  // Gestionnaire de retry pour le dialog
  const handleRetry = async () => {
    const connected = await checkConnection()
    if (connected) {
      // Si la connexion est rétablie, recharger pour s'assurer que tout est à jour
      window.location.reload()
    }
  }

  return (
    <ConnectionContext.Provider
      value={{
        isConnected,
        isChecking,
        checkConnection,
        setConnectionLost,
        setConnectionRestored,
      }}
    >
      {children}
      <ConnectionLostDialog isOpen={showConnectionLostDialog} onRetry={handleRetry} />
    </ConnectionContext.Provider>
  )
}
