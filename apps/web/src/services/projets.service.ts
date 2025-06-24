// Service de gestion des projets TopSteel
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
  static async getProjets(): Promise<ProjetData[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...projetsDB]), 500);
    });
  }

  static async getProjetById(id: string): Promise<ProjetData | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projet = projetsDB.find(p => p.id === id) || null;
        resolve(projet);
      }, 300);
    });
  }

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
}

// UN SEUL export pour éviter la duplication
export const projetsService = ProjetsService;
export default ProjetsService;
