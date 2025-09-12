// apps/web/src/lib/api.ts - Client API pour Zustand stores
import { ERPApiClient } from '@erp/api-client'
import {
  type Projet,
  type ProjetFilters,
  ProjetPriorite,
  ProjetStatut,
  ProjetType,
} from '@erp/domains'

// Configuration API
const API_BASE_URL = process?.env?.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'

// Instance du client API
const _apiClient = new ERPApiClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Client API simple pour développement
export const api = {
  projets: {
    async getAll(filters?: ProjetFilters): Promise<Projet[]> {
      try {
        // Simulation d'appel API avec données mock
        await new Promise((resolve) => setTimeout(resolve, 100)) // Simulation délai réseau

        // Données mock pour développement avec types corrects
        const mockProjets: Projet[] = [
          {
            id: '1',
            reference: 'PRJ-2024-001',
            nom: 'Garde-corps Restaurant Le Gourmet',
            description: 'Installation garde-corps terrasse extérieure',
            clientId: 'client-1',
            responsableId: 'resp-1',
            commercialId: 'comm-1',
            equipeIds: [],
            statut: ProjetStatut.EN_COURS,
            type: ProjetType.STANDARD,
            priorite: ProjetPriorite.NORMALE,
            adresseLivraison: {
              rue: '123 Rue de la Paix',
              codePostal: '75001',
              ville: 'Paris',
              pays: 'France',
            },
            contact: {
              nom: 'Dupont',
              prenom: 'Jean',
              email: 'jean.dupont@restaurant.com',
              telephone: '0123456789',
            },
            delais: {
              dateDebut: new Date('2024-01-15'),
              dateFin: new Date('2024-02-15'),
            },
            montants: {
              montantHT: 15000,
              montantTTC: 18000,
              tauxTVA: 20,
            },
            documents: {
              plans: [],
              photos: [],
              certificats: [],
              rapports: [],
            },
            materiaux: [],
            operations: [],
            avancement: 65,
            tags: ['garde-corps', 'restaurant'],
            notes: 'Projet en cours, livraison prévue dans les temps',
            createdBy: 'user-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15'),
          },
          {
            id: '2',
            reference: 'PRJ-2024-002',
            nom: 'Escalier métallique Villa Moderne',
            description: 'Fabrication et installation escalier extérieur',
            clientId: 'client-2',
            responsableId: 'resp-2',
            commercialId: 'comm-2',
            equipeIds: [],
            statut: ProjetStatut.DEVIS,
            type: ProjetType.FABRICATION,
            priorite: ProjetPriorite.HAUTE,
            adresseLivraison: {
              rue: '789 Rue du Château',
              codePostal: '78100',
              ville: 'Saint-Germain-en-Laye',
              pays: 'France',
            },
            contact: {
              nom: 'Martin',
              prenom: 'Sophie',
              email: 'sophie.martin@villa.com',
              telephone: '0123456790',
            },
            delais: {
              dateDebut: new Date('2024-02-01'),
              dateFin: new Date('2024-03-01'),
            },
            montants: {
              montantHT: 25000,
              montantTTC: 30000,
              tauxTVA: 20,
            },
            documents: {
              plans: [],
              photos: [],
              certificats: [],
              rapports: [],
            },
            materiaux: [],
            operations: [],
            avancement: 0,
            tags: ['escalier', 'villa', 'haut-gamme'],
            notes: 'Projet haut de gamme, attention aux finitions',
            createdBy: 'user-2',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
          },
          {
            id: '3',
            reference: 'PRJ-2024-003',
            nom: 'Garde-corps Résidence Les Acacias',
            description: 'Installation garde-corps pour résidence neuve',
            clientId: 'client-3',
            responsableId: 'resp-3',
            commercialId: 'comm-3',
            equipeIds: [],
            statut: ProjetStatut.TERMINE,
            type: ProjetType.INSTALLATION,
            priorite: ProjetPriorite.NORMALE,
            adresseLivraison: {
              rue: '12 Rue des Acacias',
              codePostal: '92100',
              ville: 'Boulogne-Billancourt',
              pays: 'France',
            },
            contact: {
              nom: 'Leroy',
              prenom: 'Pierre',
              email: 'pierre.leroy@residence.com',
              telephone: '0123456791',
            },
            delais: {
              dateDebut: new Date('2023-12-01'),
              dateFin: new Date('2024-01-05'),
            },
            montants: {
              montantHT: 8500,
              montantTTC: 10200,
              tauxTVA: 20,
            },
            documents: {
              plans: [],
              photos: [],
              certificats: [],
              rapports: [],
            },
            materiaux: [],
            operations: [],
            avancement: 100,
            tags: ['garde-corps', 'résidence', 'terminé'],
            notes: 'Projet terminé avec succès, client satisfait',
            createdBy: 'user-3',
            createdAt: new Date('2023-11-15'),
            updatedAt: new Date('2024-01-05'),
          },
        ]

        // Application des filtres si fournis

        let filteredProjets = mockProjets

        if (filters) {
          if (filters.statut && filters?.statut?.length > 0) {
            filteredProjets = filteredProjets?.filter((p) => filters.statut?.includes(p.statut))
          }

          if (filters.priorite && filters?.priorite?.length > 0) {
            filteredProjets = filteredProjets?.filter((p) => filters.priorite?.includes(p.priorite))
          }

          if (filters.clientId) {
            filteredProjets = filteredProjets?.filter((p) => p.clientId === filters.clientId)
          }

          if (filters.dateDebutMin) {
            filteredProjets = filteredProjets?.filter(
              (p) =>
                p?.delais?.dateDebut &&
                filters.dateDebutMin &&
                p?.delais?.dateDebut >= filters.dateDebutMin
            )
          }

          if (filters.dateFinMax) {
            filteredProjets = filteredProjets?.filter(
              (p) =>
                p?.delais?.dateFin && filters.dateFinMax && p?.delais?.dateFin <= filters.dateFinMax
            )
          }

          if (filters.search) {
            const searchLower = filters?.search?.toLowerCase()

            filteredProjets = filteredProjets?.filter(
              (p) =>
                p?.reference?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower) ||
                p?.clientId?.toLowerCase().includes(searchLower)
            )
          }
        }

        return filteredProjets
      } catch (_error) {
        throw new Error('Impossible de récupérer les projets')
      }
    },

    async getById(id: string): Promise<Projet | null> {
      try {
        // Simulation d'appel API
        await new Promise((resolve) => setTimeout(resolve, 50))

        const projets = await this?.getAll()

        return projets?.find((p) => p.id === id) || null
      } catch (_error) {
        throw new Error('Impossible de récupérer le projet')
      }
    },

    async create(data: Partial<Projet>): Promise<Projet> {
      try {
        // Simulation d'appel API
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Simulation de création
        const newProjet: Projet = {
          id: Date.now().toString(),
          reference: `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          nom: data.nom || 'Nouveau projet',
          description: data.description || '',
          clientId: data.clientId || '',
          responsableId: data.responsableId || '',
          commercialId: data.commercialId,
          equipeIds: data.equipeIds || [],
          statut: data.statut || ProjetStatut.DEVIS,
          type: data.type || ProjetType.STANDARD,
          priorite: data.priorite || ProjetPriorite.NORMALE,
          adresseLivraison: data.adresseLivraison || {
            rue: '',
            codePostal: '',
            ville: '',
            pays: 'France',
          },
          contact: data.contact || {
            nom: '',
            prenom: '',
          },
          delais: data.delais || {
            dateDebut: new Date(),
            dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
          },
          montants: data.montants || {
            montantHT: 0,
            montantTTC: 0,
            tauxTVA: 20,
          },
          documents: data.documents || {
            plans: [],
            photos: [],
            certificats: [],
            rapports: [],
          },
          materiaux: data.materiaux || [],
          operations: data.operations || [],
          avancement: data.avancement ?? 0,
          tags: data.tags || [],
          notes: data.notes,
          createdBy: 'user-default',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        return newProjet
      } catch (_error) {
        throw new Error('Impossible de créer le projet')
      }
    },

    async update(id: string, data: Partial<Projet>): Promise<Projet> {
      try {
        // Simulation d'appel API
        await new Promise((resolve) => setTimeout(resolve, 150))

        const existingProjet = await this?.getById(id)

        if (!existingProjet) {
          throw new Error('Projet non trouvé')
        }

        const updatedProjet: Projet = {
          ...existingProjet,
          ...data,
          updatedAt: new Date(),
        }

        return updatedProjet
      } catch (_error) {
        throw new Error('Impossible de mettre à jour le projet')
      }
    },

    async delete(_id: string): Promise<void> {
      try {
        // Simulation d'appel API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (_error) {
        throw new Error('Impossible de supprimer le projet')
      }
    },
  },

  /**
   * Creates a context key for React Query or similar state management
   */
  createContextKey(domain: string, resource?: string, id?: string | number): string[] {
    const parts = [domain]

    if (resource) {
      parts?.push(resource)
    }

    if (id !== undefined) {
      parts?.push(String(id))
    }

    return parts
  },
}

// Export par défaut
export default api
