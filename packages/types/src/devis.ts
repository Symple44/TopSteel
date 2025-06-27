// packages/types/src/devis.ts
import type { BaseEntity } from './common'

export enum DevisStatut {
  BROUILLON = 'BROUILLON',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE'
}

export interface Devis extends BaseEntity {
  numero: string
  projetId: string
  clientId: string
  statut: DevisStatut
  dateValidite: Date
  totalHT: number
  totalTTC: number
}
