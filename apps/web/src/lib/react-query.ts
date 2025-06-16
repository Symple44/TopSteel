// apps/web/src/lib/react-query.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Réduire la fréquence de refetch
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      
      // Optimiser les retry
      retry: (failureCount, error) => {
        if (error?.status === 404) return false
        return failureCount < 2
      },
      
      // Background refetch intelligent
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
})