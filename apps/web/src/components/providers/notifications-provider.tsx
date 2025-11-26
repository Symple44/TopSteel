/**
 * Notifications Provider Stub - Socle
 */
'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface NotificationsContextType {
  notifications: unknown[]
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
})

export function NotificationsProvider({ children }: { children: ReactNode }) {
  return (
    <NotificationsContext.Provider value={{ notifications: [], unreadCount: 0 }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  return useContext(NotificationsContext)
}
