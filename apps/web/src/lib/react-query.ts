import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        if ((error as { status?: number })?.status === 404) return false

        return failureCount < 3
      },
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
