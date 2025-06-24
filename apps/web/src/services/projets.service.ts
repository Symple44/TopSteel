// Service de gestion des projets
import { Projet } from '@/types/projet';

// Interface pour les projets
export interface ProjetData {
  id: string;
  nom: string;
  description?: string;
  statut: 'actif' | 'en_pause' | 'termine' | 'annule';
  dateCreation: Date;
  dateModification: Date;
  clientId?: string;
}

// Simulation d'une base de données temporaire
const projetsDB: ProjetData[] = [
  {
    id: '1',
    nom: 'Projet Demo',
    description: 'Projet de démonstration',
    statut: 'actif',
    dateCreation: new Date(),
    dateModification: new Date(),
    clientId: '1'
  }
];

// Service des projets
export class ProjetsService {
  // Récupérer tous les projets
  static async getProjets(): Promise<ProjetData[]> {
    // Simulation d'une requête API
    return new Promise((resolve) => {
      setTimeout(() => resolve([...projetsDB]), 500);
    });
  }

  // Récupérer un projet par ID
  static async getProjetById(id: string): Promise<ProjetData | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projet = projetsDB.find(p => p.id === id) || null;
        resolve(projet);
      }, 300);
    });
  }

  // Créer un nouveau projet
  static async createProjet(projetData: Omit<ProjetData, 'id' | 'dateCreation' | 'dateModification'>): Promise<ProjetData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const nouveauProjet: ProjetData = {
          ...projetData,
          id: (projetsDB.length + 1).toString(),
          dateCreation: new Date(),
          dateModification: new Date()
        };
        projetsDB.push(nouveauProjet);
        resolve(nouveauProjet);
      }, 400);
    });
  }

  // Mettre à jour un projet
  static async updateProjet(id: string, updates: Partial<Omit<ProjetData, 'id' | 'dateCreation'>>): Promise<ProjetData | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = projetsDB.findIndex(p => p.id === id);
        if (index === -1) {
          resolve(null);
          return;
        }
        
        projetsDB[index] = {
          ...projetsDB[index],
          ...updates,
          dateModification: new Date()
        };
        resolve(projetsDB[index]);
      }, 400);
    });
  }

  // Supprimer un projet
  static async deleteProjet(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = projetsDB.findIndex(p => p.id === id);
        if (index === -1) {
          resolve(false);
          return;
        }
        
        projetsDB.splice(index, 1);
        resolve(true);
      }, 300);
    });
  }

  // Récupérer les projets par statut
  static async getProjetsByStatut(statut: ProjetData['statut']): Promise<ProjetData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projets = projetsDB.filter(p => p.statut === statut);
        resolve(projets);
      }, 400);
    });
  }

  // Rechercher des projets
  static async searchProjets(query: string): Promise<ProjetData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projets = projetsDB.filter(p => 
          p.nom.toLowerCase().includes(query.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
        );
        resolve(projets);
      }, 350);
    });
  }
}

// Export par défaut
export default ProjetsService;
