'use client'

import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from 'next-themes'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
import { ToastProvider, Toaster as UIToaster } from '@erp/ui'
import { useSyncNotifications } from '@/hooks/use-sync-notifications'
import dynamic from 'next/dynamic'

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Hook pour initialiser les notifications de sync
const SyncNotificationInitializer = () => {
  useSyncNotifications()
  return null
}

// Composant qui contient tous les providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="vibrant"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="topsteel-theme"
          themes={['light', 'dark', 'system', 'vibrant']}
        >
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <SyncNotificationInitializer />
                {children}
                <Toaster position="top-right" />
                <UIToaster position="bottom-right" />
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

// Version sans SSR pour éviter les problèmes React 19
const NoSSRProviders = dynamic(() => Promise.resolve(AllProviders), {
  ssr: false,
  loading: () => null
})

export function ProvidersSimple({ children }: { children: React.ReactNode }) {
  return (
    <NoSSRProviders>
      {children}
    </NoSSRProviders>
  )
}