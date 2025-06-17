// packages/types/src/production.ts
import { BaseEntity } from './common'
import type { Projet } from './projet'
import { ProjetPriorite } from './projet'
import type { User } from './user'
import type { Stock } from './stock'

export enum OrdreFabricationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

export interface OrdreFabrication extends BaseEntity {
  numero: string
  projetId: string
  projet: Projet
  statut: OrdreFabricationStatut
  description: string
  priorite: ProjetPriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  notes?: string
  responsable?: User
  responsableId?: string
  taches: TacheFabrication[]
  materiaux: MateriauRequis[]
  coutMain: number
  coutMateriaux: number
  coutTotal: number
}

export interface MateriauRequis {
  stockId: string
  stock: Stock
  quantiteRequise: number
  quantiteUtilisee: number
  cout: number
}

export interface TacheFabrication extends BaseEntity {
  ordreFabricationId: string
  nom: string
  description?: string
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE'
  dureeEstimee: number
  dureeRealise?: number
  dateDebut?: Date
  dateFin?: Date
  responsable?: User
  responsableId?: string
  notes?: string
}
