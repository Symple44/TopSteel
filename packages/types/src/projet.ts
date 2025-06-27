// packages/types/src/projet.ts
import type { Client } from './client'
import type { Address, BaseEntity } from './common'
import type { User } from './user'

export enum ProjetStatut {
  BROUILLON = 'brouillon',
  DEVIS = 'devis',
  EN_ATTENTE = 'en_attente',
  ACCEPTE = 'accepte',
  EN_COURS = 'en_cours',
  EN_PAUSE = 'en_pause',
  TERMINE = 'termine',
  ANNULE = 'annule',
  FACTURE = 'facture'
}

export enum ProjetType {
  PORTAIL = 'PORTAIL',
  CLOTURE = 'CLOTURE',
  ESCALIER = 'ESCALIER',
  RAMPE = 'RAMPE',
  VERRIERE = 'VERRIERE',
  STRUCTURE = 'STRUCTURE',
  BARDAGE = 'BARDAGE',
  COUVERTURE = 'COUVERTURE',
  CHARPENTE = 'CHARPENTE',
  PHOTOVOLTAIQUE = 'PHOTOVOLTAIQUE',
  AUTRE = 'AUTRE'
}

export enum ProjetPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

export interface Projet extends BaseEntity {
  reference: string
  description: string
  client: Client
  clientId: string
  statut: ProjetStatut
  type: ProjetType
  priorite: ProjetPriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  dateCreation: Date
  adresseChantier: Address
  montantHT: number
  montantTTC: number
  tauxTVA: number
  marge: number
  avancement: number
  notes?: string
  alertes?: string[]
  responsable?: User
  responsableId?: string
  devis?: any
  documents?: any[]
  documentsIds: string[]
  ordresFabricationIds: string[]
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

