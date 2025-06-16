// apps/web/src/services/projets.service.ts
import { apiClient } from '@/lib/api-client'
import type { Projet, ProjetFormData, ApiResponse } from '@erp/types'

class ProjetsService {
  async getAll(): Promise<Projet[]> {
    const response = await apiClient.get<ApiResponse<Projet[]>>('/projets')
    return response.data.data || []
  }

  async getById(id: string): Promise<Projet> {
    const response = await apiClient.get<ApiResponse<Projet>>(`/projets/${id}`)
    return response.data.data!
  }

  async create(data: ProjetFormData): Promise<Projet> {
    const response = await apiClient.post<ApiResponse<Projet>>('/projets', data)
    return response.data.data!
  }

  async update(id: string, data: Partial<ProjetFormData>): Promise<Projet> {
    const response = await apiClient.put<ApiResponse<Projet>>(`/projets/${id}`, data)
    return response.data.data!
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projets/${id}`)
  }
}

export const projetsService = new ProjetsService()