/**
 * Type de mouvement de stock
 */
export enum StockMovementType {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  TRANSFERT = 'TRANSFERT',
  INVENTAIRE = 'INVENTAIRE',
  CORRECTION_POSITIVE = 'CORRECTION_POSITIVE',
  CORRECTION_NEGATIVE = 'CORRECTION_NEGATIVE',
  RETOUR = 'RETOUR',
  RESERVATION = 'RESERVATION',
  LIBERATION = 'LIBERATION',
}

/**
 * Priorité du mouvement
 */
export enum StockMovementPriority {
  FAIBLE = 'FAIBLE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE',
}

/**
 * Motif du mouvement de stock
 */
export enum StockMovementMotif {
  // Entrées
  ACHAT = 'ACHAT',
  PRODUCTION = 'PRODUCTION',
  RETOUR_CLIENT = 'RETOUR_CLIENT',
  CORRECTION_INVENTAIRE = 'CORRECTION_INVENTAIRE',
  
  // Sorties
  VENTE = 'VENTE',
  CONSOMMATION = 'CONSOMMATION',
  RETOUR_FOURNISSEUR = 'RETOUR_FOURNISSEUR',
  PERTE = 'PERTE',
  VOL = 'VOL',
  
  // Transferts
  TRANSFERT_DEPOT = 'TRANSFERT_DEPOT',
  TRANSFERT_SERVICE = 'TRANSFERT_SERVICE',
  
  // Autres
  INVENTAIRE = 'INVENTAIRE',
  AUTRE = 'AUTRE',
}

/**
 * Motif du mouvement de stock (legacy - à supprimer)
 */
export enum StockMovementReason {
  // Entrées
  ACHAT = 'ACHAT',
  PRODUCTION = 'PRODUCTION',
  RETOUR_CLIENT = 'RETOUR_CLIENT',
  CORRECTION_POSITIVE = 'CORRECTION_POSITIVE',
  INVENTAIRE_POSITIF = 'INVENTAIRE_POSITIF',
  
  // Sorties
  VENTE = 'VENTE',
  CONSOMMATION = 'CONSOMMATION',
  RETOUR_FOURNISSEUR = 'RETOUR_FOURNISSEUR',
  CORRECTION_NEGATIVE = 'CORRECTION_NEGATIVE',
  INVENTAIRE_NEGATIF = 'INVENTAIRE_NEGATIF',
  PERTE_DETERIORATION = 'PERTE_DETERIORATION',
  VOL = 'VOL',
  
  // Transferts
  TRANSFERT_DEPOT = 'TRANSFERT_DEPOT',
  TRANSFERT_SERVICE = 'TRANSFERT_SERVICE',
  
  // Autres
  AUTRE = 'AUTRE',
}

/**
 * Statut du mouvement de stock
 */
export enum StockMovementStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  COMPLETE = 'COMPLETE',
  ANNULE = 'ANNULE',
  EN_COURS = 'EN_COURS',
  VALIDE = 'VALIDE',
}

/**
 * Interface pour un mouvement de stock
 */
export interface IStockMovement {
  /** Identifiant unique du mouvement */
  id: string

  /** Référence unique du mouvement */
  reference: string

  /** ID de l'article concerné */
  articleId: string

  /** Code article pour référence rapide */
  articleCode?: string

  /** Libellé de l'article pour référence rapide */
  articleLibelle?: string

  /** Type de mouvement */
  type: StockMovementType

  /** Motif du mouvement */
  motif: StockMovementReason

  /** Quantité du mouvement (positive pour entrée, négative pour sortie) */
  quantite: number

  /** Unité de mesure */
  unite: string

  /** Stock avant le mouvement */
  stockAvant: number

  /** Stock après le mouvement */
  stockApres: number

  /** Prix unitaire au moment du mouvement */
  prixUnitaire?: number

  /** Valeur totale du mouvement */
  valeurTotale?: number

  /** Devise */
  devise?: string

  /** Date du mouvement */
  dateMovement: Date

  /** Numéro de lot si applicable */
  numeroLot?: string

  /** Date de péremption si applicable */
  datePeremption?: Date

  /** Emplacement source */
  emplacementSource?: string

  /** Emplacement destination */
  emplacementDestination?: string

  /** ID du document source (commande, facture, etc.) */
  documentSourceId?: string

  /** Type de document source */
  typeDocumentSource?: string

  /** Numéro du document source */
  numeroDocumentSource?: string

  /** ID de l'utilisateur qui a effectué le mouvement */
  utilisateurId: string

  /** Nom de l'utilisateur pour référence rapide */
  utilisateurNom?: string

  /** Statut du mouvement */
  status: StockMovementStatus

  /** Notes ou commentaires */
  notes?: string

  /** Métadonnées additionnelles */
  metadonnees?: Record<string, unknown>

  /** Date de création de l'enregistrement */
  dateCreation: Date

  /** Date de dernière modification */
  dateModification?: Date

  /** Validation du mouvement */
  dateValidation?: Date

  /** ID de l'utilisateur qui a validé */
  validateurId?: string

  /** Nom du validateur pour référence rapide */
  validateurNom?: string
}

/**
 * Interface pour les filtres de recherche des mouvements
 */
export interface IStockMovementFilters {
  /** Filtrer par article */
  articleIds?: string[]

  /** Filtrer par code article */
  articleCodes?: string[]

  /** Filtrer par type de mouvement */
  types?: StockMovementType[]

  /** Filtrer par motif */
  motifs?: StockMovementReason[]

  /** Filtrer par statut */
  status?: StockMovementStatus[]

  /** Filtrer par période */
  dateDebut?: Date
  dateFin?: Date

  /** Filtrer par utilisateur */
  utilisateurIds?: string[]

  /** Filtrer par emplacement */
  emplacements?: string[]

  /** Filtrer par document source */
  documentSourceIds?: string[]
  typeDocumentSource?: string

  /** Filtrer par lot */
  numeroLot?: string

  /** Recherche textuelle */
  recherche?: string

  /** Quantité minimum */
  quantiteMin?: number

  /** Quantité maximum */
  quantiteMax?: number

  /** Valeur minimum */
  valeurMin?: number

  /** Valeur maximum */
  valeurMax?: number

  /** Priorité */
  priorite?: StockMovementPriority

  /** Pagination */
  page?: number
  limit?: number

  /** Tri */
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Interface pour les options de tri des mouvements
 */
export interface IStockMovementSortOptions {
  /** Champ de tri */
  champ: 'dateMovement' | 'reference' | 'articleCode' | 'quantite' | 'valeurTotale' | 'utilisateurNom'

  /** Direction du tri */
  direction: 'ASC' | 'DESC'
}

/**
 * Interface pour la pagination des mouvements
 */
export interface IStockMovementPagination {
  /** Page actuelle (commence à 1) */
  page: number

  /** Nombre d'éléments par page */
  limite: number

  /** Options de tri */
  tri?: IStockMovementSortOptions[]
}

/**
 * Interface pour le résultat paginé des mouvements
 */
export interface IStockMovementPageResult {
  /** Liste des mouvements */
  mouvements: IStockMovement[]

  /** Nombre total d'éléments */
  total: number

  /** Page actuelle */
  page: number

  /** Nombre d'éléments par page */
  limite: number

  /** Nombre total de pages */
  totalPages: number

  /** Y a-t-il une page suivante */
  hasNext: boolean

  /** Y a-t-il une page précédente */
  hasPrevious: boolean
}

/**
 * Interface pour la création d'un mouvement de stock
 */
export interface ICreateStockMovement {
  /** ID de l'article concerné */
  articleId: string

  /** Type de mouvement */
  type: StockMovementType

  /** Motif du mouvement */
  motif: StockMovementReason

  /** Quantité du mouvement */
  quantite: number

  /** Prix unitaire optionnel */
  prixUnitaire?: number

  /** Date du mouvement (par défaut maintenant) */
  dateMovement?: Date

  /** Numéro de lot si applicable */
  numeroLot?: string

  /** Date de péremption si applicable */
  datePeremption?: Date

  /** Emplacement destination */
  emplacementDestination?: string

  /** ID du document source */
  documentSourceId?: string

  /** Type de document source */
  typeDocumentSource?: string

  /** Numéro du document source */
  numeroDocumentSource?: string

  /** Notes ou commentaires */
  notes?: string

  /** Métadonnées additionnelles */
  metadonnees?: Record<string, unknown>
}

/**
 * Interface pour la mise à jour d'un mouvement de stock
 */
export interface IUpdateStockMovement {
  /** Motif du mouvement */
  motif?: StockMovementReason

  /** Prix unitaire */
  prixUnitaire?: number

  /** Date du mouvement */
  dateMovement?: Date

  /** Numéro de lot */
  numeroLot?: string

  /** Date de péremption */
  datePeremption?: Date

  /** Emplacement destination */
  emplacementDestination?: string

  /** Notes ou commentaires */
  notes?: string

  /** Métadonnées additionnelles */
  metadonnees?: Record<string, unknown>
}