// apps/web/src/hooks/use-projets.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projetsService } from '@/services/projets.service'
import type { Projet, ProjetFormData } from '@erp/types'

export function useProjets() {
  return useQuery({
    queryKey: ['projets'],
    queryFn: projetsService.getAll,
  })
}

export function useProjet(id: string) {
  return useQuery({
    queryKey: ['projets', id],
    queryFn: () => projetsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateProjet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProjetFormData) => projetsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projets'] })
    },
  })
}

export function useUpdateProjet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjetFormData> }) =>
      projetsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projets'] })
      queryClient.invalidateQueries({ queryKey: ['projets', id] })
    },
  })
}

export function useDeleteProjet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projetsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projets'] })
    },
  })
}