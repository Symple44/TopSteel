// packages/types/src/projet.ts
import type { BaseEntity, Address } from './common'
import type { Client } from './client'
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
