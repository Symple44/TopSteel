// packages/types/src/devis.ts
import { BaseEntity, Unit } from './common'
import type { Projet } from './projet'
import type { Client } from './client'

export enum DevisStatut {
  BROUILLON = 'BROUILLON',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE'
}

export interface LigneDevis {
  id: string
  designation: string
  description?: string
  quantite: number
  unite: Unit
  prixUnitaireHT: number
  totalHT: number
  tauxTVA: number
  totalTTC: number
}

export interface Devis extends BaseEntity {
  numero: string
  projetId: string
  projet: Projet
  clientId: string
  client: Client
  statut: DevisStatut
  dateValidite: Date
  dateEnvoi?: Date
  dateAcceptation?: Date
  lignes: LigneDevis[]
  totalHT: number
  totalTVA: number
  totalTTC: number
  conditions?: string
  notes?: string
  remise?: number
  acompte?: number
  delaiLivraison?: string
}
