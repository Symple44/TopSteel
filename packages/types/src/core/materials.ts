/**
 * 📦 @erp/types - Types pour les matériaux
 * Types et interfaces pour la gestion des matériaux dans TopSteel ERP
 */

/**
 * Types de matériaux supportés
 */
export enum MaterialType {
  ACIER = 'ACIER',
  INOX = 'INOX',
  ALUMINIUM = 'ALUMINIUM',
  CUIVRE = 'CUIVRE',
  FONTE = 'FONTE',
  BRONZE = 'BRONZE',
  LAITON = 'LAITON',
  PLASTIQUE = 'PLASTIQUE',
  COMPOSITE = 'COMPOSITE',
  AUTRE = 'AUTRE',
}

/**
 * Catégories de matériaux
 */
export enum MaterialCategory {
  METAUX_FERREUX = 'METAUX_FERREUX',
  METAUX_NON_FERREUX = 'METAUX_NON_FERREUX',
  ALLIAGES = 'ALLIAGES',
  POLYMERES = 'POLYMERES',
  COMPOSITES = 'COMPOSITES',
  CERAMIQUES = 'CERAMIQUES',
  AUTRES = 'AUTRES',
}

/**
 * Formes possibles des matériaux
 */
export enum MaterialShape {
  PLAQUE = 'PLAQUE',
  TUBE = 'TUBE',
  BARRE = 'BARRE',
  PROFILE = 'PROFILE',
  TOLE = 'TOLE',
  FIL = 'FIL',
  ROND = 'ROND',
  CARRE = 'CARRE',
  RECTANGLE = 'RECTANGLE',
  CORNIERE = 'CORNIERE',
  U = 'U',
  T = 'T',
  AUTRE = 'AUTRE',
}

/**
 * Statut du matériau
 */
export enum MaterialStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  OBSOLETE = 'OBSOLETE',
  EN_EVALUATION = 'EN_EVALUATION',
}

/**
 * Unités de mesure pour les matériaux
 */
export enum MaterialUnit {
  KG = 'kg',
  TONNE = 'tonne',
  METRE = 'm',
  METRE_CARRE = 'm²',
  UNITE = 'unité',
  BARRE = 'barre',
  PIECE = 'pièce',
}

/**
 * Méthodes de stockage spécialisées
 */
export enum StorageMethod {
  STANDARD = 'STANDARD',
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
  SUSPENDU = 'SUSPENDU',
  EMPILE = 'EMPILE',
  SEPARATEUR = 'SEPARATEUR',
  CONTROLE_HUMIDITE = 'CONTROLE_HUMIDITE',
  CONTROLE_TEMPERATURE = 'CONTROLE_TEMPERATURE',
}

/**
 * Interface pour les dimensions d'un matériau
 */
export interface MaterialDimensions {
  longueur?: number
  largeur?: number
  epaisseur?: number
  diametre?: number
  diametreInterieur?: number
  diametreExterieur?: number
  rayon?: number
  hauteur?: number
  poids?: number
  densite?: number
  section?: number
  perimetre?: number
  tolerances?: {
    longueur?: string
    largeur?: string
    epaisseur?: string
    diametre?: string
  }
}

/**
 * Interface pour les propriétés mécaniques
 */
export interface MechanicalProperties {
  limiteElastique?: number // MPa
  resistanceTraction?: number // MPa
  durete?: number // HB, HRC, etc.
  moduleElasticite?: number // GPa
  coefficientPoisson?: number
  resilience?: number // J/cm²
  fatigue?: number // cycles
  fluage?: number
  allongement?: number // %
  striction?: number // %
}

/**
 * Interface pour les propriétés physiques
 */
export interface PhysicalProperties {
  densite?: number // g/cm³
  pointFusion?: number // °C
  pointEbullition?: number // °C
  conductiviteThermique?: number // W/m·K
  conductiviteElectrique?: number // S/m
  capaciteThermique?: number // J/kg·K
  dilatationThermique?: number // 1/K
  resistiviteElectrique?: number // Ω·m
  permeabiliteMagnetique?: number
}

/**
 * Interface pour les propriétés chimiques
 */
export interface ChemicalProperties {
  composition?: Record<string, number> // Pourcentages des éléments
  resistanceCorrosion?: string
  resistanceOxydation?: string
  traitementThermique?: string[]
  traitementSurface?: string[]
  compatibiliteChimique?: string[]
  ph?: number
  toxicite?: string
}

/**
 * Interface pour les certifications et normes
 */
export interface MaterialCertifications {
  normes?: string[] // NF, EN, ASTM, etc.
  certifications?: string[] // CE, ISO, etc.
  attestations?: string[] // 3.1, 3.2, etc.
  classifications?: string[] // Classes de résistance, etc.
  essaisRequis?: string[] // Essais obligatoires
  documentsTechniques?: string[] // Fiches techniques, etc.
}

/**
 * Interface pour les informations d'approvisionnement
 */
export interface SupplyInfo {
  fournisseurPrincipalId?: string
  fournisseursSecondaires?: string[]
  referenceFournisseur?: string
  delaiLivraison?: number // jours
  quantiteMiniCommande?: number
  quantiteMultiple?: number
  conditionnement?: string
  transportSpecial?: boolean
  stockageFournisseur?: boolean
  contractCadre?: boolean
  prixNegocies?: Array<{
    quantiteMin: number
    quantiteMax: number
    prixUnitaire: number
    devise: string
    validiteJusqu: Date
  }>
}

/**
 * Interface pour les informations de production
 */
export interface ProductionInfo {
  procédésFabrication?: string[]
  outilsSpeciaux?: string[]
  tempsUsinage?: number // minutes par unité
  rebuts?: number // pourcentage
  controleQualite?: string[]
  postTraitement?: string[]
  assemblageSpecial?: boolean
  conditionnementSpecial?: boolean
}

/**
 * Interface Material - Représentation TypeScript du matériau
 * Note: Cette interface correspond aux propriétés de l'entité Material de l'API
 */
export interface Material extends Record<string, unknown> {
  id: string
  reference: string
  nom: string
  description?: string
  type: MaterialType
  forme: MaterialShape
  status: MaterialStatus
  nuance?: string
  qualite?: string
  marque?: string
  modele?: string
  dimensions: MaterialDimensions
  poidsUnitaire?: number
  densite?: number
  unite: MaterialUnit
  prixUnitaire?: number
  devise: string
  stockMini: number
  stockMaxi: number
  stockPhysique: number
  stockReserve: number
  emplacement?: string
  methodeStockage: StorageMethod
  proprietesMecaniques: MechanicalProperties
  proprietesPhysiques: PhysicalProperties
  proprietesChimiques: ChemicalProperties
  certifications: MaterialCertifications
  informationsApprovisionnement: SupplyInfo
  informationsProduction: ProductionInfo
  dangereux: boolean
  classeDanger?: string
  precautionsManipulation?: string
  obsolete: boolean
  remplacePar?: string
  notes?: string
  sharedMaterialId?: string
  dateDerniereEntree?: Date
  dateDerniereSortie?: Date
  dateDernierInventaire?: Date
  dateCreationFiche: Date
  metadonnees?: Record<string, unknown>

  // Dates héritées de BaseEntity/BusinessEntity
  dateCreation: Date
  dateModification: Date
  dateSuppression?: Date
  estSupprime: boolean
  version: number

  // Métadonnées d'audit héritées
  creeParUtilisateur?: string
  modifieParUtilisateur?: string
  supprimeParUtilisateur?: string
}

/**
 * DTOs for Material operations
 */
export interface CreateMaterialDto {
  reference: string
  nom: string
  description?: string
  type: MaterialType
  forme: MaterialShape
  nuance?: string
  qualite?: string
  marque?: string
  modele?: string
  dimensions: MaterialDimensions
  poidsUnitaire?: number
  densite?: number
  unite: MaterialUnit
  prixUnitaire?: number
  devise: string
  stockMini: number
  stockMaxi: number
  stockPhysique: number
  emplacement?: string
  methodeStockage: StorageMethod
  proprietesMecaniques?: MechanicalProperties
  proprietesPhysiques?: PhysicalProperties
  proprietesChimiques?: ChemicalProperties
  certifications?: MaterialCertifications
  informationsApprovisionnement?: SupplyInfo
  informationsProduction?: ProductionInfo
  dangereux?: boolean
  classeDanger?: string
  precautionsManipulation?: string
  notes?: string
  sharedMaterialId?: string
  metadonnees?: Record<string, unknown>
}

export interface UpdateMaterialDto extends Partial<CreateMaterialDto> {
  status?: MaterialStatus
}

/**
 * Filters for Material queries
 */
export interface MaterialFilters {
  reference?: string
  nom?: string
  type?: MaterialType[] | MaterialType
  forme?: MaterialShape[] | MaterialShape
  status?: MaterialStatus[] | MaterialStatus
  nuance?: string
  qualite?: string
  marque?: string
  category?: string
  dimensions?: string
  unite?: MaterialUnit[] | MaterialUnit
  prixMin?: number
  prixMax?: number
  minPrice?: number // Alias for prixMin
  maxPrice?: number // Alias for prixMax
  stockMiniMin?: number
  stockMiniMax?: number
  minStock?: number // Alias for stockMiniMin
  maxStock?: number // Alias for stockMiniMax
  stockAlert?: boolean
  stockPhysique?: 'low' | 'normal' | 'high' | 'empty'
  dangereux?: boolean
  obsolete?: boolean
  emplacement?: string
  methodeStockage?: StorageMethod[] | StorageMethod
  search?: string
  page?: number
  limit?: number
  sortBy?:
    | 'reference'
    | 'nom'
    | 'type'
    | 'forme'
    | 'stockPhysique'
    | 'prixUnitaire'
    | 'dateCreation'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Statistics for Materials
 */
export interface MaterialStatistics {
  totalMaterials: number
  activeMaterials: number
  inactiveMaterials: number
  obsoleteMaterials: number
  dangerousMaterials: number
  lowStockMaterials: number
  outOfStockMaterials: number
  averageStockValue: number
  totalStockValue: number
  materialsByType: Record<MaterialType, number>
  materialsByShape: Record<MaterialShape, number>
  materialsByUnit: Record<MaterialUnit, number>
  storageMethodDistribution: Record<StorageMethod, number>
  supplierDistribution: Record<string, number>
  recentlyAddedCount: number
  recentlyModifiedCount: number
  stockTurnoverRate: number
  lowStockCount: number // Added for compatibility
  categoryCount: Record<string, number> // Added for compatibility
  mostUsedMaterials: Array<{
    id: string
    reference: string
    nom: string
    usageCount: number
  }>
  leastUsedMaterials: Array<{
    id: string
    reference: string
    nom: string
    lastUsedDate?: Date
  }>
}
