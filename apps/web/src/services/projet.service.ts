export interface Projet {
  id: string
  nom: string
  description?: string
  statut: 'BROUILLON' | 'EN_COURS' | 'TERMINE' | 'ANNULE'
  dateDebut: Date
  dateFin?: Date
  clientId: string
}

export class ProjetService {
  async getProjets(): Promise<Projet[]> {
    // Mock implementation
    return []
  }

  async getProjet(id: string): Promise<Projet | null> {
    // Mock implementation
    return null
  }

  async createProjet(data: Partial<Projet>): Promise<Projet> {
    // Mock implementation
    throw new Error('Not implemented')
  }
}

export const projetService = new ProjetService()




