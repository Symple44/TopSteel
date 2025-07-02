// apps/web/src/lib/api.ts - Client API pour Zustand stores
import type { Projet, ProjetFilters } from '@erp/types'

// Configuration API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Client API simple pour développement
export const api = {
  projets: {
    async getAll(filters?: ProjetFilters): Promise<Projet[]> {
      try {
        // Simulation d'appel API avec données mock
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulation délai réseau
        
        // Données mock pour développement
        const mockProjets: Projet[] = [
          {
            id: '1',
            reference: 'PRJ-2024-001',
            nom: 'Garde-corps Restaurant Le Gourmet',
            description: 'Installation garde-corps terrasse extérieure',
            client: {
              id: 'client-1',
              nom: 'Restaurant Le Gourmet',
              email: 'contact@legourmet.fr',
              telephone: '01 23 45 67 89',
              adresse: {
                rue: '123 Rue de la Paix',
                codePostal: '75001',
                ville: 'Paris',
                pays: 'France'
              }
            },
            clientId: 'client-1',
            statut: 'en_cours' as any,
            type: 'PORTAIL' as any,
            priorite: 'NORMALE' as any,
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
            updatedAt: new Date('2024-01-20')
          },
          {
            id: '2',
            reference: 'PRJ-2024-002',
            nom: 'Escalier Métallique Hôtel Royal',
            description: 'Fabrication et installation escalier principal',
            client: {
              id: 'client-2',
              nom: 'Hôtel Royal',
              email: 'direction@hotelroyal.fr',
              telephone: '01 98 76 54 32',
              adresse: {
                rue: '456 Avenue des Champs',
                codePostal: '75008',
                ville: 'Paris',
                pays: 'France'
              }
            },
            clientId: 'client-2',
            statut: 'devis' as any,
            type: 'ESCALIER' as any,
            priorite: 'HAUTE' as any,
            dateCreation: new Date('2024-01-10'),
            adresseChantier: {
              rue: '456 Avenue des Champs',
              codePostal: '75008',
              ville: 'Paris',
              pays: 'France'
            },
            montantHT: 25000,
            montantTTC: 30000,
            tauxTVA: 20,
            marge: 40,
            avancement: 15,
            notes: 'Devis en attente de validation client',
            documentsIds: [],
            ordresFabricationIds: [],
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-15')
          },
          {
            id: '3',
            reference: 'PRJ-2024-003',
            nom: 'Structure Hangar Agricole',
            description: 'Charpente métallique pour hangar de stockage',
            client: {
              id: 'client-3',
              nom: 'EARL Dubois',
              email: 'earl.dubois@gmail.com',
              telephone: '02 45 67 89 01',
              adresse: {
                rue: '789 Route de la Ferme',
                codePostal: '28000',
                ville: 'Chartres',
                pays: 'France'
              }
            },
            clientId: 'client-3',
            statut: 'termine' as any,
            type: 'STRUCTURE' as any,
            priorite: 'NORMALE' as any,
            dateDebut: new Date('2023-11-01'),
            dateFin: new Date('2023-12-15'),
            dateFinPrevue: new Date('2023-12-10'),
            dateCreation: new Date('2023-10-15'),
            adresseChantier: {
              rue: '789 Route de la Ferme',
              codePostal: '28000',
              ville: 'Chartres',
              pays: 'France'
            },
            montantHT: 45000,
            montantTTC: 54000,
            tauxTVA: 20,
            marge: 30,
            avancement: 100,
            notes: 'Projet terminé avec succès, client satisfait',
            documentsIds: [],
            ordresFabricationIds: [],
            createdAt: new Date('2023-10-15'),
            updatedAt: new Date('2023-12-15')
          }
        ]
        
        // Appliquer les filtres si fournis
        let filteredProjets = mockProjets
        
        if (filters) {
          if (filters.statut && filters.statut.length > 0) {
            filteredProjets = filteredProjets.filter(p => filters.statut!.includes(p.statut))
          }
          
          if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            filteredProjets = filteredProjets.filter(p => 
              p.reference.toLowerCase().includes(searchLower) ||
              p.nom.toLowerCase().includes(searchLower) ||
              p.client.nom.toLowerCase().includes(searchLower)
            )
          }
          
          if (filters.clientId) {
            filteredProjets = filteredProjets.filter(p => p.clientId === filters.clientId)
          }
        }
        
        return filteredProjets
      } catch (error) {
        console.error('Erreur API projets:', error)
        return []
      }
    },
    
    async getById(id: string): Promise<Projet | null> {
      const projets = await this.getAll()
      return projets.find(p => p.id === id) || null
    },
    
    async create(projet: Partial<Projet>): Promise<Projet> {
      // Simulation création projet
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const newProjet: Projet = {
        id: Date.now().toString(),
        reference: `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        nom: projet.nom || 'Nouveau Projet',
        description: projet.description || '',
        client: projet.client || {} as any,
        clientId: projet.clientId || '',
        statut: 'brouillon' as any,
        type: projet.type || 'AUTRE' as any,
        priorite: projet.priorite || 'NORMALE' as any,
        dateCreation: new Date(),
        adresseChantier: projet.adresseChantier || {} as any,
        montantHT: projet.montantHT || 0,
        montantTTC: projet.montantTTC || 0,
        tauxTVA: projet.tauxTVA || 20,
        marge: projet.marge || 0,
        avancement: 0,
        documentsIds: [],
        ordresFabricationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...projet
      }
      
      return newProjet
    }
  }
}

// Export par défaut pour compatibilité
export default api

