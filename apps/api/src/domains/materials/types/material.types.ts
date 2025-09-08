import type {
  MaterialShape,
  MaterialStatus,
  MaterialType,
  StorageMethod,
} from '../entities/material.entity'

/**
 * Interfaces pour les critères de recherche et statistiques
 */
export interface MaterialSearchCriteria {
  type?: MaterialType[]
  forme?: MaterialShape[]
  status?: MaterialStatus[]
  nuance?: string[]
  nom?: string
  reference?: string
  marque?: string
  fournisseurId?: string
  stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  dangereux?: boolean
  obsolete?: boolean
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface MaterialStockValorisation {
  nombreMateriaux: number
  valeurTotale: number
  valeurParType: Record<MaterialType, number>
  valeurParForme: Record<MaterialShape, number>
  materialsSansStock: number
  materialsEnRupture: number
  materialsSousStockMini: number
  materialsStockageSpecial: number
  materialsDangereux: number
}

export interface MaterialStatistics {
  totalMateriaux: number
  repartitionParType: Record<MaterialType, number>
  repartitionParForme: Record<MaterialShape, number>
  repartitionParStatus: Record<MaterialStatus, number>
  repartitionParStockage: Record<StorageMethod, number>
  valeurTotaleStock: number
  materialsEnRupture: number
  materialsSousStockMini: number
  materialsObsoletes: number
  materialsDangereux: number
  materialsStockageSpecial: number
}

/**
 * Filtres avancés pour la recherche de matériaux
 */
export interface MaterialAdvancedFilters extends MaterialSearchCriteria {
  // Critères de base
  types?: MaterialType[]
  formes?: MaterialShape[]
  status?: MaterialStatus[]
  nuances?: string[]

  // Critères de stock
  stock?: {
    min?: number
    max?: number
    disponible?: number
    enRupture?: boolean
    sousStockMinimum?: boolean
  }
  stockMin?: number
  stockMax?: number
  stockDisponibleMin?: number
  stockDisponibleMax?: number
  avecStock?: boolean
  sansStock?: boolean

  // Critères de prix
  prix?: {
    min?: number
    max?: number
  }
  prixMin?: number
  prixMax?: number

  // Critères physiques
  poids?: {
    min?: number
    max?: number
  }
  poidsMin?: number
  poidsMax?: number
  densiteMin?: number
  densiteMax?: number

  // Critères de dimensions
  dimensions?: {
    longueurMin?: number
    longueurMax?: number
    largeurMin?: number
    largeurMax?: number
    epaisseurMin?: number
    epaisseurMax?: number
    diametreMin?: number
    diametreMax?: number
  }
  longueurMin?: number
  longueurMax?: number
  largeurMin?: number
  largeurMax?: number
  epaisseurMin?: number
  epaisseurMax?: number
  diametreMin?: number
  diametreMax?: number

  // Critères de dates
  dateCreationMin?: Date
  dateCreationMax?: Date
  dateDernierMouvementMin?: Date
  dateDernierMouvementMax?: Date
  dateDernierInventaireMin?: Date
  dateDernierInventaireMax?: Date

  // Critères spéciaux
  stockageSpecial?: boolean
  dangereux?: boolean
  obsolete?: boolean
  enRupture?: boolean
  sousStockMini?: boolean
  fournisseurPrefere?: boolean

  // Critères de recherche textuelle
  recherche?: string
  searchText?: string
  searchFields?: MaterialSearchField[]

  // Critères de tri
  tri?: {
    champ?: string
    ordre?: 'ASC' | 'DESC'
  }
  sortBy?: MaterialSortField
  sortOrder?: 'ASC' | 'DESC'

  // Critères de pagination
  pagination?: {
    page?: number
    limite?: number
  }

  // Critères d'inclusion
  includeInactive?: boolean
  includeObsolete?: boolean

  // Critères de certifications
  certifications?: string[]
  normes?: string[]

  // Critères de fournisseurs
  fournisseurs?: string[]

  // Critères de propriétés
  proprietesMecaniques?: MechanicalPropertiesFilters
  proprietesPhysiques?: PhysicalPropertiesFilters
  proprietesChimiques?: ChemicalPropertiesFilters

  // Motifs de mouvement
  motifs?: string[]
  priorite?: string
}

export enum MaterialSearchField {
  REFERENCE = 'reference',
  NOM = 'nom',
  DESCRIPTION = 'description',
  NUANCE = 'nuance',
  QUALITE = 'qualite',
  MARQUE = 'marque',
  MODELE = 'modele',
}

export enum MaterialSortField {
  REFERENCE = 'reference',
  NOM = 'nom',
  TYPE = 'type',
  FORME = 'forme',
  NUANCE = 'nuance',
  STOCK_PHYSIQUE = 'stockPhysique',
  STOCK_DISPONIBLE = 'stockDisponible',
  PRIX_UNITAIRE = 'prixUnitaire',
  VALEUR_STOCK = 'valeurStock',
  DATE_CREATION = 'dateCreationFiche',
  DATE_DERNIER_MOUVEMENT = 'dateDerniereSortie',
  DATE_DERNIER_INVENTAIRE = 'dateDernierInventaire',
}

/**
 * Filtres pour les propriétés mécaniques
 */
export interface MechanicalPropertiesFilters {
  limiteElastiqueMin?: number
  limiteElastiqueMax?: number
  resistanceMin?: number
  resistanceMax?: number
  resistanceTractionMin?: number
  resistanceTractionMax?: number
  dureteMin?: number
  dureteMax?: number
  moduleElasticiteMin?: number
  moduleElasticiteMax?: number
  resilienceMin?: number
  resilienceMax?: number
  allongementMin?: number
  allongementMax?: number
}

/**
 * Filtres pour les propriétés physiques
 */
export interface PhysicalPropertiesFilters {
  densiteMin?: number
  densiteMax?: number
  pointFusionMin?: number
  pointFusionMax?: number
  temperatureFusionMin?: number
  temperatureFusionMax?: number
  conductiviteThermique?: {
    min?: number
    max?: number
  }
  conductiviteElectrique?: {
    min?: number
    max?: number
  }
}

/**
 * Filtres pour les propriétés chimiques
 */
export interface ChemicalPropertiesFilters {
  composition?: Record<string, { min?: number; max?: number }>
  resistanceCorrosion?: string
  traitementThermique?: string[]
  traitementSurface?: string[]
}

/**
 * Résultat de recherche avec métadonnées
 */
export interface MaterialSearchResult {
  items: unknown[] // Material[]
  total: number
  page: number
  limit: number
  filters: MaterialAdvancedFilters
  aggregations?: {
    parType: Record<MaterialType, number>
    parForme: Record<MaterialShape, number>
    parStatus: Record<MaterialStatus, number>
    stockTotal: number
    valeurTotale: number
    repartitionStockage: Record<StorageMethod, number>
  }
}

/**
 * Interface pour les alertes de stock spécifiques aux matériaux
 */
export interface MaterialStockAlert {
  materialId: string
  reference: string
  nom: string
  type: 'RUPTURE' | 'SOUS_STOCK_MINI' | 'SURSTOCKAGE' | 'PEREMPTION' | 'STOCKAGE_SPECIAL'
  niveau: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  stockActuel: number
  stockMini?: number
  stockMaxi?: number
  quantiteACommander?: number
  delaiApprovisionnement?: string
  emplacement?: string
  methodeStockage?: StorageMethod
  dangereux?: boolean
  dateAlerte: Date
}

/**
 * Interface pour l'analyse de compatibilité
 */
export interface MaterialCompatibilityAnalysis {
  materialId: string
  compatibleMaterials: Array<{
    materialId: string
    reference: string
    nom: string
    scoreCompatibilite: number // 0-100
    raisons: string[]
  }>
  incompatibleMaterials: Array<{
    materialId: string
    reference: string
    nom: string
    raisons: string[]
  }>
}

/**
 * Interface pour les recommandations d'optimisation
 */
export interface MaterialOptimizationRecommendations {
  materialId: string
  reference: string
  recommendations: Array<{
    type: 'STOCK' | 'PRIX' | 'FOURNISSEUR' | 'STOCKAGE' | 'ALTERNATIVE'
    priorite: 'HIGH' | 'MEDIUM' | 'LOW'
    titre: string
    description: string
    actionRecommandee: string
    impactEstime?: {
      economie?: number
      gainEspace?: number
      ameliorationDelai?: number
    }
  }>
}
