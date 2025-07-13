'use client'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { Notification } from '@erp/types'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'

// ===== TYPES ET INTERFACES =====

export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  connected: boolean
  settings: NotificationSettings
  loading: boolean
  error: string | null
}

export interface NotificationSettings {
  enableSound: boolean
  enableToast: boolean
  enableBrowser: boolean
  enableEmail: boolean
  categories: Record<string, boolean>
  priority: {
    low: boolean
    normal: boolean
    high: boolean
    urgent: boolean
  }
}

type NotificationsAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

export interface NotificationsContextValue {
  state: NotificationsState
  actions: {
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    removeNotification: (id: string) => void
    clearAll: () => void
    updateSettings: (settings: Partial<NotificationSettings>) => void
    createNotification: (notification: CreateNotificationRequest) => Promise<void>
    refreshNotifications: () => Promise<void>
  }
}

export interface CreateNotificationRequest {
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'stock' | 'projet' | 'production' | 'maintenance'
  title: string
  message: string
  data?: Record<string, unknown>
  persistent?: boolean
  actionUrl?: string
  actionLabel?: string
}

// ===== ÉTAT INITIAL =====

const defaultSettings: NotificationSettings = {
  enableSound: true,
  enableToast: true,
  enableBrowser: true,
  enableEmail: false,
  categories: {
    system: true,
    stock: true,
    projet: true,
    production: true,
    maintenance: true,
    qualite: true,
    facturation: true,
  },
  priority: {
    low: true,
    normal: true,
    high: true,
    urgent: true,
  },
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
  settings: defaultSettings,
  loading: false,
  error: null,
}

// ===== REDUCER =====

function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction
): NotificationsState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications]

      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.read).length,
      }
    }

    case 'MARK_AS_READ': {
      const updatedNotifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, read: true } : n
      )

      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      }
    }

    case 'MARK_ALL_AS_READ': {
      const allReadNotifications = state.notifications.map((n) => ({ ...n, read: true }))

      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      }
    }

    case 'REMOVE_NOTIFICATION': {
      const filteredNotifications = state.notifications.filter((n) => n.id !== action.payload)

      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter((n) => !n.read).length,
      }
    }

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      }

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.read).length,
        loading: false,
      }

    case 'SET_CONNECTED':
      return {
        ...state,
        connected: action.payload,
      }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      }

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      }

    default:
      return state
  }
}

// ===== CONTEXTE =====

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)

// ===== PROVIDER =====

interface NotificationsProviderProps {
  children: ReactNode
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [state, dispatch] = useReducer(notificationsReducer, initialState)
  const { user } = useAuth()
  const { toast } = useToast()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  // ===== ACTIONS =====

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id })

    // Marquer comme lu côté serveur
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(console.error)
  }, [])

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' })

    // Marquer toutes comme lues côté serveur
    fetch('/api/notifications/read-all', { method: 'PATCH' }).catch(console.error)
  }, [])

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  }, [])

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' })
  }, [])

  const updateSettings = useCallback((settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })

    // Sauvegarder les paramètres côté serveur
    fetch('/api/notifications/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(console.error)
  }, [])

  const createNotification = useCallback(async (notification: CreateNotificationRequest) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de la notification")
      }

      return response.json()
    } catch (error) {
      console.error('Erreur création notification:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la création de la notification' })
      throw error
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (!user) return

    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const response = await fetch('/api/notifications')

      if (!response.ok) throw new Error('Erreur lors du chargement')

      const notifications = await response.json()

      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })
    } catch (error) {
      console.error('Erreur refresh notifications:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des notifications' })
    }
  }, [user])

  // ===== WEBSOCKET CONNECTION =====

  const connectWebSocket = useCallback(() => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/notifications?userId=${user.id}`

    try {
      const ws = new WebSocket(wsUrl)

      wsRef.current = ws

      ws.onopen = () => {
        dispatch({ type: 'SET_CONNECTED', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })
        reconnectAttempts.current = 0
      }

      ws.onclose = () => {
        dispatch({ type: 'SET_CONNECTED', payload: false })

        // Reconnexion automatique avec backoff exponentiel
        if (reconnectAttempts.current < 5) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connectWebSocket()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        console.error('🔔 WebSocket error:', error)
        dispatch({ type: 'SET_ERROR', payload: 'Erreur de connexion temps réel' })
      }

      ws.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data)

          // Filtrer selon les paramètres utilisateur
          if (!state.settings.categories[notification.category]) return
          if (!state.settings.priority[notification.metadata?.priority || 'normal']) return

          dispatch({ type: 'ADD_NOTIFICATION', payload: notification })

          // Afficher toast si activé
          if (state.settings.enableToast) {
            toast({
              title: notification.title,
              description: notification.message,
              variant: notification.type === 'error' ? 'destructive' : 'default',
            })
          }

          // Son si activé
          if (state.settings.enableSound) {
            const audio = new Audio('/sounds/notification.mp3')

            audio.volume = 0.3
            audio.play().catch(() => {}) // Ignore les erreurs de lecture
          }

          // Notification browser si activée et permission accordée
          if (
            state.settings.enableBrowser &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new window.Notification(notification.title, {
              body: notification.message,
              icon: '/icons/notification.png',
              tag: notification.id,
            })
          }
        } catch (error) {
          console.error('Erreur parsing notification:', error)
        }
      }
    } catch (error) {
      console.error('Erreur connexion WebSocket:', error)
      dispatch({
        type: 'SET_ERROR',
        payload: 'Impossible de se connecter au serveur de notifications',
      })
    }
  }, [user, state.settings, toast])

  // ===== EFFECTS =====

  // Connexion WebSocket
  useEffect(() => {
    if (user) {
      connectWebSocket()
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [user, connectWebSocket])

  // Demander permission pour notifications browser
  useEffect(() => {
    if (
      state.settings.enableBrowser &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission()
    }
  }, [state.settings.enableBrowser])

  // Nettoyer notifications expirées
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const validNotifications = state.notifications.filter(
        (n) => !n.expiresAt || new Date(n.expiresAt) > now
      )

      if (validNotifications.length !== state.notifications.length) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: validNotifications })
      }
    }, 60000) // Vérifier toutes les minutes

    return () => clearInterval(interval)
  }, [state.notifications])

  // Charger les notifications initiales
  useEffect(() => {
    if (user) {
      refreshNotifications()
    }
  }, [user, refreshNotifications])

  // ===== VALEUR DU CONTEXTE =====

  const contextValue: NotificationsContextValue = {
    state,
    actions: {
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      updateSettings,
      createNotification,
      refreshNotifications,
    },
  }

  return (
    <NotificationsContext.Provider value={contextValue}>{children}</NotificationsContext.Provider>
  )
}

// ===== HOOKS EXPORTS =====

/**
 * Hook principal pour utiliser les notifications
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
