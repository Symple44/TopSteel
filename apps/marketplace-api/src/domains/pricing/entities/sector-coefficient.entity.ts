import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum SectorType {
  BTP = 'BTP',
  INDUSTRIE = 'INDUSTRIE',
  AUTOMOBILE = 'AUTOMOBILE',
  NAVAL = 'NAVAL',
  AERONAUTIQUE = 'AERONAUTIQUE',
  ENERGIE = 'ENERGIE',
  AGRICOLE = 'AGRICOLE',
  ALIMENTAIRE = 'ALIMENTAIRE',
  CHIMIE = 'CHIMIE',
  PHARMACEUTIQUE = 'PHARMACEUTIQUE',
  DEFENSE = 'DEFENSE',
  TRANSPORT = 'TRANSPORT',
  PARTICULIER = 'PARTICULIER',
}

export enum CoefficientType {
  BASE_PRICE = 'BASE_PRICE', // Coefficient sur prix de base
  MARGIN = 'MARGIN', // Coefficient sur marge
  DISCOUNT = 'DISCOUNT', // Remise secteur
  TRANSPORT = 'TRANSPORT', // Frais transport spécifiques
  HANDLING = 'HANDLING', // Frais manutention
}

@Entity('marketplace_sector_coefficients')
@Index(['societeId', 'sector', 'coefficientType'])
export class SectorCoefficient {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  societeId!: string

  @Column({ type: 'enum', enum: SectorType })
  @Index()
  sector!: SectorType

  @Column({ type: 'varchar', length: 100 })
  sectorName!: string // Nom affiché du secteur

  @Column({ type: 'enum', enum: CoefficientType })
  coefficientType!: CoefficientType

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  coefficient!: number // Ex: 1.15 pour +15%, 0.90 pour -10%

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'integer', default: 0 })
  priority!: number // Ordre d'application

  // Conditions d'application
  @Column({ type: 'jsonb', default: {} })
  conditions!: {
    minQuantity?: number
    maxQuantity?: number
    minAmount?: number // Montant minimum HT
    maxAmount?: number
    customerTypes?: string[] // Types de clients éligibles
    productCategories?: string[] // Catégories de produits
    validFrom?: Date
    validUntil?: Date
    weekdays?: number[] // Jours de la semaine (1=lundi, 7=dimanche)
    regions?: string[] // Régions géographiques
  }

  // Paramètres spécifiques par type
  @Column({ type: 'jsonb', default: {} })
  parameters!: {
    // Pour BASE_PRICE
    applyToBasePrice?: boolean
    applyToMargin?: boolean

    // Pour MARGIN
    marginType?: 'percentage' | 'fixed_amount'

    // Pour DISCOUNT
    discountType?: 'percentage' | 'fixed_amount' | 'progressive'
    progressiveRates?: Array<{
      minQuantity: number
      rate: number
    }>

    // Pour TRANSPORT/HANDLING
    calculationMethod?: 'per_unit' | 'per_weight' | 'per_volume' | 'fixed'
    freeThreshold?: number // Seuil de gratuité
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    createdBy?: string
    approvedBy?: string
    notes?: string
    internalCode?: string // Code interne société
    externalReference?: string
  }

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Méthodes utilitaires
  isValidForConditions(context: {
    quantity?: number
    amount?: number
    customerType?: string
    productCategory?: string
    date?: Date
    region?: string
  }): boolean {
    if (!this.isActive) return false

    // Vérification des quantités
    if (
      this.conditions.minQuantity &&
      (!context.quantity || context.quantity < this.conditions.minQuantity)
    ) {
      return false
    }
    if (
      this.conditions.maxQuantity &&
      (!context.quantity || context.quantity > this.conditions.maxQuantity)
    ) {
      return false
    }

    // Vérification des montants
    if (
      this.conditions.minAmount &&
      (!context.amount || context.amount < this.conditions.minAmount)
    ) {
      return false
    }
    if (
      this.conditions.maxAmount &&
      (!context.amount || context.amount > this.conditions.maxAmount)
    ) {
      return false
    }

    // Vérification des types de clients
    if (
      this.conditions.customerTypes?.length &&
      context.customerType &&
      !this.conditions.customerTypes.includes(context.customerType)
    ) {
      return false
    }

    // Vérification des catégories produits
    if (
      this.conditions.productCategories?.length &&
      context.productCategory &&
      !this.conditions.productCategories.includes(context.productCategory)
    ) {
      return false
    }

    // Vérification des dates
    const checkDate = context.date || new Date()
    if (this.conditions.validFrom && checkDate < this.conditions.validFrom) {
      return false
    }
    if (this.conditions.validUntil && checkDate > this.conditions.validUntil) {
      return false
    }

    // Vérification des jours de la semaine
    if (this.conditions.weekdays?.length) {
      const dayOfWeek = checkDate.getDay() || 7 // Dimanche = 7
      if (!this.conditions.weekdays.includes(dayOfWeek)) {
        return false
      }
    }

    // Vérification des régions
    if (
      this.conditions.regions?.length &&
      context.region &&
      !this.conditions.regions.includes(context.region)
    ) {
      return false
    }

    return true
  }

  calculateAdjustedPrice(basePrice: number, quantity: number = 1): number {
    switch (this.coefficientType) {
      case CoefficientType.BASE_PRICE:
        return basePrice * this.coefficient

      case CoefficientType.MARGIN:
        if (this.parameters.marginType === 'fixed_amount') {
          return basePrice + this.coefficient
        }
        return basePrice * (1 + this.coefficient / 100)

      case CoefficientType.DISCOUNT:
        if (this.parameters.discountType === 'progressive' && this.parameters.progressiveRates) {
          // Remise progressive selon quantité
          const applicableRate = this.parameters.progressiveRates
            .filter((rate) => quantity >= rate.minQuantity)
            .sort((a, b) => b.minQuantity - a.minQuantity)[0]

          if (applicableRate) {
            return basePrice * (1 - applicableRate.rate / 100)
          }
        }

        if (this.parameters.discountType === 'fixed_amount') {
          return Math.max(0, basePrice - this.coefficient)
        }

        // Remise en pourcentage par défaut
        return basePrice * (1 - this.coefficient / 100)

      case CoefficientType.TRANSPORT:
      case CoefficientType.HANDLING:
        // Ces coûts s'ajoutent au prix
        switch (this.parameters.calculationMethod) {
          case 'per_unit':
            return basePrice + this.coefficient * quantity
          case 'fixed':
            // Coût fixe réparti ou seuil de gratuité
            if (this.parameters.freeThreshold && basePrice >= this.parameters.freeThreshold) {
              return basePrice
            }
            return basePrice + this.coefficient
          default:
            return basePrice + this.coefficient
        }

      default:
        return basePrice
    }
  }

  getDiscountAmount(basePrice: number, quantity: number = 1): number {
    const adjustedPrice = this.calculateAdjustedPrice(basePrice, quantity)
    return Math.max(0, basePrice - adjustedPrice)
  }

  getDiscountPercentage(basePrice: number, quantity: number = 1): number {
    if (basePrice === 0) return 0
    const discountAmount = this.getDiscountAmount(basePrice, quantity)
    return (discountAmount / basePrice) * 100
  }
}
