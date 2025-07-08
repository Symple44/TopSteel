// packages/types/src/stocks.ts
import type { BaseEntity } from './common'
import type { User } from './user'

export enum StockType {
  MATIERE_PREMIERE = 'matiere_premiere',
  PRODUIT_FINI = 'produit_fini',
  COMPOSANT = 'composant',
  CONSOMMABLE = 'consommable',
  OUTILLAGE = 'outillage',
}

export enum ChuteQualite {
  EXCELLENTE = 'EXCELLENTE',
  BONNE = 'BONNE',
  ACCEPTABLE = 'ACCEPTABLE',
  DEGRADEE = 'DEGRADEE',
}

export enum ChuteStatut {
  DISPONIBLE = 'DISPONIBLE',
  RESERVEE = 'RESERVEE',
  UTILISEE = 'UTILISEE',
  REBUT = 'REBUT',
}

export enum MouvementType {
  ENTREE = 'entree',
  SORTIE = 'sortie',
  TRANSFERT = 'transfert',
  AJUSTEMENT = 'ajustement',
  INVENTAIRE = 'inventaire',
}

export enum AlerteNiveau {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface Materiau extends BaseEntity {
  reference: string
  nom: string
  description?: string
  famille: string
  sousFamille?: string
  unite: string
  fournisseurId: string
  fournisseur: {
    nom: string
    reference?: string
  }
  stockActuel: number
  stockMinimum: number
  stockMaximum: number
  seuilAlerte: number
  prixAchatUnitaire: number
  prixVenteUnitaire?: number
  emplacement?: string
  dateLastInventaire?: Date
  statut: 'actif' | 'obsolete' | 'archive'
}

export interface MouvementStock extends BaseEntity {
  materiauId: string
  materiau: Materiau
  type: MouvementType
  quantite: number
  quantiteAvant: number
  quantiteApres: number
  prixUnitaire: number
  motif: string
  reference?: string
  utilisateurId: string
  utilisateur: User
  emplacementSource?: string
  emplacementDestination?: string
  documentsIds: string[]
  notes?: string
}

export interface Chute extends BaseEntity {
  materiauId: string
  materiau: Materiau
  reference: string
  dimensions: {
    longueur?: number
    largeur?: number
    epaisseur?: number
    diametre?: number
  }
  poids?: number
  qualite: ChuteQualite
  emplacement?: string
  origine: {
    type: 'production' | 'commande' | 'chantier'
    reference: string
  }
  utilisations: ChuteUtilisation[]
  valeurEstimee: number
  statut: ChuteStatut
  notes?: string
}

export interface ChuteUtilisation extends BaseEntity {
  chuteId: string
  projetId?: string
  ordreId?: string
  quantiteUtilisee: number
  notes?: string
}

export interface StockAlerte extends BaseEntity {
  materiauId: string
  materiau: Materiau
  type: 'stock_critique' | 'stock_zero' | 'peremption' | 'sur_stock'
  niveau: AlerteNiveau
  message: string
  dateTraitement?: Date
  statut: 'active' | 'traitee' | 'ignoree'
  actionRecommandee?: string
}

export interface OptimisationChute {
  chuteId: string
  chute: Chute
  utilisationsPossibles: {
    projetId: string
    projet: { nom: string; reference: string }
    quantiteRequise: number
    economie: number
    priorite: number
  }[]
  scoreOptimisation: number
}

// Requests
export interface CreateMaterialRequest {
  reference: string
  nom: string
  description?: string
  famille: string
  sousFamille?: string
  unite: string
  fournisseurId: string
  stockMinimum: number
  stockMaximum: number
  seuilAlerte: number
  prixAchatUnitaire: number
  emplacement?: string
}

export interface CreateMouvementRequest {
  materiauId: string
  type: MouvementType
  quantite: number
  prixUnitaire: number
  motif: string
  reference?: string
  emplacementSource?: string
  emplacementDestination?: string
  notes?: string
}

export interface StocksFilters {
  famille?: string[]
  statut?: string[]
  alertesOnly?: boolean
  emplacements?: string[]
  search?: string
}

export interface StocksStats {
  totalReferences: number
  valeurStock: number
  stockCritique: number
  tauxRotation: number
  valeurChutes: number
  tauxReutilisation: number
  economiesChutes: number
}
