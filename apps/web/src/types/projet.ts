// Types pour les projets TopSteel
export interface Projet {
  id: string;
  nom: string;
  description?: string;
  statut: 'actif' | 'en_pause' | 'termine' | 'annule';
  dateCreation: Date;
  dateModification: Date;
  clientId?: string;
  budget?: number;
  progression?: number;
  responsable?: string;
  equipe?: string[];
  tags?: string[];
  priorite?: 'basse' | 'normale' | 'haute' | 'critique';
  echeance?: Date;
  documents?: string[];
  commentaires?: string;
}

export interface CreateProjetRequest {
  nom: string;
  description?: string;
  clientId?: string;
  budget?: number;
  responsable?: string;
  echeance?: Date;
  priorite?: Projet['priorite'];
}

export interface UpdateProjetRequest {
  nom?: string;
  description?: string;
  statut?: Projet['statut'];
  budget?: number;
  progression?: number;
  responsable?: string;
  echeance?: Date;
  priorite?: Projet['priorite'];
  commentaires?: string;
}

export interface ProjetFilters {
  statut?: Projet['statut'][];
  responsable?: string;
  priorite?: Projet['priorite'][];
  dateDebut?: Date;
  dateFin?: Date;
  clientId?: string;
  search?: string;
}

export type ProjetStatut = Projet['statut'];
export type ProjetPriorite = Projet['priorite'];
