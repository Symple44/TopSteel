// apps/web/src/app/providers.tsx
'use client'

import { Toaster } from '@/components/ui/toaster'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DevToolsWrapper } from '@/components/devtools-wrapper'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Initialiser React Query client avec optimisations
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes (remplace cacheTime)
            retry: (failureCount, error) => {
              // Ne pas retry sur les erreurs 4xx
              if ((error as any)?.response?.status>= 400 && (error as any)?.response?.status < 500) {
                return false
              }
              return failureCount < 3
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="topsteel-theme"
        disableTransitionOnChange>
        {children}
        
        {/* Toast notifications */}
        <Toaster/>
        
        {/* React Query DevTools (développement seulement) */}
        {process.env.NODE_ENV === 'development' && (
          <DevToolsWrapper />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

