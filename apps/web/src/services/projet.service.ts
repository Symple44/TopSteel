// apps/web/src/services/projet.service.ts - Version corrigée
import type {
import { useBusinessMetrics } from '@/lib/monitoring/business-metrics'
  Client,
  CreateProjetRequest,
  PaginationResultDto,
  Projet,
  UpdateProjetRequest
} from '@erp/types'

// ✅ Import propre des enums depuis le package
import {
  ClientType,
  ProjetPriorite,
  ProjetStatut,
  ProjetType
} from '@erp/types'

// ✅ Imports nécessaires
import { apiClient } from '@/lib/api-client'
import { ErrorHandler } from '@/lib/error-handler'

// ✅ Helper pour créer un Client mock complet
const createMockClient = (id: string, nom: string): Client => ({
  id,
  nom,
  type: ClientType.PROFESSIONNEL,
  email: 'contact@client.fr',
  telephone: '0123456789',
  isActif: true,
  adresse: {
    rue: '123 Rue Example',
    ville: 'Paris',
    codePostal: '75001'
  },
  contact: {
    nom: nom.split(' ')[0],
    prenom: nom.split(' ')[1] ?? 'Manager'
  },
  createdAt: new Date(),
  updatedAt: new Date()
})

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
            
            // Projet avec ENUMS CORRECTS
            reference: 'PRJ-2024-001',
            description: 'Portail en acier galvanisé',
            statut: ProjetStatut.EN_COURS,
            type: ProjetType.PORTAIL,
            priorite: ProjetPriorite.NORMALE,
            dateDebut: new Date('2024-01-20'),
            dateFinPrevue: new Date('2024-07-15'),
            dateCreation: new Date('2024-01-15'),
            montantHT: 5000,
            montantTTC: 6000,
            tauxTVA: 20,
            marge: 30,
            avancement: 65,
            clientId: '1',
            client: createMockClient('1', 'SARL Martin'), // ✅ Client obligatoire
            adresseChantier: {
              rue: '123 Rue de la Paix',
              ville: 'Paris', 
              codePostal: '75001'
            },
            documentsIds: [],
            ordresFabricationIds: []
          },
          // ✅ Projet supplémentaire pour tester
          {
            id: '2',
            createdAt: new Date('2024-02-01'),
            updatedAt: new Date('2024-06-25'),
            reference: 'PRJ-2024-002',
            description: 'Clôture aluminium',
            statut: ProjetStatut.DEVIS,
            type: ProjetType.CLOTURE,
            priorite: ProjetPriorite.HAUTE,
            dateDebut: new Date('2024-02-10'),
            dateFinPrevue: new Date('2024-08-01'),
            dateCreation: new Date('2024-02-01'),
            montantHT: 8000,
            montantTTC: 9600,
            tauxTVA: 20,
            marge: 25,
            avancement: 30,
            clientId: '2',
            client: createMockClient('2', 'Entreprise Dupont'), // ✅ Client obligatoire
            adresseChantier: {
              rue: '456 Avenue des Champs',
              ville: 'Lyon',
              codePostal: '69000'
            },
            documentsIds: [],
            ordresFabricationIds: []
          }
        ] as Projet[] // ✅ Mock data avec types corrects

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
    // ✅ Utilisation de la méthode getAll existante (mock)
    const response = await this.getAll()
    const projet = response.data.find(p => p.id === id)
    if (!projet) throw new Error('Projet non trouvé')
    return projet
  },

  async create(data: CreateProjetRequest): Promise<Projet> {
    try {
      const payload = {
        nom: data.nom,
        description: data.description,
        clientId: data.clientId,
        budget: data.budget,
        responsable: data.responsable,
        echeance: data.echeance?.toISOString(),
        priorite: data.priorite
      }

      const response = await apiClient.post<any>('/projets', payload)
      
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error)
      throw ErrorHandler.formatError(error)
    }
  },

  async update(id: string, data: UpdateProjetRequest): Promise<Projet> {
    try {
      const payload = {
        nom: data.nom,
        description: data.description,
        statut: data.statut,
        budget: data.budget,
        progression: data.progression,
        responsable: data.responsable,
        echeance: data.echeance?.toISOString(),
        priorite: data.priorite,
        commentaires: data.commentaires
      }

      const response = await apiClient.put<any>(`/projets/${id}`, payload)
      
      return response.data
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du projet ${id}:`, error)
      throw ErrorHandler.formatError(error)
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/projets/${id}`)
    } catch (error) {
      console.error(`Erreur lors de la suppression du projet ${id}:`, error)
      throw ErrorHandler.formatError(error)
    }
  },
}