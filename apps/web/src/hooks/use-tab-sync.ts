/**
 * Hook pour la synchronisation entre onglets
 * Utilise BroadcastChannel et les événements localStorage
 */
import { useEffect } from 'react'

export interface TabSyncEvent {
  type: 'COMPANY_CHANGED' | 'USER_LOGIN' | 'USER_LOGOUT' | 'TOKEN_REFRESH'
  data?: any
  timestamp?: number
}

export interface TabSyncOptions {
  channelName?: string
  onMessage?: (event: TabSyncEvent) => void
}

/**
 * Hook pour écouter les événements de synchronisation entre onglets
 */
export function useTabSync(options: TabSyncOptions = {}) {
  const { channelName = 'topsteel-auth', onMessage } = options

  useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = new BroadcastChannel(channelName)
    
    const handleBroadcastMessage = (event: MessageEvent<TabSyncEvent>) => {
      if (onMessage) {
        onMessage(event.data)
      }
    }

    channel.addEventListener('message', handleBroadcastMessage)
    
    return () => {
      channel.removeEventListener('message', handleBroadcastMessage)
      channel.close()
    }
  }, [channelName, onMessage])

  /**
   * Fonction pour envoyer un message aux autres onglets
   */
  const broadcast = (event: TabSyncEvent) => {
    if (typeof window === 'undefined') return

    const channel = new BroadcastChannel(channelName)
    channel.postMessage({
      ...event,
      timestamp: Date.now()
    })
    channel.close()
  }

  return { broadcast }
}

/**
 * Hook spécialisé pour la synchronisation d'authentification
 */
export function useAuthTabSync(onAuthEvent: (event: TabSyncEvent) => void) {
  const { broadcast } = useTabSync({
    channelName: 'topsteel-auth',
    onMessage: onAuthEvent
  })

  const notifyCompanyChange = (data: { company: any; user: any; tokens: any }) => {
    broadcast({ type: 'COMPANY_CHANGED', data })
  }

  const notifyLogin = (data: { user: any; tokens: any; company?: any; requiresCompanySelection?: boolean }) => {
    broadcast({ type: 'USER_LOGIN', data })
  }

  const notifyLogout = () => {
    broadcast({ type: 'USER_LOGOUT', data: {} })
  }

  const notifyTokenRefresh = (data: { tokens: any }) => {
    broadcast({ type: 'TOKEN_REFRESH', data })
  }

  return {
    notifyCompanyChange,
    notifyLogin,
    notifyLogout,
    notifyTokenRefresh
  }
}