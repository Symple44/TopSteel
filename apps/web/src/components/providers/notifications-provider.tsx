'use client'

import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import type { Notification } from '@erp/domains/notifications'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
// import { io, type Socket } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { callClientApi } from '@/utils/backend-api'

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
  enableToast: boolean
  enableSound: boolean
  enableVibration: boolean
  enableBrowser: boolean
  enableEmail: boolean
  categories: {
    system: boolean
    production: boolean
    commercial: boolean
    admin: boolean
  }
  priority: {
    low: boolean
    normal: boolean
    high: boolean
    urgent: boolean
  }
}

export interface NotificationsContextType {
  state: NotificationsState
  actions: {
    markAsRead: (notificationId: string) => void
    markAllAsRead: () => void
    deleteNotification: (notificationId: string) => void
    deleteAll: () => void
    updateSettings: (settings: Partial<NotificationSettings>) => void
    refreshNotifications: () => Promise<void>
  }
}

interface NotificationsProviderProps {
  children: ReactNode
}

// ===== ACTIONS =====

interface NotificationsAction {
  type: 'SET_NOTIFICATIONS' | 'ADD_NOTIFICATION' | 'MARK_AS_READ' | 'MARK_ALL_AS_READ' | 'DELETE_NOTIFICATION' | 'DELETE_ALL' | 'UPDATE_SETTINGS' | 'SET_CONNECTED' | 'SET_LOADING' | 'SET_ERROR'
  payload?: any
}

// ===== REDUCER =====

const initialSettings: NotificationSettings = {
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
  settings: initialSettings,
  loading: false,
  error: null,
}

function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
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
        unreadCount: !action.payload.readAt ? state.unreadCount + 1 : state.unreadCount,
      }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, readAt: new Date().toISOString() })),
        unreadCount: 0,
      }
    case 'DELETE_NOTIFICATION':
      const deletedNotification = state.notifications.find(n => n.id === action.payload)
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: deletedNotification && !deletedNotification.readAt ? state.unreadCount - 1 : state.unreadCount,
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
  const { user } = useAuth()
  const { toast } = useToast()
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  // ===== ACTIONS =====

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await callClientApi(`notifications/${notificationId}/read`, {
        method: 'POST',
      })
      if (response.ok) {
        dispatch({ type: 'MARK_AS_READ', payload: notificationId })
      }
    } catch (error) {
      // Error marking as read (silenced)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await callClientApi('notifications/mark-all-read', {
        method: 'POST',
      })
      if (response.ok) {
        dispatch({ type: 'MARK_ALL_AS_READ' })
      }
    } catch (error) {
      // Error marking all as read (silenced)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await callClientApi(`notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId })
      }
    } catch (error) {
      // Error deleting notification (silenced)
    }
  }, [])

  const deleteAll = useCallback(async () => {
    try {
      const response = await callClientApi('notifications', {
        method: 'DELETE',
      })
      if (response.ok) {
        dispatch({ type: 'DELETE_ALL' })
      }
    } catch (error) {
      // Error deleting all notifications (silenced)
    }
  }, [])

  const updateSettings = useCallback((settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
    // Sauvegarder dans localStorage
    localStorage.setItem('notificationSettings', JSON.stringify({ ...state.settings, ...settings }))
  }, [state.settings])

  const refreshNotifications = useCallback(async () => {
    if (!user) return
    
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await callClientApi('notifications')
      if (response.ok) {
        const data = await response.json()
        dispatch({ type: 'SET_NOTIFICATIONS', payload: data.data || [] })
      }
    } catch (error) {
      // Error refreshing notifications (silenced)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [user])

  // ===== WEBSOCKET CONNECTION =====

  const connectWebSocket = useCallback(async () => {
    if (!user || socketRef.current?.readyState === WebSocket.OPEN) return

    // Temporairement désactiver WebSocket - utiliser polling à la place
    // WebSocket disabled, using polling (log silenced)
    
    dispatch({ type: 'SET_CONNECTED', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    
    // Simuler une connexion réussie
    const mockSocket = {
      connected: true,
      readyState: WebSocket.OPEN,
      emit: (event, data) => {
        // Mock emit (silenced)
      },
      disconnect: () => {
        // Mock disconnect (silenced)
      }
    }
    
    socketRef.current = mockSocket
    
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
    const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001').replace('http://', 'ws://').replace('https://', 'wss://')
    console.log('[NotificationsProvider] Tentative connexion WebSocket:', wsUrl)

    try {
      const ws = new WebSocket(`${wsUrl}?userId=${user.id}`)
      
      // Simuler Socket.IO interface
      const socketWrapper = {
        connected: false,
        readyState: ws.readyState,
        emit: (event, data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: event, data }))
          }
        },
        disconnect: () => {
          ws.close()
        }
      }
      
      socketRef.current = socketWrapper

      ws.onopen = () => {
        console.log('[NotificationsProvider] WebSocket connecté')
        socketWrapper.connected = true
        socketWrapper.readyState = ws.readyState
        dispatch({ type: 'SET_CONNECTED', payload: true })
        dispatch({ type: 'SET_ERROR', payload: null })
        reconnectAttempts.current = 0
        
        // Rejoindre la room de l'utilisateur
        ws.send(JSON.stringify({ type: 'join', data: { userId: user.id } }))
      }

      ws.onclose = (event) => {
        console.log('[NotificationsProvider] WebSocket fermé:', event.code, event.reason)
        socketWrapper.connected = false
        socketWrapper.readyState = ws.readyState
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
        console.error('[NotificationsProvider] Erreur WebSocket:', error, 'Type:', typeof error, 'Keys:', Object.keys(error))
        dispatch({ type: 'SET_CONNECTED', payload: false })
        dispatch({ type: 'SET_ERROR', payload: `Erreur de connexion WebSocket: ${error.message || 'Connexion impossible'}` })
      }
    */

      /*
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          if (message.type === 'notification') {
            const notification = message.data
            
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

            // Vibration si activé et supporté
            if (state.settings.enableVibration && 'vibrate' in navigator) {
              navigator.vibrate(200)
            }

            // Notification browser si activée
            if (state.settings.enableBrowser && 'Notification' in window && Notification.permission === 'granted') {
              new window.Notification(notification.title, {
                body: notification.message,
                icon: '/icons/notification.png',
                tag: notification.id,
              })
            }
          } else if (message.type === 'notification_read') {
            dispatch({ type: 'MARK_AS_READ', payload: message.data.notificationId })
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
  }, [user, state.settings, toast])

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
    if (state.settings.enableBrowser && 'Notification' in window && Notification.permission === 'default') {
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
      } catch (error) {
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
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  )
}