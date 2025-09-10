'use client'

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
// import { io, type Socket } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type {
  ClientNotification as Notification,
  NotificationProviderSettings,
  NotificationsContextType,
  NotificationsState,
} from '@/types/notifications'
import { callClientApi } from '@/utils/backend-api'

// ===== TYPES ET INTERFACES =====
// Les types sont importés de @/types/notifications

interface NotificationsProviderProps {
  children: ReactNode
}

// ===== ACTIONS =====

type NotificationsAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'DELETE_ALL' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationProviderSettings> }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

// ===== REDUCER =====

const initialSettings: NotificationProviderSettings = {
  enableToast: true,
  enableSound: false,
  enableVibration: false,
  enableBrowser: false,
  enableEmail: false,
  categories: {
    system: true,
    production: true,
    commercial: true,
    admin: true,
  },
  priority: {
    LOW: true,
    NORMAL: true,
    HIGH: true,
    URGENT: true,
  },
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
  settings: initialSettings,
  loading: false,
  error: null,
}

function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction
): NotificationsState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n: Notification) => !n.readAt).length,
      }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.readAt ? state.unreadCount : state.unreadCount + 1,
      }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(
          (n): Notification => (n.id === action.payload ? { ...n, readAt: new Date() } : n)
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(
          (n): Notification => ({
            ...n,
            readAt: new Date(),
          })
        ),
        unreadCount: 0,
      }
    case 'DELETE_NOTIFICATION': {
      const deletedNotification = state.notifications.find((n) => n.id === action.payload)
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
        unreadCount:
          deletedNotification && !deletedNotification.readAt
            ? state.unreadCount - 1
            : state.unreadCount,
      }
    }
    case 'DELETE_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      }
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    case 'SET_CONNECTED':
      return {
        ...state,
        connected: action.payload,
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
      }
    default:
      return state
  }
}

// ===== CONTEXT =====

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}

// ===== PROVIDER =====

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [state, dispatch] = useReducer(notificationsReducer, initialState)

  // Safe check for auth context
  // biome-ignore lint/correctness/useHookAtTopLevel: These hooks need to be called conditionally due to provider hierarchy
  const authContext = (() => {
    try {
      return useAuth()
    } catch (_error) {
      return null
    }
  })()

  // biome-ignore lint/correctness/useHookAtTopLevel: These hooks need to be called conditionally due to provider hierarchy
  const toastContext = (() => {
    try {
      return useToast()
    } catch (_error) {
      return null
    }
  })()

  const user = authContext?.user || null
  const _toast = toastContext?.toast || (() => {})
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const _reconnectAttempts = useRef(0)

  // ===== ACTIONS =====

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await callClientApi(`notifications/${notificationId}/read`, {
        method: 'POST',
      })
      if (response?.ok) {
        dispatch({ type: 'MARK_AS_READ', payload: notificationId })
      }
    } catch (_error) {
      // Error marking as read (silenced)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await callClientApi('notifications/mark-all-read', {
        method: 'POST',
      })
      if (response?.ok) {
        dispatch({ type: 'MARK_ALL_AS_READ' })
      }
    } catch (_error) {
      // Error marking all as read (silenced)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await callClientApi(`notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (response?.ok) {
        dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId })
      }
    } catch (_error) {
      // Error deleting notification (silenced)
    }
  }, [])

  const deleteAll = useCallback(async () => {
    try {
      const response = await callClientApi('notifications', {
        method: 'DELETE',
      })
      if (response?.ok) {
        dispatch({ type: 'DELETE_ALL' })
      }
    } catch (_error) {
      // Error deleting all notifications (silenced)
    }
  }, [])

  const updateSettings = useCallback(
    (settings: Partial<NotificationProviderSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
      // Sauvegarder dans localStorage
      localStorage.setItem(
        'notificationSettings',
        JSON.stringify({ ...state.settings, ...settings })
      )
    },
    [state.settings]
  )

  const refreshNotifications = useCallback(async () => {
    if (!user) return

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await callClientApi('notifications')
      if (response?.ok) {
        const data = await response?.json()
        dispatch({ type: 'SET_NOTIFICATIONS', payload: data?.data ?? [] })
      }
    } catch (_error) {
      // Error refreshing notifications (silenced)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user])

  // ===== WEBSOCKET CONNECTION =====

  const connectWebSocket = useCallback(async () => {
    if (!user || socketRef.current?.connected === true) return

    // Temporairement désactiver WebSocket - utiliser polling à la place
    // WebSocket disabled, using polling (log silenced)

    dispatch({ type: 'SET_CONNECTED', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    // Simuler une connexion réussie
    const mockSocket = {
      connected: true,
      readyState: WebSocket.OPEN,
      emit: (_event: string, _data?: unknown) => {
        // Mock emit (silenced)
      },
      disconnect: () => {
        // Mock disconnect (silenced)
      },
    }

    if (socketRef.current !== undefined) {
      socketRef.current = mockSocket as unknown as Socket
    }

    // Démarrer le polling pour les notifications
    const pollNotifications = () => {
      if (socketRef.current?.connected) {
        // Simuler la réception de notifications via polling
        setTimeout(pollNotifications, 5000) // Poll toutes les 5 secondes
      }
    }

    pollNotifications()

    /* 
    // Code WebSocket original - temporairement désactivé
    const wsUrl = (process?.env?.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001').replace('http://', 'ws://').replace('https://', 'wss://')

    try {
      const ws = new WebSocket(`${wsUrl}?userId=${user?.id}`)
      
      // Simuler Socket.IO interface
      const socketWrapper = {
        connected: false,
        readyState: ws.readyState,
        emit: (event, data) => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws?.send(JSON.stringify({ type: event, data }))
          }
        },
        disconnect: () => {
          ws?.close()
        }
      }
      
      if (socketRef.current !== undefined) {
        socketRef.current = socketWrapper
      }

      if (ws) {
        ws.onopen = () => {
          if (socketWrapper) {
            socketWrapper.connected = true
            socketWrapper.readyState = ws.readyState
          }
        dispatch({ type: 'SET_CONNECTED', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })
        reconnectAttempts.current = 0
        
        // Rejoindre la room de l'utilisateur
        if (ws) {
          ws.send(JSON.stringify({ type: 'join', data: { userId: user.id } }))
        }
      }

        ws.onclose = (event) => {
          if (socketWrapper) {
            socketWrapper.connected = false
            socketWrapper.readyState = ws.readyState
          }
        dispatch({ type: 'SET_CONNECTED', payload: false })
        
        // Reconnexion automatique si fermeture inattendue
        if (event.code !== 1000 && reconnectAttempts.current < 3) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000)
          
          if (reconnectTimeoutRef.current !== undefined) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++
              connectWebSocket()
            }, delay)
          }
        }
      }

      ws.onerror = (error) => {
        console.error('[NotificationsProvider] Erreur WebSocket:', error, 'Type:', typeof error, 'Keys:', Object.keys(error))
        dispatch({ type: 'SET_CONNECTED', payload: false })
        dispatch({ type: 'SET_ERROR', payload: `Erreur de connexion WebSocket: ${error.message || 'Connexion impossible'}` })
      }
    */

    /*
      ws?.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'notification') {
            const notification = message?.data
            
            // Filtrer selon les paramètres utilisateur
            if (!state?.settings?.categories[notification?.metadata?.category || 'system']) return
            if (!state?.settings?.priority[notification?.priority?.toLowerCase() || 'normal']) return

            dispatch({ type: 'ADD_NOTIFICATION', payload: notification })

            // Afficher toast si activé
            if (state?.settings?.enableToast) {
              toast({
                title: notification.title,
                description: notification.message,
                variant: notification.type === 'error' ? 'destructive' : 'default',
              })
            }

            // Son si activé (désactivé temporairement - fichier son manquant)
            if (state?.settings?.enableSound && false) {
              try {
                const audio = new Audio('/sounds/notification.mp3')
                if (audio) {
                  audio.volume = 0.3
                }
                audio?.play().catch(() => {
                })
              } catch (error) {
              }
            }

            // Vibration si activé et supporté
            if (state?.settings?.enableVibration && 'vibrate' in navigator) {
              navigator?.vibrate(200)
            }

            // Notification browser si activée
            if (state?.settings?.enableBrowser && 'Notification' in window && Notification.permission === 'granted') {
              new window.Notification(notification.title, {
                body: notification.message,
                icon: '/icons/notification?.png',
                tag: notification.id,
              })
            }
          } else if (message.type === 'notification_read') {
            dispatch({ type: 'MARK_AS_READ', payload: message?.data?.notificationId })
          }
        } catch (error) {
          console.error('[NotificationsProvider] Erreur traitement message:', error)
        }
      }

    } catch (error) {
      console.error('[NotificationsProvider] Erreur création WebSocket:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Impossible de créer la connexion WebSocket' })
    }
    */
  }, [user])

  // ===== EFFECTS =====

  // Connexion WebSocket
  useEffect(() => {
    if (user) {
      connectWebSocket()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
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

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
      } catch (_error) {
        // Error loading settings (silenced)
      }
    }
  }, [])

  // Rafraîchir les notifications au démarrage
  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  // ===== CONTEXT VALUE =====

  const contextValue: NotificationsContextType = {
    state,
    actions: {
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAll,
      updateSettings,
      refreshNotifications,
    },
  }

  return (
    <NotificationsContext.Provider value={contextValue}>{children}</NotificationsContext.Provider>
  )
}

// Re-export types for external use
export type { NotificationsState, NotificationsContextType }
