'use client'

import { TooltipProvider } from '@erp/ui'
import { QueryClient } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { NotificationsProvider } from '../components/providers/notifications-provider'
import { csrfManager } from '../lib/csrf'
import { I18nProvider } from '../lib/i18n'

const ThemeProvider = dynamic(() => import('next-themes').then((mod) => mod.ThemeProvider), {
  ssr: false,
})

const QueryClientProvider = dynamic(
  () => import('@tanstack/react-query').then((mod) => mod.QueryClientProvider),
  { ssr: false }
)

import { AuthProvider } from '../lib/auth'

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

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize CSRF protection when the app starts
  useEffect(() => {
    const initializeCsrf = async () => {
      try {
        await csrfManager?.initialize()
      } catch (_error) {}
    }

    initializeCsrf()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="vibrant"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="topsteel-theme"
          themes={['light', 'dark', 'vibrant', 'system']}
        >
          <TooltipProvider>
            <AuthProvider>
              <NotificationsProvider>{children}</NotificationsProvider>
            </AuthProvider>
          </TooltipProvider>
          <Toaster position="top-right" />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
