import { NotificationsContext } from '@/components/providers/notifications-provider'
import { useContext } from 'react'

/**
 * Hook principal pour utiliser les notifications
 * 
 * @returns Contexte des notifications avec état et actions
 * @throws Error si utilisé en dehors du NotificationsProvider
 */
export function useNotifications() {
  const context = useContext(NotificationsContext)
  
  if (!context) {
    throw new Error(
      'useNotifications doit être utilisé dans un NotificationsProvider. ' +
      'Vérifiez que votre composant est bien enveloppé dans <NotificationsProvider>.'
    )
  }
  
  return context
}

/**
 * Hook simplifié pour créer des notifications
 * 
 * @returns Fonction pour créer une notification
 */
export function useCreateNotification() {
  const { actions } = useNotifications()
  return actions.createNotification
}

/**
 * Hook pour accéder uniquement à l'état des notifications
 * 
 * @returns État des notifications (lecture seule)
 */
export function useNotificationsState() {
  const { state } = useNotifications()
  return state
}

/**
 * Hook pour accéder uniquement aux actions des notifications
 * 
 * @returns Actions des notifications
 */
export function useNotificationsActions() {
  const { actions } = useNotifications()
  return actions
}

/**
 * Hook pour les paramètres de notifications
 * 
 * @returns Paramètres et fonction de mise à jour
 */
export function useNotificationsSettings() {
  const { state, actions } = useNotifications()
  
  return {
    settings: state.settings,
    updateSettings: actions.updateSettings
  }
}

/**
 * Hook pour le statut de connexion temps réel
 * 
 * @returns Statut de connexion WebSocket
 */
export function useNotificationsConnection() {
  const { state } = useNotifications()
  
  return {
    connected: state.connected,
    loading: state.loading,
    error: state.error
  }
}

/**
 * Hook pour les statistiques des notifications
 * 
 * @returns Statistiques utiles
 */
export function useNotificationsStats() {
  const { state } = useNotifications()
  
  return {
    total: state.notifications.length,
    unread: state.unreadCount,
    read: state.notifications.length - state.unreadCount,
    byCategory: state.notifications.reduce((acc, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byType: state.notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
}

/**
 * Hook pour filtrer les notifications
 * 
 * @param filters Filtres à appliquer
 * @returns Notifications filtrées
 */
export function useFilteredNotifications(filters?: {
  category?: string[]
  type?: string[]
  read?: boolean
  priority?: string[]
}) {
  const { state } = useNotifications()
  
  if (!filters) return state.notifications
  
  return state.notifications.filter(notification => {
    // Filtre par catégorie
    if (filters.category && !filters.category.includes(notification.category)) {
      return false
    }
    
    // Filtre par type
    if (filters.type && !filters.type.includes(notification.type)) {
      return false
    }
    
    // Filtre par statut de lecture
    if (filters.read !== undefined && notification.read !== filters.read) {
      return false
    }
    
    // Filtre par priorité
    if (filters.priority && notification.metadata?.priority) {
      if (!filters.priority.includes(notification.metadata.priority)) {
        return false
      }
    }
    
    return true
  })
}