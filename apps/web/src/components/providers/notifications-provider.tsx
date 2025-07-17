'use client'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { Notification } from '@erp/domains/notifications'
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
  categories: {
    system: boolean
    stock: boolean
    projet: boolean
    production: boolean
    maintenance: boolean
    qualite: boolean
    facturation: boolean
    sauvegarde: boolean
    utilisateur: boolean
  }
  priority: {
    low: boolean
    normal: boolean
    high: boolean
    urgent: boolean
  }
  schedules?: {
    workingHours?: {
      enabled: boolean
      start: string
      end: string
    }
    weekdays?: {
      enabled: boolean
      days: number[]
    }
  }
}

type NotificationsAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'ARCHIVE_NOTIFICATION'; payload: string }
  | { type: 'UNARCHIVE_NOTIFICATION'; payload: string }
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
    archiveNotification: (id: string) => void
    unarchiveNotification: (id: string) => void
    clearAll: () => void
    updateSettings: (settings: Partial<NotificationSettings>) => void
    createNotification: (notification: CreateNotificationRequest) => Promise<void>
    refreshNotifications: () => Promise<void>
  }
}

export interface CreateNotificationRequest {
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'system' | 'stock' | 'projet' | 'production' | 'maintenance' | 'qualite' | 'facturation' | 'sauvegarde' | 'utilisateur'
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
    sauvegarde: false, // Désactivé par défaut
    utilisateur: true,
  },
  priority: {
    low: false,  // Désactivé par défaut
    normal: true,
    high: true,
    urgent: true,
  },
  schedules: {
    workingHours: {
      enabled: false,
      start: "09:00",
      end: "18:00",
    },
    weekdays: {
      enabled: false,
      days: [1, 2, 3, 4, 5], // Lundi à vendredi
    },
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
        unreadCount: newNotifications.filter((n) => !n.isRead && !n.isArchived).length,
      }
    }

    case 'MARK_AS_READ': {
      const updatedNotifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, isRead: true } : n
      )

      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.isRead && !n.isArchived).length,
      }
    }

    case 'MARK_ALL_AS_READ': {
      const allReadNotifications = state.notifications.map((n) => ({ ...n, isRead: true }))

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
        unreadCount: filteredNotifications.filter((n) => !n.isRead && !n.isArchived).length,
      }
    }

    case 'ARCHIVE_NOTIFICATION': {
      const updatedNotifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, isArchived: true } : n
      )

      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.isRead && !n.isArchived).length,
      }
    }

    case 'UNARCHIVE_NOTIFICATION': {
      const updatedNotifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, isArchived: false } : n
      )

      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.isRead && !n.isArchived).length,
      }
    }

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      }

    case 'SET_NOTIFICATIONS': {
      const notifications = Array.isArray(action.payload) ? action.payload : []
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead && !n.isArchived).length,
        loading: false,
      }
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

  const archiveNotification = useCallback((id: string) => {
    dispatch({ type: 'ARCHIVE_NOTIFICATION', payload: id })
    
    // Archiver côté serveur
    fetch(`/api/notifications/${id}/archive`, { method: 'PATCH' }).catch(console.error)
  }, [])

  const unarchiveNotification = useCallback((id: string) => {
    dispatch({ type: 'UNARCHIVE_NOTIFICATION', payload: id })
    
    // Désarchiver côté serveur
    fetch(`/api/notifications/${id}/unarchive`, { method: 'PATCH' }).catch(console.error)
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

      const result = await response.json()

      dispatch({ type: 'SET_NOTIFICATIONS', payload: result.notifications })
    } catch (error) {
      console.error('Erreur refresh notifications:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des notifications' })
    }
  }, [user])

  // ===== WEBSOCKET CONNECTION =====
  // WebSocket connection is optional for real-time notifications
  // If no NEXT_PUBLIC_WS_URL is configured, fallback to polling simulation

  const connectWebSocket = useCallback(() => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) return

    // Désactiver temporairement WebSocket si l'API n'est pas disponible
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/notifications?userId=${user.id}`
    console.log('[NotificationsProvider] Tentative de connexion WebSocket désactivée temporairement:', wsUrl)
    
    // Simuler une connexion réussie pour le développement
    dispatch({ type: 'SET_CONNECTED', payload: false })
    dispatch({ type: 'SET_ERROR', payload: 'WebSocket désactivé temporairement' })
    return

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        dispatch({ type: 'SET_CONNECTED', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })
        reconnectAttempts.current = 0
      }

      ws.onclose = (event) => {
        dispatch({ type: 'SET_CONNECTED', payload: false })

        // Reconnexion automatique si fermeture inattendue
        if (event.code !== 1000 && reconnectAttempts.current < 3) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connectWebSocket()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        dispatch({ type: 'SET_CONNECTED', payload: false })
      }

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data)
          
          // Filtrer selon les paramètres utilisateur
          if (!state.settings.categories[notification.metadata?.category || 'system']) return
          if (!state.settings.priority[notification.priority?.toLowerCase() || 'normal']) return

          dispatch({ type: 'ADD_NOTIFICATION', payload: notification })

          // Afficher toast si activé
          if (state.settings.enableToast) {
            toast({
              title: notification.title,
              description: notification.message,
              variant: notification.type === 'error' ? 'destructive' : 'default',
            })
          }

          // Son si activé (désactivé temporairement - fichier son manquant)
          if (state.settings.enableSound && false) {
            try {
              const audio = new Audio('/sounds/notification.mp3')
              audio.volume = 0.3
              audio.play().catch(() => {
              })
            } catch (error) {
            }
          }

          // Notification browser si activée
          if (state.settings.enableBrowser && 'Notification' in window && Notification.permission === 'granted') {
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
      dispatch({ type: 'SET_CONNECTED', payload: false })
    }
  }, [user, state.settings, toast, refreshNotifications])

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
      archiveNotification,
      unarchiveNotification,
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
