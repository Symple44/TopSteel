// apps/web/src/hooks/use-optimized-query.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

interface OptimizedQueryOptions<T> {
  key: string[]
  fetcher: () => Promise<T>
  staleTime?: number
  cacheTime?: number
  enabled?: boolean
}

export function useOptimizedQuery<T>({
  key,
  fetcher,
  staleTime = 5 * 60 * 1000, // 5 minutes
  cacheTime = 30 * 60 * 1000, // 30 minutes
  enabled = true
}: OptimizedQueryOptions<T>) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime,
    cacheTime,
    enabled,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false
      return failureCount < 3
    }
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
        invalidationKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
    onError: (error) => {
      console.error('Mutation error:', error)
    }
  })
}
