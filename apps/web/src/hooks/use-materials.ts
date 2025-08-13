import type { Material, MaterialFilters, MaterialStatistics } from '@erp/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

const MATERIALS_KEY = 'materials'
const MATERIALS_STATS_KEY = 'materials-statistics'

export function useMaterials(filters?: MaterialFilters) {
  return useQuery({
    queryKey: [MATERIALS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.type) params.append('type', filters.type)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.dimensions) params.append('dimensions', filters.dimensions)
      if (filters?.quality) params.append('quality', filters.quality)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.minStock !== undefined) params.append('minStock', filters.minStock.toString())
      if (filters?.maxStock !== undefined) params.append('maxStock', filters.maxStock.toString())
      if (filters?.stockAlert !== undefined)
        params.append('stockAlert', filters.stockAlert.toString())

      const response = await apiClient.get(`/business/materials?${params}`)
      return response.data as Material[]
    },
  })
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: [MATERIALS_KEY, id],
    queryFn: async () => {
      const response = await apiClient.get(`/business/materials/${id}`)
      return response.data as Material
    },
    enabled: !!id,
  })
}

export function useMaterialStatistics() {
  return useQuery({
    queryKey: [MATERIALS_STATS_KEY],
    queryFn: async () => {
      const response = await apiClient.get('/business/materials/statistics')
      return response.data as MaterialStatistics
    },
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Material>) => {
      const response = await apiClient.post('/business/materials', data)
      return response.data as Material
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] })
      queryClient.invalidateQueries({ queryKey: [MATERIALS_STATS_KEY] })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Material> }) => {
      const response = await apiClient.patch(`/business/materials/${id}`, data)
      return response.data as Material
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] })
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY, id] })
      queryClient.invalidateQueries({ queryKey: [MATERIALS_STATS_KEY] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/business/materials/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_KEY] })
      queryClient.invalidateQueries({ queryKey: [MATERIALS_STATS_KEY] })
    },
  })
}
