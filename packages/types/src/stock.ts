// packages/types/src/stock.ts
export enum StockType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  CONSOMMABLE = 'CONSOMMABLE',
  OUTILLAGE = 'OUTILLAGE'
}

export enum StockStatut {
  ACTIF = 'ACTIF',
  OBSOLETE = 'OBSOLETE',
  QUARANTAINE = 'QUARANTAINE'
}

export interface Stock extends BaseEntity {
  reference: string
  designation: string
  description?: string
  type: StockType
  statut: StockStatut
  quantiteStock: number
  quantiteMin: number
  quantiteMax: number
  quantiteReservee: number
  unite: Unit
  prixAchat: number
  prixVente?: number
  fournisseur: string
  fournisseurRef?: string
  emplacement: string
  datePeremption?: Date
  dateLastInventaire?: Date
  isActif: boolean
}

export interface MouvementStock extends BaseEntity {
  stockId: string
  stock: Stock
  type: 'ENTREE' | 'SORTIE' | 'CORRECTION' | 'INVENTAIRE'
  quantite: number
  quantiteAvant: number
  quantiteApres: number
  motif: string
  reference?: string
  projetId?: string
  ordreId?: string
  utilisateurId: string
  utilisateur: User
}