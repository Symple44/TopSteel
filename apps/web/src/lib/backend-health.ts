export interface BackendHealthStatus {
  isAvailable: boolean
  status: 'healthy' | 'unhealthy' | 'unknown' | 'checking'
  message: string
  lastCheck: Date
  responseTime?: number
}

export class BackendHealthService {
  private static instance: BackendHealthService
  private healthStatus: BackendHealthStatus = {
    isAvailable: false,
    status: 'unknown',
    message: 'Non vérifié',
    lastCheck: new Date()
  }
  
  private listeners: ((status: BackendHealthStatus) => void)[] = []
  private checkInterval?: NodeJS.Timeout

  static getInstance(): BackendHealthService {
    if (!BackendHealthService.instance) {
      BackendHealthService.instance = new BackendHealthService()
    }
    return BackendHealthService.instance
  }

  /**
   * Vérifie la santé du backend
   */
  async checkHealth(): Promise<BackendHealthStatus> {
    const startTime = Date.now()
    
    this.updateStatus({
      ...this.healthStatus,
      status: 'checking',
      message: 'Vérification en cours...'
    })

    try {
      // Essayer plusieurs endpoints pour vérifier la santé du backend réel
      const endpoints = [
        '/api/v1/auth/login', // Test avec GET -> 404 (serveur up)
        '/api/v1/users', // Test endpoint users -> 401 (serveur up) 
        '/api/docs' // Swagger docs -> devrait répondre
      ]

      let lastError: Error | null = null
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // Timeout de 5 secondes
          })

          const responseTime = Date.now() - startTime

          if (response.status < 500) {
            // Même si c'est une erreur 4xx, le serveur répond (400, 401, 404 = serveur up)
            const statusDetails = response.status === 401 ? 'Auth requis' :
                                response.status === 400 ? 'Bad request' :
                                response.status === 404 ? 'Not found' : 'OK'
            
            this.updateStatus({
              isAvailable: true,
              status: 'healthy',
              message: `Backend disponible (${response.status} - ${statusDetails})`,
              lastCheck: new Date(),
              responseTime
            })
            return this.healthStatus
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Erreur inconnue')
          continue
        }
      }

      // Si tous les endpoints échouent
      this.updateStatus({
        isAvailable: false,
        status: 'unhealthy',
        message: lastError?.message || 'Backend indisponible',
        lastCheck: new Date()
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion'
      
      this.updateStatus({
        isAvailable: false,
        status: 'unhealthy',
        message: errorMessage,
        lastCheck: new Date()
      })
    }

    return this.healthStatus
  }

  /**
   * Démarre la vérification périodique
   */
  startPeriodicCheck(intervalMs: number = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Vérification immédiate
    this.checkHealth()

    // Vérification périodique
    this.checkInterval = setInterval(() => {
      this.checkHealth()
    }, intervalMs)
  }

  /**
   * Arrête la vérification périodique
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }
  }

  /**
   * Obtient le statut actuel
   */
  getStatus(): BackendHealthStatus {
    return { ...this.healthStatus }
  }

  /**
   * S'abonne aux changements de statut
   */
  subscribe(listener: (status: BackendHealthStatus) => void) {
    this.listeners.push(listener)
    
    // Envoyer le statut actuel immédiatement
    listener(this.getStatus())

    // Retourner une fonction de désabonnement
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Met à jour le statut et notifie les listeners
   */
  private updateStatus(newStatus: BackendHealthStatus) {
    this.healthStatus = newStatus
    this.listeners.forEach(listener => {
      try {
        listener(newStatus)
      } catch (error) {
        console.error('Erreur dans le listener de santé backend:', error)
      }
    })
  }
}

// Hook React pour utiliser le service de santé
export function useBackendHealth() {
  const [status, setStatus] = React.useState<BackendHealthStatus>({
    isAvailable: false,
    status: 'unknown',
    message: 'Non vérifié',
    lastCheck: new Date()
  })

  React.useEffect(() => {
    const service = BackendHealthService.getInstance()
    
    // S'abonner aux changements
    const unsubscribe = service.subscribe(setStatus)
    
    // Démarrer la vérification périodique
    service.startPeriodicCheck()

    return () => {
      unsubscribe()
      service.stopPeriodicCheck()
    }
  }, [])

  const checkNow = React.useCallback(() => {
    return BackendHealthService.getInstance().checkHealth()
  }, [])

  return {
    status,
    checkNow
  }
}

// Import React pour le hook
import React from 'react'