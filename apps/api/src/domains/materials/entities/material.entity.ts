import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { BusinessEntity } from '@erp/entities'

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
 * Entité Material - Gestion avancée des matériaux industriels
 */
@Entity('materials')
export class Material extends BusinessEntity {
  /**
   * Note: id est héritée de BaseEntity via CommonEntity
   */

  @Column({ type: 'varchar', length: 100, unique: true })
  reference!: string

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'enum', enum: MaterialType })
  type!: MaterialType

  @Column({ type: 'enum', enum: MaterialShape })
  forme!: MaterialShape

  @Column({ type: 'enum', enum: MaterialStatus, default: MaterialStatus.ACTIF })
  status!: MaterialStatus

  @Column({ type: 'varchar', length: 100, nullable: true })
  nuance?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  qualite?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  marque?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  modele?: string

  @Column({ type: 'jsonb', default: {} })
  dimensions!: MaterialDimensions

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  poidsUnitaire?: number

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  densite?: number

  @Column({ type: 'enum', enum: MaterialUnit, default: MaterialUnit.KG })
  unite!: MaterialUnit

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  prixUnitaire?: number

  @Column({ type: 'varchar', length: 10, default: 'EUR' })
  devise!: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stockMini!: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stockMaxi!: number

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  stockPhysique!: number

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  stockReserve!: number

  @Column({ type: 'varchar', length: 100, nullable: true })
  emplacement?: string

  @Column({ type: 'enum', enum: StorageMethod, default: StorageMethod.STANDARD })
  methodeStockage!: StorageMethod

  @Column({ type: 'jsonb', default: {} })
  proprietesMecaniques!: MechanicalProperties

  @Column({ type: 'jsonb', default: {} })
  proprietesPhysiques!: PhysicalProperties

  @Column({ type: 'jsonb', default: {} })
  proprietesChimiques!: ChemicalProperties

  @Column({ type: 'jsonb', default: {} })
  certifications!: MaterialCertifications

  @Column({ type: 'jsonb', default: {} })
  informationsApprovisionnement!: SupplyInfo

  @Column({ type: 'jsonb', default: {} })
  informationsProduction!: ProductionInfo

  @Column({ type: 'boolean', default: false })
  dangereux!: boolean

  @Column({ type: 'varchar', length: 50, nullable: true })
  classeDanger?: string

  @Column({ type: 'text', nullable: true })
  precautionsManipulation?: string

  @Column({ type: 'boolean', default: false })
  obsolete!: boolean

  @Column({ type: 'varchar', length: 100, nullable: true })
  remplacePar?: string

  @Column({ type: 'text', nullable: true })
  notes?: string

  @Column({ type: 'uuid', nullable: true })
  sharedMaterialId?: string

  @Column({ type: 'timestamp', nullable: true })
  dateDerniereEntree?: Date

  @Column({ type: 'timestamp', nullable: true })
  dateDerniereSortie?: Date

  @Column({ type: 'timestamp', nullable: true })
  dateDernierInventaire?: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dateCreationFiche!: Date

  @Column({ type: 'jsonb', nullable: true })
  metadonnees?: Record<string, any>

  /**
   * Validation métier
   */
  validate(): string[] {
    const errors: string[] = []

    if (!this.reference?.trim()) {
      errors.push('La référence est obligatoire')
    }

    if (!this.nom?.trim()) {
      errors.push('Le nom est obligatoire')
    }

    if (this.stockMini < 0) {
      errors.push('Le stock minimum ne peut pas être négatif')
    }

    if (this.stockMaxi > 0 && this.stockMaxi < this.stockMini) {
      errors.push('Le stock maximum doit être supérieur au stock minimum')
    }

    if (this.stockPhysique < 0) {
      errors.push('Le stock physique ne peut pas être négatif')
    }

    if (this.stockReserve < 0) {
      errors.push('Le stock réservé ne peut pas être négatif')
    }

    if (this.stockReserve > this.stockPhysique) {
      errors.push('Le stock réservé ne peut pas être supérieur au stock physique')
    }

    if (this.prixUnitaire && this.prixUnitaire < 0) {
      errors.push('Le prix unitaire ne peut pas être négatif')
    }

    if (this.poidsUnitaire && this.poidsUnitaire <= 0) {
      errors.push('Le poids unitaire doit être positif')
    }

    if (this.densite && this.densite <= 0) {
      errors.push('La densité doit être positive')
    }

    return errors
  }

  /**
   * Méthodes métier
   */

  /**
   * Calculer le stock disponible
   */
  calculerStockDisponible(): number {
    return Math.max(0, (this.stockPhysique || 0) - (this.stockReserve || 0))
  }

  /**
   * Vérifier si le matériau est en rupture
   */
  estEnRupture(): boolean {
    return this.calculerStockDisponible() === 0
  }

  /**
   * Vérifier si le matériau est sous le stock minimum
   */
  estSousStockMini(): boolean {
    return this.calculerStockDisponible() < (this.stockMini || 0)
  }

  /**
   * Vérifier si le matériau est en surstock
   */
  estEnSurstock(): boolean {
    return this.stockMaxi > 0 && this.stockPhysique > this.stockMaxi
  }

  /**
   * Calculer la quantité à commander
   */
  calculerQuantiteACommander(): number {
    if (!this.estSousStockMini()) {
      return 0
    }

    const stockCible = this.stockMaxi > 0 ? this.stockMaxi : this.stockMini * 2
    const quantiteNecessaire = stockCible - this.calculerStockDisponible()

    if (this.informationsApprovisionnement?.quantiteMultiple) {
      return (
        Math.ceil(quantiteNecessaire / this.informationsApprovisionnement.quantiteMultiple) *
        this.informationsApprovisionnement.quantiteMultiple
      )
    }

    return Math.max(
      quantiteNecessaire,
      this.informationsApprovisionnement?.quantiteMiniCommande || 0
    )
  }

  /**
   * Calculer la valeur du stock
   */
  getValeurStock(): number {
    return (this.stockPhysique || 0) * (this.prixUnitaire || 0)
  }

  /**
   * Calculer le volume en m³
   */
  calculerVolume(): number {
    const dim = this.dimensions
    if (!dim) return 0

    if (dim.longueur && dim.largeur && dim.epaisseur) {
      return (dim.longueur / 1000) * (dim.largeur / 1000) * (dim.epaisseur / 1000)
    }

    if (dim.diametre && dim.longueur) {
      const rayon = dim.diametre / 2000 // mm vers m
      return Math.PI * rayon * rayon * (dim.longueur / 1000)
    }

    return 0
  }

  /**
   * Obtenir la surface en m²
   */
  calculerSurface(): number {
    const dim = this.dimensions
    if (!dim) return 0

    if (dim.longueur && dim.largeur) {
      return (dim.longueur / 1000) * (dim.largeur / 1000)
    }

    if (dim.diametre) {
      const rayon = dim.diametre / 2000 // mm vers m
      return Math.PI * rayon * rayon
    }

    return 0
  }

  /**
   * Vérifier si le matériau nécessite un stockage spécial
   */
  necessiteStockageSpecial(): boolean {
    return this.methodeStockage !== StorageMethod.STANDARD || this.dangereux
  }

  /**
   * Vérifier si le matériau est compatible avec un autre
   */
  estCompatibleAvec(autreMateriau: Material): boolean {
    if (this.proprietesChimiques?.compatibiliteChimique) {
      return this.proprietesChimiques.compatibiliteChimique.includes(autreMateriau.type)
    }
    return true
  }

  /**
   * Obtenir la résistance pour une application donnée
   */
  getResistancePourApplication(application: string): number | null {
    const props = this.proprietesMecaniques
    if (!props) return null

    switch (application.toLowerCase()) {
      case 'traction':
        return props.resistanceTraction || null
      case 'compression':
        return props.limiteElastique || null
      case 'flexion':
        return props.moduleElasticite || null
      case 'fatigue':
        return props.fatigue || null
      default:
        return null
    }
  }

  /**
   * Vérifier si le matériau respecte une norme
   */
  respecteNorme(norme: string): boolean {
    return this.certifications?.normes?.includes(norme) || false
  }

  /**
   * Ajouter une modification à l'historique
   */
  ajouterModificationHistorique(
    champ: string,
    ancienneValeur: any,
    nouvelleValeur: any,
    utilisateur: string
  ): void {
    if (!this.metadonnees) this.metadonnees = {}
    if (!this.metadonnees.historique) this.metadonnees.historique = []

    this.metadonnees.historique.push({
      date: new Date(),
      utilisateur,
      champ,
      ancienneValeur,
      nouvelleValeur,
    })

    // Garder seulement les 100 dernières modifications
    if (this.metadonnees.historique.length > 100) {
      this.metadonnees.historique = this.metadonnees.historique.slice(-100)
    }
  }

  /**
   * Marquer le matériau comme obsolète
   */
  marquerObsolete(remplacePar?: string, raison?: string): void {
    this.status = MaterialStatus.OBSOLETE
    this.obsolete = true
    if (remplacePar) this.remplacePar = remplacePar

    if (!this.metadonnees) this.metadonnees = {}
    this.metadonnees.dateObsolescence = new Date()
    if (raison) this.metadonnees.raisonObsolescence = raison
  }

  /**
   * Calculer l'âge du matériau en stock (jours)
   */
  getAgeStock(): number {
    if (!this.dateDerniereEntree) return 0
    return Math.floor((Date.now() - this.dateDerniereEntree.getTime()) / (1000 * 60 * 60 * 24))
  }
}
