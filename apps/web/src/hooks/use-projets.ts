import type { Projet } from '@erp/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Mock service - à remplacer par le vrai service API
const ProjetsService = {
  getAll: async (): Promise<Projet[]> => Promise.resolve([]),
  getById: async (id: string): Promise<Projet> => Promise.resolve({} as Projet),
  create: async (data: Partial<Projet>): Promise<Projet> => Promise.resolve(data as Projet),
  update: async (id: string, data: Partial<Projet>): Promise<Projet> => Promise.resolve({ ...data, id } as Projet),
  delete: async (id: string): Promise<void> => Promise.resolve()
}

export const useProjets = () => {
  return useQuery({
    queryKey: ['projets'],
    queryFn: () => ProjetsService.getAll(),
  })
}

export const useProjet = (id: string) => {
  return useQuery({
    queryKey: ['projet', id],
    queryFn: () => ProjetsService.getById(id),
    enabled: !!id,
  })
}

export const useCreateProjet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Projet>) => ProjetsService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projets'] }),
  })
}

export const useUpdateProjet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Projet> }) => ProjetsService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projets'] }),
  })
}

export const useDeleteProjet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ProjetsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projets'] }),
  })
}
