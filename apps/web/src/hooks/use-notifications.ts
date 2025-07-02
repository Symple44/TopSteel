import { NotificationsContext } from '@/components/providers/notifications-provider'
import { useContext } from 'react'

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}

// Hook pour créer facilement des notifications
export function useCreateNotification() {
  const { state } = useNotifications()
  
  const createNotification = async (notification: {
    type: 'info' | 'success' | 'warning' | 'error'
    category: 'system' | 'stock' | 'projet' | 'production' | 'maintenance'
    title: string
    message: string
    data?: Record<string, any>
    persistent?: boolean
    actionUrl?: string
    actionLabel?: string
  }) => {
    // Envoyer via API au backend qui diffusera via WebSocket
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi de la notification')
    }
    
    return response.json()
  }
  
  return { createNotification }
}