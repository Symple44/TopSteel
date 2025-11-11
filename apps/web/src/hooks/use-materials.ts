import type { Material, MaterialFilters, MaterialStatistics } from '@erp/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api-client-instance'
import { deleteTyped, fetchTyped, postTyped } from '../lib/api-typed'

const MATERIALS_KEY = 'materials'
const MATERIALS_STATS_KEY = 'materials-statistics'

export function useMaterials(filters?: MaterialFilters) {
  return useQuery<Material[], Error>({
    queryKey: [MATERIALS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.type) {
        const typeValue = Array.isArray(filters.type)
          ? filters.type.join(',')
          : String(filters.type)
        params.append('type', typeValue)
      }
      if (filters?.category) params?.append('category', filters.category)
      if (filters?.dimensions) params?.append('dimensions', filters.dimensions)
      if (filters?.qualite) params.append('qualite', filters.qualite)
      if (filters?.search) params?.append('search', filters.search)
      if (filters?.minStock !== undefined) params?.append('minStock', filters.minStock?.toString())
      if (filters?.maxStock !== undefined) params?.append('maxStock', filters.maxStock?.toString())
      if (filters?.stockAlert !== undefined)
        params?.append('stockAlert', filters?.stockAlert?.toString())

      const response = await fetchTyped<Material[]>(`/business/materials?${params}`)
      return response
    },
  })
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: [MATERIALS_KEY, id],
    queryFn: async () => {
      const response = await fetchTyped(`/business/materials/${id}`)
      return response as Material
    },
    enabled: !!id,
  })
}

export function useMaterialStatistics() {
  return useQuery({
    queryKey: [MATERIALS_STATS_KEY],
    queryFn: async () => {
      const response = await fetchTyped('/business/materials/statistics')
      return response as MaterialStatistics
    },
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Material>) => {
      const response = await postTyped('/business/materials', data)
      return response as Material
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: [MATERIALS_KEY] })
      queryClient?.invalidateQueries({ queryKey: [MATERIALS_STATS_KEY] })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Material> }) => {
      const response: any = await apiClient?.patch(`/business/materials/${id}`, data)
      return response as Material
    },
    onSuccess: (_, { id }) => {
      queryClient?.invalidateQueries({ queryKey: [MATERIALS_KEY] })
      queryClient?.invalidateQueries({ queryKey: [MATERIALS_KEY, id] })
      queryClient?.invalidateQueries({ queryKey: [MATERIALS_STATS_KEY] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteTyped(`/business/materials/${id}`)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: [MATERIALS_KEY] })
      queryClient?.invalidateQueries({ queryKey: [MATERIALS_STATS_KEY] })
    },
  })
}
