import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SectorCoefficient, SectorType, CoefficientType } from '../entities/sector-coefficient.entity'
import { CustomerSectorAssignment } from '../entities/customer-sector-assignment.entity'

export interface PricingContext {
  customerId?: string
  quantity: number
  basePrice: number
  productCategory?: string
  articleFamily?: string
  customerType?: string
  region?: string
  date?: Date
  weight?: number
  volume?: number
}

export interface PricingResult {
  basePrice: number
  finalPrice: number
  appliedCoefficients: Array<{
    id: string
    type: string
    sector: string
    coefficient: number
    adjustment: number
    description?: string
  }>
  totalDiscount: number
  totalDiscountPercentage: number
  breakdown: {
    basePrice: number
    sectorAdjustments: number
    transportCosts: number
    handlingCosts: number
    finalPrice: number
  }
  metadata: {
    customerSector?: SectorType
    calculationDate: Date
    appliedRules: string[]
  }
}

@Injectable()
export class SectorPricingService {
  constructor(
    @InjectRepository(SectorCoefficient, 'tenant')
    private sectorCoefficientRepository: Repository<SectorCoefficient>,
    
    @InjectRepository(CustomerSectorAssignment, 'tenant')
    private customerSectorRepository: Repository<CustomerSectorAssignment>,
  ) {}

  /**
   * Calculer le prix avec coefficients sectoriels
   */
  async calculateSectorPrice(
    societeId: string,
    context: PricingContext
  ): Promise<PricingResult> {
    
    // 1. Identifier le secteur du client
    let customerSector: SectorType | undefined
    if (context.customerId) {
      customerSector = await this.getCustomerSector(societeId, context.customerId)
    }

    // 2. Récupérer les coefficients applicables
    const applicableCoefficients = await this.getApplicableCoefficients(
      societeId, 
      customerSector, 
      context
    )

    // 3. Appliquer les coefficients dans l'ordre de priorité
    let currentPrice = context.basePrice
    const appliedCoefficients: PricingResult['appliedCoefficients'] = []
    const appliedRules: string[] = []
    let transportCosts = 0
    let handlingCosts = 0

    for (const coefficient of applicableCoefficients) {
      const previousPrice = currentPrice
      currentPrice = coefficient.calculateAdjustedPrice(currentPrice, context.quantity)
      
      const adjustment = currentPrice - previousPrice

      // Séparer les coûts transport/manutention
      if (coefficient.coefficientType === CoefficientType.TRANSPORT) {
        transportCosts += adjustment
      } else if (coefficient.coefficientType === CoefficientType.HANDLING) {
        handlingCosts += adjustment
      }

      appliedCoefficients.push({
        id: coefficient.id,
        type: coefficient.coefficientType,
        sector: coefficient.sector,
        coefficient: coefficient.coefficient,
        adjustment,
        description: coefficient.description
      })

      appliedRules.push(`${coefficient.sector}_${coefficient.coefficientType}`)
    }

    // 4. Calculer le résultat final
    const totalDiscount = Math.max(0, context.basePrice - currentPrice)
    const totalDiscountPercentage = context.basePrice > 0 
      ? (totalDiscount / context.basePrice) * 100 
      : 0

    return {
      basePrice: context.basePrice,
      finalPrice: currentPrice,
      appliedCoefficients,
      totalDiscount,
      totalDiscountPercentage,
      breakdown: {
        basePrice: context.basePrice,
        sectorAdjustments: currentPrice - context.basePrice - transportCosts - handlingCosts,
        transportCosts,
        handlingCosts,
        finalPrice: currentPrice
      },
      metadata: {
        customerSector,
        calculationDate: new Date(),
        appliedRules
      }
    }
  }

  /**
   * Obtenir le secteur d'un client
   */
  async getCustomerSector(societeId: string, customerId: string): Promise<SectorType | undefined> {
    const assignment = await this.customerSectorRepository.findOne({
      where: { 
        societeId, 
        customerId, 
        isActive: true 
      },
      order: { createdAt: 'DESC' }
    })

    return assignment?.sector
  }

  /**
   * Assigner un secteur à un client
   */
  async assignCustomerSector(
    societeId: string,
    customerId: string,
    sector: SectorType,
    details: {
      assignedBy?: string
      reason?: string
      customerName?: string
      customerCode?: string
      validFrom?: Date
      validUntil?: Date
      sectorMetadata?: any
      metadata?: any
    } = {}
  ): Promise<CustomerSectorAssignment> {
    
    // Désactiver l'assignation précédente s'il y en a une
    await this.customerSectorRepository.update(
      { societeId, customerId, isActive: true },
      { isActive: false }
    )

    // Créer la nouvelle assignation
    const assignment = this.customerSectorRepository.create({
      societeId,
      customerId,
      sector,
      customerName: details.customerName,
      customerCode: details.customerCode,
      validFrom: details.validFrom,
      validUntil: details.validUntil,
      assignmentDetails: {
        assignedBy: details.assignedBy,
        reason: details.reason,
        automaticAssignment: false,
        sourceDocument: 'manual_assignment'
      },
      sectorMetadata: details.sectorMetadata || {},
      metadata: details.metadata || {}
    })

    return await this.customerSectorRepository.save(assignment)
  }

  /**
   * Obtenir les coefficients applicables
   */
  private async getApplicableCoefficients(
    societeId: string,
    customerSector: SectorType | undefined,
    context: PricingContext
  ): Promise<SectorCoefficient[]> {
    
    const query = this.sectorCoefficientRepository
      .createQueryBuilder('coefficient')
      .where('coefficient.societeId = :societeId', { societeId })
      .andWhere('coefficient.isActive = true')
      .orderBy('coefficient.priority', 'DESC')
      .addOrderBy('coefficient.createdAt', 'ASC')

    // Filtrer par secteur si disponible
    if (customerSector) {
      query.andWhere('coefficient.sector = :sector', { sector: customerSector })
    }

    const coefficients = await query.getMany()

    // Filtrer selon les conditions spécifiques
    return coefficients.filter(coefficient => 
      coefficient.isValidForConditions({
        quantity: context.quantity,
        amount: context.basePrice * context.quantity,
        customerType: context.customerType,
        productCategory: context.productCategory,
        articleFamily: context.articleFamily,
        date: context.date,
        region: context.region
      })
    )
  }

  /**
   * Créer un coefficient sectoriel
   */
  async createSectorCoefficient(data: {
    societeId: string
    sector: SectorType
    sectorName: string
    coefficientType: CoefficientType
    coefficient: number
    description?: string
    conditions?: any
    parameters?: any
    metadata?: any
    priority?: number
  }): Promise<SectorCoefficient> {
    
    const coefficient = this.sectorCoefficientRepository.create({
      ...data,
      isActive: true,
      priority: data.priority || 0
    })

    return await this.sectorCoefficientRepository.save(coefficient)
  }

  /**
   * Obtenir tous les coefficients d'un tenant
   */
  async getSectorCoefficients(
    societeId: string, 
    sector?: SectorType,
    coefficientType?: CoefficientType
  ): Promise<SectorCoefficient[]> {
    
    const query = this.sectorCoefficientRepository
      .createQueryBuilder('coefficient')
      .where('coefficient.societeId = :societeId', { societeId })
      .orderBy('coefficient.sector', 'ASC')
      .addOrderBy('coefficient.coefficientType', 'ASC')
      .addOrderBy('coefficient.priority', 'DESC')

    if (sector) {
      query.andWhere('coefficient.sector = :sector', { sector })
    }

    if (coefficientType) {
      query.andWhere('coefficient.coefficientType = :coefficientType', { coefficientType })
    }

    return await query.getMany()
  }

  /**
   * Obtenir les assignations clients par secteur
   */
  async getCustomerSectorAssignments(
    societeId: string, 
    sector?: SectorType,
    includeInactive = false
  ): Promise<CustomerSectorAssignment[]> {
    
    const query = this.customerSectorRepository
      .createQueryBuilder('assignment')
      .where('assignment.societeId = :societeId', { societeId })
      .orderBy('assignment.sector', 'ASC')
      .addOrderBy('assignment.customerName', 'ASC')

    if (!includeInactive) {
      query.andWhere('assignment.isActive = true')
    }

    if (sector) {
      query.andWhere('assignment.sector = :sector', { sector })
    }

    return await query.getMany()
  }

  /**
   * Créer un coefficient BTP par défaut
   */
  async createDefaultBTPCoefficients(societeId: string): Promise<SectorCoefficient[]> {
    const defaultCoefficients = [
      {
        sector: SectorType.BTP,
        sectorName: 'Bâtiment et Travaux Publics',
        coefficientType: CoefficientType.BASE_PRICE,
        coefficient: 1.10, // +10% sur prix de base
        description: 'Coefficient de base BTP (+10%)',
        conditions: {
          minQuantity: 1,
          articleFamilies: ['POUTRELLES', 'PROFILES', 'TUBES', 'PLATS']
        },
        parameters: {
          applyToBasePrice: true,
          btpSpecific: {
            applyCOFRAC: true,
            applyBTPCoeff: true,
            minimumOrder: 500
          }
        },
        priority: 10
      },
      {
        sector: SectorType.BTP,
        sectorName: 'Bâtiment et Travaux Publics',
        coefficientType: CoefficientType.DISCOUNT,
        coefficient: 5, // -5% remise volume
        description: 'Remise BTP sur gros volumes',
        conditions: {
          minQuantity: 100,
          minAmount: 5000
        },
        parameters: {
          discountType: 'percentage'
        },
        priority: 5
      },
      {
        sector: SectorType.BTP,
        sectorName: 'Bâtiment et Travaux Publics',
        coefficientType: CoefficientType.TRANSPORT,
        coefficient: 150, // 150€ transport
        description: 'Frais de transport BTP',
        conditions: {},
        parameters: {
          calculationMethod: 'fixed',
          freeThreshold: 2000 // Gratuit au-dessus de 2000€
        },
        priority: 1
      }
    ]

    const createdCoefficients: SectorCoefficient[] = []
    
    for (const coeffData of defaultCoefficients) {
      const coefficient = await this.createSectorCoefficient({
        societeId,
        ...coeffData
      })
      createdCoefficients.push(coefficient)
    }

    return createdCoefficients
  }

  /**
   * Mettre à jour un coefficient
   */
  async updateSectorCoefficient(
    id: string, 
    societeId: string, 
    updates: Partial<SectorCoefficient>
  ): Promise<SectorCoefficient> {
    
    await this.sectorCoefficientRepository.update(
      { id, societeId }, 
      { 
        ...updates,
        updatedAt: new Date() 
      }
    )

    const updated = await this.sectorCoefficientRepository.findOne({
      where: { id, societeId }
    })

    if (!updated) {
      throw new Error('Coefficient not found after update')
    }

    return updated
  }

  /**
   * Calculer les prix pour plusieurs produits avec coefficients sectoriels
   */
  async calculateBulkPricing(
    societeId: string,
    items: Array<{
      productId: string
      basePrice: number
      quantity: number
      productCategory?: string
      articleFamily?: string
      weight?: number
      volume?: number
    }>,
    context: {
      customerId?: string
      customerType?: string
      region?: string
      date?: Date
    }
  ): Promise<Array<PricingResult & { productId: string }>> {
    
    const results: Array<PricingResult & { productId: string }> = []

    for (const item of items) {
      const pricingContext: PricingContext = {
        ...context,
        quantity: item.quantity,
        basePrice: item.basePrice,
        productCategory: item.productCategory,
        articleFamily: item.articleFamily,
        weight: item.weight,
        volume: item.volume
      }

      const result = await this.calculateSectorPrice(societeId, pricingContext)
      
      results.push({
        ...result,
        productId: item.productId
      })
    }

    return results
  }
}