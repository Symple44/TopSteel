// apps/web/src/hooks/use-optimized-query.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface OptimizedQueryOptions<T> {
  key: string[]
  fetcher: () => Promise<T>
  staleTime?: number
  gcTime?: number // Remplace cacheTime dans les nouvelles versions
  enabled?: boolean
}

export function useOptimizedQuery<T>({
  key,
  fetcher,
  staleTime = 5 * 60 * 1000, // 5 minutes
  gcTime = 30 * 60 * 1000, // 30 minutes (remplace cacheTime)
  enabled = true,
}: OptimizedQueryOptions<T>) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime,
    gcTime, // Utilise gcTime au lieu de cacheTime
    enabled,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: unknown) => {
      if ((error as { response?: { status: number } })?.response?.status === 404) return false

      return failureCount < 3
    },
  })
}

export function useOptimizedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidationKeys?: string[][]
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidationKeys) {
        for (const key of invalidationKeys) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }
    },
    onError: () => {},
  })
}

/**
 * Hook pour optimiser les requêtes avec cache intelligent
 */
export function useSmartQuery<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    gcTime?: number
    refetchInterval?: number
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.gcTime ?? 30 * 60 * 1000,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error: unknown) => {
      // Ne pas retry sur les erreurs 4xx
      const errorResponse = (error as { response?: { status: number } })?.response
      if (errorResponse?.status && errorResponse.status >= 400 && errorResponse.status < 500) {
        return false
      }

      return failureCount < 3
    },
  })
}

/**
 * Hook pour les mutations avec invalidation automatique
 */
export function useSmartMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    invalidateKeys?: string[][]
    onSuccess?: (data: TData) => void
    onError?: (error: unknown) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Invalider les clés spécifiées
      if (options?.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }

      // Callback de succès personnalisé
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      options?.onError?.(error)
    },
    retry: (failureCount, error: unknown) => {
      // Ne pas retry sur les erreurs client (4xx)
      const errorResponse = (error as { response?: { status: number } })?.response
      if (errorResponse?.status && errorResponse.status >= 400 && errorResponse.status < 500) {
        return false
      }

      return failureCount < 1 // Un seul retry pour les erreurs serveur
    },
  })
}
