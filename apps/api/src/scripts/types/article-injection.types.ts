/**
 * Types et interfaces pour l'injection d'articles métallurgie
 * TopSteel ERP - Clean Architecture
 */

export enum ArticleType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  PRODUIT_SEMI_FINI = 'PRODUIT_SEMI_FINI',
  FOURNITURE = 'FOURNITURE',
  CONSOMMABLE = 'CONSOMMABLE',
  SERVICE = 'SERVICE',
}

export enum ArticleStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  OBSOLETE = 'OBSOLETE',
  EN_COURS_CREATION = 'EN_COURS_CREATION',
}

export enum UniteStock {
  PCS = 'PCS',
  KG = 'KG',
  G = 'G',
  M = 'M',
  CM = 'CM',
  MM = 'MM',
  M2 = 'M2',
  M3 = 'M3',
  L = 'L',
  ML = 'ML',
  T = 'T',
  H = 'H',
}

export enum ArticleFamille {
  PROFILES_ACIER = 'PROFILES_ACIER',
  TUBES_PROFILES = 'TUBES_PROFILES',
  ACIERS_LONGS = 'ACIERS_LONGS',
  TOLES_PLAQUES = 'TOLES_PLAQUES',
  COUVERTURE_BARDAGE = 'COUVERTURE_BARDAGE',
}

export enum SteelGrade {
  S235JR = 'S235JR',
  S275JR = 'S275JR',
  S355JR = 'S355JR',
  S460JR = 'S460JR',
}

export enum StainlessGrade {
  INOX_304 = '304',
  INOX_304L = '304L',
  INOX_316 = '316',
  INOX_316L = '316L',
  INOX_430 = '430',
}

export enum AluminumGrade {
  AL_1050 = '1050',
  AL_5754 = '5754',
  AL_6060 = '6060',
  AL_6082 = '6082',
}

/**
 * Interface pour les caractéristiques techniques d'un article
 */
export interface CaracteristiquesTechniques {
  // Dimensions générales
  hauteur?: number
  largeur?: number
  longueur?: number
  epaisseur?: number
  diametre?: number

  // Propriétés physiques
  poids?: number // kg/m ou kg/m²
  section?: number // cm²
  volume?: number // m³
  surface?: number // m²

  // Propriétés mécaniques pour profilés
  momentInertieX?: number // cm⁴
  momentInertieY?: number // cm⁴
  moduleResistanceX?: number // cm³
  moduleResistanceY?: number // cm³
  rayonGirationX?: number // cm
  rayonGirationY?: number // cm

  // Spécifications matériau
  nuance?: string
  norme?: string
  limiteElastique?: number // MPa
  resistanceTraction?: number // MPa
  allongement?: number // %

  // Propriétés spécifiques
  epaisseurAme?: number // mm
  epaisseurAile?: number // mm
  entraxeOndulation?: number // mm pour bacs
  largeurUtile?: number // mm pour bacs
  porteeAdmissible?: number // m

  // Traitements et finitions
  revetement?: string
  traitement?: string
  classeFeu?: string

  // Métadonnées
  applications?: string[]
  specifications?: Record<string, any>
}

/**
 * Interface pour un article métallurgie complet
 */
export interface ArticleMetallurgie {
  reference: string
  designation: string
  description?: string
  type: ArticleType
  status: ArticleStatus
  famille: ArticleFamille
  sousFamille: string
  uniteStock: UniteStock
  uniteAchat?: UniteStock
  uniteVente?: UniteStock
  coefficientAchat?: number
  coefficientVente?: number
  gereEnStock: boolean
  poids?: number
  prixAchatStandard?: number
  prixVenteHt?: number
  tauxMarge?: number
  caracteristiquesTechniques: CaracteristiquesTechniques
  societeId: string
}

/**
 * Configuration pour l'injection d'une famille d'articles
 */
export interface ArticleInjectionConfig {
  famille: ArticleFamille
  sousFamille: string
  baseReference: string
  baseDesignation: string
  type: ArticleType
  uniteStock: UniteStock
  gereEnStock: boolean
  dimensions?: number[]
  materials?: string[]
  defaultPricing?: {
    coefficientMarge: number
    prixBase: number
  }
}

/**
 * Résultat d'injection d'articles
 */
export interface InjectionResult {
  famille: string
  sousFamille: string
  articlesCreated: number
  articlesSkipped: number
  errors: string[]
  duration: number
  examples: Array<{
    reference: string
    designation: string
    price: number
  }>
}

/**
 * Configuration globale pour l'injection
 */
export interface GlobalInjectionConfig {
  societeId: string
  environment: 'development' | 'staging' | 'production'
  cleanupExisting: boolean
  validateReferences: boolean
  skipOnError: boolean
  batchSize: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * Interface pour les paramètres système
 */
export interface SystemParameter {
  category: string
  key: string
  value: Record<string, any>
  label?: string
  description?: string
  type?: string
  isActive: boolean
}

/**
 * Type pour les générateurs d'articles spécialisés
 */
export type ArticleGenerator = (
  config: ArticleInjectionConfig,
  globalConfig: GlobalInjectionConfig
) => Promise<ArticleMetallurgie[]>

/**
 * Interface pour les validateurs d'articles
 */
export interface ArticleValidator {
  validateReference(reference: string): boolean
  validateDimensions(caracteristiques: CaracteristiquesTechniques): boolean
  validatePricing(article: ArticleMetallurgie): boolean
  validateTechnicalSpecs(
    caracteristiques: CaracteristiquesTechniques,
    famille: ArticleFamille
  ): boolean
}

/**
 * Interface pour les calculateurs de prix
 */
export interface PricingCalculator {
  calculateBasePrice(caracteristiques: CaracteristiquesTechniques, material: string): number
  calculateMargin(basePrice: number, famille: ArticleFamille): number
  applyVolumeDiscount(price: number, dimensions: CaracteristiquesTechniques): number
}

/**
 * Logger interface pour l'injection
 */
export interface InjectionLogger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, error?: Error, meta?: any): void
  logResult(result: InjectionResult): void
}
