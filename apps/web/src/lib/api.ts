// apps/web/src/lib/api.ts - Client API pour Zustand stores
import type { Client, ClientType, Projet, ProjetFilters } from '@erp/types'
import { ProjetPriorite, ProjetStatut, ProjetType } from '@erp/types'

// Configuration API
const _API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Client API simple pour développement
export const _api = {
  projets: {
    async getAll(filters?: ProjetFilters): Promise<Projet[]> {
      try {
        // Simulation d'appel API avec données mock
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulation délai réseau
        
        // Données mock pour développement avec types corrects
        const mockProjets: Projet[] = [
          {
            id: '1',
            reference: 'PRJ-2024-001',
            description: 'Garde-corps Restaurant Le Gourmet - Installation garde-corps terrasse extérieure',
            client: {
              id: 'client-1',
              nom: 'Restaurant Le Gourmet',
              type: 'PROFESSIONNEL' as ClientType,
              email: 'contact@legourmet.fr',
              telephone: '01 23 45 67 89',
              adresse: {
                rue: '123 Rue de la Paix',
                codePostal: '75001',
                ville: 'Paris',
                pays: 'France'
              },
              contact: {
                nom: 'Dubois',
                prenom: 'Pierre',
                email: 'p.dubois@legourmet.fr',
                telephone: '01 23 45 67 89',
                fonction: 'Gérant'
              },
              isActif: true,
              createdAt: new Date('2023-12-01'),
              updatedAt: new Date('2024-01-01'),
              siret: '12345678901234',
              notes: 'Client fidèle depuis 2023'
            },
            clientId: 'client-1',
            statut: ProjetStatut.EN_COURS,
            type: ProjetType.PORTAIL,
            priorite: ProjetPriorite.NORMALE,
            dateDebut: new Date('2024-01-15'),
            dateFin: new Date('2024-02-15'),
            dateFinPrevue: new Date('2024-02-10'),
            dateCreation: new Date('2024-01-01'),
            adresseChantier: {
              rue: '123 Rue de la Paix',
              codePostal: '75001',
              ville: 'Paris',
              pays: 'France'
            },
            montantHT: 15000,
            montantTTC: 18000,
            tauxTVA: 20,
            marge: 35,
            avancement: 65,
            notes: 'Projet en cours, livraison prévue dans les temps',
            documentsIds: [],
            ordresFabricationIds: [],
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15'),
          },
          {
            id: '2',
            reference: 'PRJ-2024-002',
            description: 'Escalier métallique Villa Moderne - Fabrication et installation escalier extérieur',
            client: {
              id: 'client-2',
              nom: 'Villa Moderne SARL',
              type: 'PROFESSIONNEL' as ClientType,
              email: 'contact@villamoderne.fr',
              telephone: '01 34 56 78 90',
              adresse: {
                rue: '456 Avenue des Jardins',
                codePostal: '78000',
                ville: 'Versailles',
                pays: 'France'
              },
              contact: {
                nom: 'Martin',
                prenom: 'Sophie',
                email: 's.martin@villamoderne.fr',
                telephone: '01 34 56 78 90',
                fonction: 'Architecte'
              },
              isActif: true,
              createdAt: new Date('2023-11-15'),
              updatedAt: new Date('2024-01-10'),
              siret: '98765432109876',
              notes: 'Spécialisé dans les villas de luxe'
            },
            clientId: 'client-2',
            statut: ProjetStatut.DEVIS,
            type: ProjetType.ESCALIER,
            priorite: ProjetPriorite.HAUTE,
            dateDebut: new Date('2024-02-01'),
            dateFin: new Date('2024-03-01'),
            dateFinPrevue: new Date('2024-02-28'),
            dateCreation: new Date('2024-01-10'),
            adresseChantier: {
              rue: '789 Rue du Château',
              codePostal: '78100',
              ville: 'Saint-Germain-en-Laye',
              pays: 'France'
            },
            montantHT: 25000,
            montantTTC: 30000,
            tauxTVA: 20,
            marge: 40,
            avancement: 0,
            notes: 'Projet haut de gamme, attention aux finitions',
            documentsIds: [],
            ordresFabricationIds: [],
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
          },
          {
            id: '3',
            reference: 'PRJ-2024-003',
            description: 'Garde-corps Résidence Les Acacias - Installation garde-corps pour résidence neuve',
            client: {
              id: 'client-3',
              nom: 'Bertrand',
              type: 'PARTICULIER' as ClientType,
              email: 'j.bertrand@email.com',
              telephone: '06 12 34 56 78',
              adresse: {
                rue: '12 Rue des Acacias',
                codePostal: '92100',
                ville: 'Boulogne-Billancourt',
                pays: 'France'
              },
              contact: {
                nom: 'Bertrand',
                prenom: 'Jacques',
                email: 'j.bertrand@email.com',
                telephone: '06 12 34 56 78',
                fonction: 'Propriétaire'
              },
              isActif: true,
              createdAt: new Date('2024-01-05'),
              updatedAt: new Date('2024-01-05'),
              notes: 'Premier projet avec ce client particulier'
            },
            clientId: 'client-3',
            statut: ProjetStatut.TERMINE,
            type: ProjetType.AUTRE,
            priorite: ProjetPriorite.NORMALE,
            dateDebut: new Date('2023-12-01'),
            dateFin: new Date('2024-01-05'),
            dateFinPrevue: new Date('2024-01-10'),
            dateCreation: new Date('2023-11-15'),
            adresseChantier: {
              rue: '12 Rue des Acacias',
              codePostal: '92100',
              ville: 'Boulogne-Billancourt',
              pays: 'France'
            },
            montantHT: 8500,
            montantTTC: 10200,
            tauxTVA: 20,
            marge: 30,
            avancement: 100,
            notes: 'Projet terminé avec succès, client satisfait',
            documentsIds: [],
            ordresFabricationIds: [],
            createdAt: new Date('2023-11-15'),
            updatedAt: new Date('2024-01-05'),
          }
        ]

        // Application des filtres si fournis
        const _filteredProjets = mockProjets

        if (filters) {
          if (filters.statut && filters.statut.length > 0) {
            filteredProjets = filteredProjets.filter(p => 
              filters.statut?.includes(p.statut)
            )
          }

          if (filters.priorite && filters.priorite.length > 0) {
            filteredProjets = filteredProjets.filter(p => 
              filters.priorite?.includes(p.priorite)
            )
          }

          if (filters.clientId) {
            filteredProjets = filteredProjets.filter(p => 
              p.clientId === filters.clientId
            )
          }

          if (filters.dateDebut) {
            filteredProjets = filteredProjets.filter(p => 
              p.dateDebut && p.dateDebut >= filters.dateDebut!
            )
          }

          if (filters.dateFin) {
            filteredProjets = filteredProjets.filter(p => 
              p.dateFin && p.dateFin <= filters.dateFin!
            )
          }

          if (filters.search) {
            const _searchLower = filters.search.toLowerCase()

            filteredProjets = filteredProjets.filter(p => 
              p.reference.toLowerCase().includes(searchLower) ||
              p.description?.toLowerCase().includes(searchLower) ||
              p.client.nom.toLowerCase().includes(searchLower)
            )
          }
        }

        return filteredProjets
      } catch (error) {
        console.error('Erreur lors de la récupération des projets:', error)
        throw new Error('Impossible de récupérer les projets')
      }
    },

    async getById(id: string): Promise<Projet | null> {
      try {
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 50))
        
        const _projets = await this.getAll()

        return projets.find(p => p.id === id) || null
      } catch (error) {
        console.error('Erreur lors de la récupération du projet:', error)
        throw new Error('Impossible de récupérer le projet')
      }
    },

    async create(data: Partial<Projet>): Promise<Projet> {
      try {
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Simulation de création
        const newProjet: Projet = {
          id: Date.now().toString(),
          reference: `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
          description: data.description || 'Nouveau projet',
          clientId: data.clientId || '',
          statut: data.statut || ProjetStatut.DEVIS,
          type: data.type || ProjetType.AUTRE,
          priorite: data.priorite || ProjetPriorite.NORMALE,
          dateDebut: data.dateDebut || new Date(),
          dateCreation: new Date(),
          adresseChantier: data.adresseChantier || {
            rue: '',
            codePostal: '',
            ville: '',
            pays: 'France'
          },
          montantHT: data.montantHT || 0,
          montantTTC: data.montantTTC || 0,
          tauxTVA: data.tauxTVA || 20,
          marge: data.marge || 30,
          avancement: 0,
          documentsIds: [],
          ordresFabricationIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          // Note: Le client serait récupéré via une autre API en réalité
          client: {} as Client // À compléter selon les besoins
        }

        return newProjet
      } catch (error) {
        console.error('Erreur lors de la création du projet:', error)
        throw new Error('Impossible de créer le projet')
      }
    },

    async update(id: string, data: Partial<Projet>): Promise<Projet> {
      try {
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 150))
        
        const _existingProjet = await this.getById(id)

        if (!existingProjet) {
          throw new Error('Projet non trouvé')
        }

        const updatedProjet: Projet = {
          ...existingProjet,
          ...data,
          updatedAt: new Date()
        }

        return updatedProjet
      } catch (error) {
        console.error('Erreur lors de la mise à jour du projet:', error)
        throw new Error('Impossible de mettre à jour le projet')
      }
    },

    async delete(id: string): Promise<void> {
      try {
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // En réalité, on ferait l'appel DELETE à l'API
        console.log(`Projet ${id} supprimé`)
      } catch (error) {
        console.error('Erreur lors de la suppression du projet:', error)
        throw new Error('Impossible de supprimer le projet')
      }
    }
  }
}

// Export par défaut
export default api
