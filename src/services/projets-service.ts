import { apiClient, PaginatedResponse } from '@/lib/api-client'
import { 
  Projet, 
  ProjetFilters,
  Devis,
  Commande,
  Document as ProjectDocument
} from '@/types'

interface CreateProjetDto {
  clientId: string
  description: string
  dateDebut?: Date
  dateFin?: Date
}

interface UpdateProjetDto extends Partial<CreateProjetDto> {
  statut?: string
  avancement?: number
}

class ProjetsService {
  private baseUrl = '/projets'

  // CRUD de base
  async getAll(filters?: ProjetFilters): Promise<PaginatedResponse<Projet>> {
    return apiClient.get(this.baseUrl, { params: filters })
  }

  async getById(id: string): Promise<Projet> {
    return apiClient.get(`${this.baseUrl}/${id}`)
  }

  async create(data: CreateProjetDto): Promise<Projet> {
    return apiClient.post(this.baseUrl, data)
  }

  async update(id: string, data: UpdateProjetDto): Promise<Projet> {
    return apiClient.put(`${this.baseUrl}/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }

  // Gestion des devis
  async getDevis(projetId: string): Promise<Devis[]> {
    return apiClient.get(`${this.baseUrl}/${projetId}/devis`)
  }

  async createDevis(projetId: string, data: any): Promise<Devis> {
    return apiClient.post(`${this.baseUrl}/${projetId}/devis`, data)
  }

  async updateDevis(projetId: string, devisId: string, data: any): Promise<Devis> {
    return apiClient.put(`${this.baseUrl}/${projetId}/devis/${devisId}`, data)
  }

  async generateDevisPDF(projetId: string, devisId: string): Promise<void> {
    return apiClient.download(
      `${this.baseUrl}/${projetId}/devis/${devisId}/pdf`,
      `devis-${devisId}.pdf`
    )
  }

  async sendDevis(projetId: string, devisId: string, email: string): Promise<void> {
    return apiClient.post(`${this.baseUrl}/${projetId}/devis/${devisId}/send`, { email })
  }

  // Gestion des commandes
  async getCommandes(projetId: string): Promise<Commande[]> {
    return apiClient.get(`${this.baseUrl}/${projetId}/commandes`)
  }

  async createCommande(projetId: string, data: any): Promise<Commande> {
    return apiClient.post(`${this.baseUrl}/${projetId}/commandes`, data)
  }

  // Gestion des documents
  async getDocuments(projetId: string): Promise<ProjectDocument[]> {
    return apiClient.get(`${this.baseUrl}/${projetId}/documents`)
  }

  async uploadDocument(
    projetId: string, 
    file: File, 
    type: string,
    onProgress?: (progress: number) => void
  ): Promise<ProjectDocument> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return apiClient.upload(
      `${this.baseUrl}/${projetId}/documents`,
      formData,
      onProgress
    )
  }

  async deleteDocument(projetId: string, documentId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${projetId}/documents/${documentId}`)
  }

  // Modèle 3D
  async upload3DModel(
    projetId: string, 
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const formData = new FormData()
    formData.append('model', file)

    return apiClient.upload(
      `${this.baseUrl}/${projetId}/model-3d`,
      formData,
      onProgress
    )
  }

  async get3DModel(projetId: string): Promise<string> {
    return apiClient.get(`${this.baseUrl}/${projetId}/model-3d`)
  }

  // Statistiques et rapports
  async getStatistics(): Promise<any> {
    return apiClient.get(`${this.baseUrl}/statistics`)
  }

  async getTimeline(projetId: string): Promise<any[]> {
    return apiClient.get(`${this.baseUrl}/${projetId}/timeline`)
  }

  async duplicate(id: string): Promise<Projet> {
    return apiClient.post(`${this.baseUrl}/${id}/duplicate`)
  }

  // Export
  async exportToExcel(filters?: ProjetFilters): Promise<void> {
    return apiClient.download(
      `${this.baseUrl}/export/excel`,
      'projets.xlsx',
      { params: filters }
    )
  }
}

export const projetsService = new ProjetsService()