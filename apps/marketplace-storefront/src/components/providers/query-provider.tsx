'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

// Type pour les erreurs avec structure connue
interface APIError {
  response?: {
    status?: number
    data?: unknown
  }
  message?: string
  code?: string
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error: unknown) => {
              // Ne pas retry si c'est une erreur 404 ou tenant non trouvé
              const apiError = error as APIError
              if (apiError?.response?.status === 404 || apiError?.message === 'TENANT_NOT_FOUND') {
                return false
              }
              return failureCount < 3
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
