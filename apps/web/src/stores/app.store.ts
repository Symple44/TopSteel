/**
 * 🏪 APP STORE - TopSteel ERP Socle
 * Store principal simplifié pour le socle
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// ===== TYPES =====

export interface AppUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role?: string
  permissions?: string[]
  societeId?: string
  societeName?: string
}

export interface UIState {
  sidebarCollapsed: boolean
  sidebarPinned: boolean
  layoutMode: 'default' | 'compact' | 'wide'
  activeModule: string | null
  showTooltips: boolean
}

export interface SessionState {
  token?: string
  refreshToken?: string
  expiresAt?: number
  lastActivity?: number
}

export interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: Date
}

export interface AppState {
  // Base state
  loading: boolean
  error: string | null
  lastUpdate: number
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // UI
  ui: UIState
  
  // User
  user: AppUser | null
  session: SessionState | null
  permissions: string[]
  
  // Notifications
  notifications: NotificationItem[]
  
  // Sync
  isOnline: boolean
}

export interface AppActions {
  // Loading
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // UI
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarPinned: (pinned: boolean) => void
  setLayoutMode: (mode: 'default' | 'compact' | 'wide') => void
  setActiveModule: (module: string | null) => void
  
  // User
  setUser: (user: AppUser | null) => void
  setSession: (session: SessionState | null) => void
  setPermissions: (permissions: string[]) => void
  
  // Notifications
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  
  // Sync
  setOnlineStatus: (isOnline: boolean) => void
  
  // Reset
  reset: () => void
}

type AppStore = AppState & AppActions

// ===== INITIAL STATE =====

const initialState: AppState = {
  loading: false,
  error: null,
  lastUpdate: Date.now(),
  theme: 'light',
  ui: {
    sidebarCollapsed: false,
    sidebarPinned: true,
    layoutMode: 'default',
    activeModule: null,
    showTooltips: true,
  },
  user: null,
  session: null,
  permissions: [],
  notifications: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
}

// ===== STORE =====

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // Loading
        setLoading: (loading) => set({ loading, lastUpdate: Date.now() }),
        setError: (error) => set({ error, lastUpdate: Date.now() }),
        
        // Theme
        setTheme: (theme) => set({ theme, lastUpdate: Date.now() }),
        
        // UI
        setSidebarCollapsed: (collapsed) => 
          set((state) => ({ ui: { ...state.ui, sidebarCollapsed: collapsed }, lastUpdate: Date.now() })),
        setSidebarPinned: (pinned) => 
          set((state) => ({ ui: { ...state.ui, sidebarPinned: pinned }, lastUpdate: Date.now() })),
        setLayoutMode: (mode) => 
          set((state) => ({ ui: { ...state.ui, layoutMode: mode }, lastUpdate: Date.now() })),
        setActiveModule: (module) => 
          set((state) => ({ ui: { ...state.ui, activeModule: module }, lastUpdate: Date.now() })),
        
        // User
        setUser: (user) => set({ user, lastUpdate: Date.now() }),
        setSession: (session) => set({ session, lastUpdate: Date.now() }),
        setPermissions: (permissions) => set({ permissions, lastUpdate: Date.now() }),
        
        // Notifications
        addNotification: (notification) => 
          set((state) => ({
            notifications: [
              { ...notification, id: crypto.randomUUID(), createdAt: new Date() },
              ...state.notifications,
            ],
            lastUpdate: Date.now(),
          })),
        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            lastUpdate: Date.now(),
          })),
        clearNotifications: () => set({ notifications: [], lastUpdate: Date.now() }),
        
        // Sync
        setOnlineStatus: (isOnline) => set({ isOnline, lastUpdate: Date.now() }),
        
        // Reset
        reset: () => set({ ...initialState, lastUpdate: Date.now() }),
      }),
      {
        name: 'topsteel-app-store',
        partialize: (state) => ({
          theme: state.theme,
          ui: state.ui,
        }),
      }
    ),
    { name: 'AppStore' }
  )
)

// ===== SELECTOR HOOKS =====

export const useAppLoading = () => useAppStore((state) => state.loading)
export const useAppError = () => useAppStore((state) => state.error)
export const useAppTheme = () => useAppStore((state) => state.theme)
export const useAppUser = () => useAppStore((state) => state.user)
export const useAppSession = () => useAppStore((state) => state.session)
export const useAppOnlineStatus = () => useAppStore((state) => state.isOnline)
