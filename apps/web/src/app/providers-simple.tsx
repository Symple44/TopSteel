'use client'

import React, { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from 'next-themes'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
import { useSyncNotifications } from '@/hooks/use-sync-notifications'

// Hook pour initialiser les notifications de sync
const SyncNotificationInitializer = () => {
  useSyncNotifications()
  return null
}

// Wrapper component to provide a minimal query context without TanStack Query
const MinimalQueryProvider = ({ children }: { children: ReactNode }) => {
  // This is a temporary replacement for QueryClientProvider
  // We can implement our own simple query state management if needed
  return <>{children}</>
}

export function ProvidersSimple({ children }: { children: ReactNode }) {
  return (
    <MinimalQueryProvider>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="vibrant"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="topsteel-theme"
          themes={['light', 'dark', 'system', 'vibrant']}
        >
          <AuthProvider>
            <NotificationsProvider>
              <SyncNotificationInitializer />
              {children}
              <Toaster position="top-right" />
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </MinimalQueryProvider>
  )
}