'use client'

import { QueryClient } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import dynamic from 'next/dynamic'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@erp/ui'
import { I18nProvider } from '@/lib/i18n'
import { NotificationsProvider } from '@/components/providers/notifications-provider'

const ThemeProvider = dynamic(() => import('next-themes').then((mod) => mod.ThemeProvider), {
  ssr: false,
})

const QueryClientProvider = dynamic(
  () => import('@tanstack/react-query').then((mod) => mod.QueryClientProvider),
  { ssr: false }
)

import { AuthProvider } from '@/lib/auth'

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
