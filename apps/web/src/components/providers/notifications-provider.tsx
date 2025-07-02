'use client'

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@erp/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useReducer } from 'react';

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  connected: boolean
  settings: {
    enableSound: boolean
    enableToast: boolean
    enableBrowser: boolean
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
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationsState['settings']> }

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  connected: false,
  settings: {
    enableSound: true,
    enableToast: true,
    enableBrowser: true
  }
}

function notificationsReducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications]
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length
      }
    }
    
    case 'MARK_AS_READ': {
      const updatedNotifications = state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n)
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      }
    }
    case 'MARK_ALL_AS_READ': {
      const allReadNotifications = state.notifications.map(n => ({ ...n, read: true })) 
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0
      }
    }
    case 'REMOVE_NOTIFICATION': {
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload)
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length
      }
    }
    
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      }
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length
      }
    
    case 'SET_CONNECTED':
      return {
        ...state,
        connected: action.payload
      }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      }
    
    default:
      return state
  }
}

const NotificationsContext = createContext<{
  state: NotificationsState
  actions: {
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    removeNotification: (id: string) => void
    clearAll: () => void
    updateSettings: (settings: Partial<NotificationsState['settings']>) => void
  }
} | null>(null)

interface NotificationsProviderProps {
  children: ReactNode
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [state, dispatch] = useReducer(notificationsReducer, initialState)
  const { user } = useAuth()
  const { toast } = useToast()

  // WebSocket connection
  useEffect(() => {
    if (!user) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/notifications?userId=${user.id}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      dispatch({ type: 'SET_CONNECTED', payload: true })
      console.log('🔔 Notifications WebSocket connected')
    }

    ws.onclose = () => {
      dispatch({ type: 'SET_CONNECTED', payload: false })
      console.log('🔔 Notifications WebSocket disconnected')
    }

    ws.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data)
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification })

        // Afficher toast si activé
        if (state.settings.enableToast) {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default'
          })
        }

        // Son si activé
        if (state.settings.enableSound) {
          const audio = new Audio('/sounds/notification.mp3')
          audio.volume = 0.3
          audio.play().catch(() => {}) // Ignore les erreurs de lecture
        }

        // Notification browser si activée et permission accordée
        if (state.settings.enableBrowser && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/icons/notification.png',
            tag: notification.id
          })
        }
      } catch (error) {
        console.error('Erreur parsing notification:', error)
      }
    }

    return () => {
      ws.close()
    }
  }, [user, state.settings, toast])

  // Demander permission pour notifications browser
  useEffect(() => {
    if (state.settings.enableBrowser && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [state.settings.enableBrowser])

  // Nettoyer notifications expirées
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const validNotifications = state.notifications.filter(n => 
        !n.expiresAt || new Date(n.expiresAt) > now
      )
      
      if (validNotifications.length !== state.notifications.length) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: validNotifications })
      }
    }, 60000) // Vérifier toutes les minutes

    return () => clearInterval(interval)
  }, [state.notifications])

  const actions = {
    markAsRead: (id: string) => dispatch({ type: 'MARK_AS_READ', payload: id }),
    markAllAsRead: () => dispatch({ type: 'MARK_ALL_AS_READ' }),
    removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
    updateSettings: (settings: Partial<NotificationsState['settings']>) => 
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
  }

  return (
    <NotificationsContext.Provider value={{ state, actions }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}

