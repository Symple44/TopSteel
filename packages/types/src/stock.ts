// packages/types/src/stock.ts
import type { BaseEntity, Unit } from './common'
import type { User } from './user'

export enum StockType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  CONSOMMABLE = 'CONSOMMABLE',
  OUTILLAGE = 'OUTILLAGE'
}

export interface Stock extends BaseEntity {
  reference: string
  designation: string
  description?: string
  type: StockType
  quantiteStock: number
  quantiteMin: number
  quantiteMax: number
  quantiteReservee: number
  unite: Unit
  prixAchat: number
  prixVente?: number
  fournisseur: string
  emplacement: string
  alerteStockBas: boolean
}

export interface MouvementStock extends BaseEntity {
  stockId: string
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'RESERVATION' | 'LIBERATION'
  quantite: number
  quantiteAvant: number
  quantiteApres: number
  motif: string
  reference?: string
  cout?: number
  utilisateur?: User
  utilisateurId?: string
}
