import type { IBusinessRepository } from '../../core/interfaces/business-service.interface'
import type {
  Material,
  MaterialShape,
  MaterialStatus,
  MaterialType,
  StorageMethod,
} from '../entities/material.entity'
import type { MaterialSearchCriteria, MaterialStatistics } from '../services/material.service'

/**
 * Interface du repository pour les matériaux
 */
export interface IMaterialRepository extends IBusinessRepository<Material> {
  /**
   * Trouver un matériau par sa référence
   */
  findByReference(reference: string): Promise<Material | null>

  /**
   * Trouver les matériaux par type
   */
  findByType(type: MaterialType): Promise<Material[]>

  /**
   * Trouver les matériaux par forme
   */
  findByShape(shape: MaterialShape): Promise<Material[]>

  /**
   * Trouver les matériaux par statut
   */
  findByStatus(status: MaterialStatus): Promise<Material[]>

  /**
   * Trouver les matériaux par nuance
   */
  findByNuance(nuance: string): Promise<Material[]>

  /**
   * Trouver les matériaux par fournisseur principal
   */
  findBySupplier(supplierId: string): Promise<Material[]>

  /**
   * Compter les matériaux par type
   */
  countByType(type: MaterialType): Promise<number>

  /**
   * Rechercher les matériaux selon des critères
   */
  searchByCriteria(criteria: MaterialSearchCriteria): Promise<Material[]>

  /**
   * Trouver les matériaux selon une condition de stock
   */
  findByStockCondition(
    condition: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  ): Promise<Material[]>

  /**
   * Vérifier si un matériau a des mouvements de stock
   */
  hasStockMovements(materialId: string): Promise<boolean>

  /**
   * Obtenir tous les matériaux
   */
  findAll(): Promise<Material[]>

  /**
   * Recherche avec pagination et filtres avancés
   */
  findWithFilters(filters: MaterialAdvancedFilters): Promise<{
    items: Material[]
    total: number
    page: number
    limit: number
  }>

  /**
   * Recherche textuelle dans les champs principaux
   */
  searchByText(searchText: string, limit?: number): Promise<Material[]>

  /**
   * Obtenir les statistiques des matériaux
   */
  getMaterialStats(): Promise<MaterialStatistics>

  /**
   * Obtenir les matériaux créés dans une période
   */
  findCreatedBetween(dateDebut: Date, dateFin: Date): Promise<Material[]>

  /**
   * Obtenir les matériaux modifiés récemment
   */
  findRecentlyModified(nbJours: number): Promise<Material[]>

  /**
   * Obtenir les matériaux par dimensions approximatives
   */
  findByDimensions(
    longueurMin?: number,
    longueurMax?: number,
    largeurMin?: number,
    largeurMax?: number,
    epaisseurMin?: number,
    epaisseurMax?: number
  ): Promise<Material[]>

  /**
   * Obtenir les matériaux par gamme de prix
   */
  findByPriceRange(prixMin?: number, prixMax?: number): Promise<Material[]>

  /**
   * Obtenir les matériaux nécessitant un stockage spécial
   */
  findRequiringSpecialStorage(): Promise<Material[]>

  /**
   * Obtenir les matériaux dangereux
   */
  findHazardousMaterials(): Promise<Material[]>

  /**
   * Obtenir les matériaux obsolètes
   */
  findObsoleteMaterials(): Promise<Material[]>

  /**
   * Obtenir les matériaux avec des certifications spécifiques
   */
  findByCertifications(certifications: string[]): Promise<Material[]>

  /**
   * Obtenir les matériaux par méthode de stockage
   */
  findByStorageMethod(storageMethod: StorageMethod): Promise<Material[]>

  /**
   * Obtenir les matériaux par propriétés mécaniques
   */
  findByMechanicalProperties(filters: MechanicalPropertiesFilters): Promise<Material[]>

  /**
   * Obtenir les matériaux par composition chimique
   */
  findByChemicalComposition(
    element: string,
    minPercentage?: number,
    maxPercentage?: number
  ): Promise<Material[]>

  /**
   * Obtenir la valorisation du stock par type
   */
  getStockValuationByType(): Promise<Record<MaterialType, { quantite: number; valeur: number }>>

  /**
   * Obtenir la valorisation du stock par forme
   */
  getStockValuationByShape(): Promise<Record<MaterialShape, { quantite: number; valeur: number }>>

  /**
   * Obtenir les mouvements de stock récents pour un matériau
   */
  getRecentStockMovements(materialId: string, limit: number): Promise<Record<string, unknown>[]>

  /**
   * Obtenir les matériaux les plus utilisés
   */
  getMostUsedMaterials(
    limit: number,
    periode?: { debut: Date; fin: Date }
  ): Promise<Array<Material & { quantiteUtilisee: number }>>

  /**
   * Obtenir les matériaux à rotation lente
   */
  getSlowMovingMaterials(nbJoursSansUtilisation: number): Promise<Material[]>

  /**
   * Obtenir les matériaux par emplacement de stockage
   */
  findByStorageLocation(emplacement: string): Promise<Material[]>

  /**
   * Obtenir les matériaux compatibles avec un matériau donné
   */
  findCompatibleMaterials(materialId: string): Promise<Material[]>

  /**
   * Obtenir les alternatives à un matériau obsolète
   */
  findAlternativeMaterials(obsoleteMaterialId: string): Promise<Material[]>

  /**
   * Vérifier l'existence de doublons potentiels
   */
  findPotentialDuplicates(material: Material): Promise<Material[]>

  /**
   * Obtenir les matériaux par fournisseur préféré
   */
  findByPreferredSuppliers(): Promise<Material[]>

  /**
   * Obtenir les matériaux nécessitant un réapprovisionnement
   */
  findRequiringRestock(): Promise<Array<Material & { quantiteACommander: number }>>

  /**
   * Obtenir les matériaux par classe de danger
   */
  findByHazardClass(hazardClass: string): Promise<Material[]>

  /**
   * Obtenir les statistiques d'utilisation par période
   */
  getUsageStatsByPeriod(
    debut: Date,
    fin: Date
  ): Promise<
    Array<{
      materialId: string
      reference: string
      nom: string
      quantiteEntree: number
      quantiteSortie: number
      quantiteStock: number
      valeurStock: number
    }>
  >
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
  items: Material[]
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
