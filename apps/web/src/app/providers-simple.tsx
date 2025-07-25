'use client'

import React, { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth/AuthProvider-simple'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProviderWrapper } from '@/components/providers/theme-provider-wrapper'
import { AppearanceProvider } from '@/components/providers/appearance-provider'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
import { TranslationOverrideProvider } from '@/components/providers/translation-override-provider'
import { useSyncNotifications } from '@/hooks/use-sync-notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TabSyncNotification from '@/components/auth/tab-sync-notification'
import { useTabCleanup } from '@/lib/tab-detection'

// Dynamically load React Query to avoid SSR issues
const DynamicQueryClientProvider = dynamic(
  () => import('@tanstack/react-query').then((mod) => mod.QueryClientProvider),
  { ssr: false }
)

// Hook pour initialiser les notifications de sync
const SyncNotificationInitializer = () => {
  useSyncNotifications()
  useTabCleanup()
  return null
}

// Create a query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
})

export function ProvidersSimple({ children }: { children: ReactNode }) {
  return (
    <DynamicQueryClientProvider client={queryClient}>
      <I18nProvider>
        <TranslationOverrideProvider>
          <ThemeProviderWrapper>
            {/* <AppearanceProvider> Temporairement désactivé pour debug */}
              <AuthProvider>
                <NotificationsProvider>
                  <SyncNotificationInitializer />
                  <TabSyncNotification />
                  {children}
                  <Toaster position="top-right" />
                </NotificationsProvider>
              </AuthProvider>
            {/* </AppearanceProvider> */}
          </ThemeProviderWrapper>
        </TranslationOverrideProvider>
      </I18nProvider>
    </DynamicQueryClientProvider>
  )
}