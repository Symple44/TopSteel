// apps/web/src/services/projets.service.ts
import type { CreateProjetRequest, PaginationResultDto, Projet, UpdateProjetRequest } from '@erp/types'

export const projetService = {
  async getAll(filters?: any): Promise<PaginationResultDto<Projet>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockProjets: Projet[] = [
          {
            // BaseEntity
            id: '1',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-06-20'),
            
            // Projet
            reference: 'PRJ-2024-001',
            description: 'Portail en acier galvanisé',
            statut: 'EN_COURS',
            type: 'PORTAIL',
            priorite: 'NORMALE',
            dateDebut: new Date('2024-01-20'),
            dateFinPrevue: new Date('2024-07-15'),
            dateCreation: new Date('2024-01-15'),
            montantHT: 5000,
            montantTTC: 6000,
            tauxTVA: 20,
            marge: 30,
            avancement: 65,
            clientId: '1',
            client: { 
              id: '1', 
              nom: 'SARL Martin', 
              email: 'contact@martin.fr',
              createdAt: new Date(),
              updatedAt: new Date()
            } as any,
            adresseChantier: { 
              rue: '123 Rue de la Paix',
              ville: 'Paris', 
              codePostal: '75001'
            } as any,
            documentsIds: [],
            ordresFabricationIds: []
          } as Projet
        ]

        resolve({
          data: mockProjets,
          meta: {
            page: 1,
            limit: 10,
            total: mockProjets.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        })
      }, 500)
    })
  },

  async getById(id: string): Promise<Projet> {
    const response = await this.getAll()
    const projet = response.data.find(p => p.id === id)
    if (!projet) throw new Error('Projet non trouvé')
    return projet
  },

  async create(data: CreateProjetRequest): Promise<Projet> {
    // TODO: Remplacer par appel API réel
    return Promise.resolve({} as Projet)
  },

  async update(id: string, data: UpdateProjetRequest): Promise<Projet> {
    // TODO: Remplacer par appel API réel  
    return Promise.resolve({} as Projet)
  },

  async delete(id: string): Promise<void> {
    // TODO: Remplacer par appel API réel
    return Promise.resolve()
  },
}