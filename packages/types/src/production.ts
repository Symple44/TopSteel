// packages/types/src/production.ts
import type { BaseEntity } from './common'


export enum StatutProduction {
  EN_ATTENTE = 'EN_ATTENTE',
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  PAUSE = 'PAUSE'
}

export enum PrioriteProduction {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

export interface OrdreFabrication extends BaseEntity {
  numero: string
  projetId: string
  statut: StatutProduction
  description: string
  priorite: PrioriteProduction
  dateDebut?: Date
  dateFin?: Date
  notes?: string
  responsableId?: string
}

export interface TacheFabrication extends BaseEntity {
  ordreFabricationId: string
  nom: string
  description?: string
  statut: StatutProduction
  dureeEstimee: number
  dateDebut?: Date
  dateFin?: Date
  responsableId?: string
}
