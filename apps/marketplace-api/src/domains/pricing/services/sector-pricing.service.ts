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
  customerType?: string
  region?: string
  date?: Date
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
}

@Injectable()
export class SectorPricingService {
  constructor(
    @InjectRepository(SectorCoefficient)
    private sectorCoefficientRepository: Repository<SectorCoefficient>,
    
    @InjectRepository(CustomerSectorAssignment)
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
    let customerSector: SectorType | null = null
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
    let transportCosts = 0
    let handlingCosts = 0

    for (const coefficient of applicableCoefficients) {
      const previousPrice = currentPrice
      currentPrice = coefficient.calculateAdjustedPrice(currentPrice, context.quantity)
      
      const adjustment = currentPrice - previousPrice

      // Séparer les coûts transport/manutention
      if (coefficient.coefficientType === 'TRANSPORT') {
        transportCosts += adjustment
      } else if (coefficient.coefficientType === 'HANDLING') {
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
      }
    }
  }

  /**
   * Obtenir le secteur d'un client
   */
  async getCustomerSector(societeId: string, customerId: string): Promise<SectorType | null> {
    const assignment = await this.customerSectorRepository.findOne({
      where: { 
        societeId, 
        customerId, 
        isActive: true 
      },
      order: { createdAt: 'DESC' }
    })

    return assignment?.sector || null
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
      assignmentDetails: {
        assignedBy: details.assignedBy,
        reason: details.reason,
        automaticAssignment: false
      },
      metadata: details.metadata || {}
    })

    return await this.customerSectorRepository.save(assignment)
  }

  /**
   * Obtenir les coefficients applicables
   */
  private async getApplicableCoefficients(
    societeId: string,
    customerSector: SectorType | null,
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
  }): Promise<SectorCoefficient> {
    
    const coefficient = this.sectorCoefficientRepository.create({
      ...data,
      isActive: true,
      priority: 0
    })

    return await this.sectorCoefficientRepository.save(coefficient)
  }

  /**
   * Obtenir tous les coefficients d'une société
   */
  async getSectorCoefficients(societeId: string, sector?: SectorType): Promise<SectorCoefficient[]> {
    const query = this.sectorCoefficientRepository
      .createQueryBuilder('coefficient')
      .where('coefficient.societeId = :societeId', { societeId })
      .orderBy('coefficient.sector', 'ASC')
      .addOrderBy('coefficient.coefficientType', 'ASC')
      .addOrderBy('coefficient.priority', 'DESC')

    if (sector) {
      query.andWhere('coefficient.sector = :sector', { sector })
    }

    return await query.getMany()
  }

  /**
   * Obtenir les assignations clients par secteur
   */
  async getCustomerSectorAssignments(
    societeId: string, 
    sector?: SectorType
  ): Promise<CustomerSectorAssignment[]> {
    
    const query = this.customerSectorRepository
      .createQueryBuilder('assignment')
      .where('assignment.societeId = :societeId', { societeId })
      .andWhere('assignment.isActive = true')
      .orderBy('assignment.sector', 'ASC')
      .addOrderBy('assignment.customerName', 'ASC')

    if (sector) {
      query.andWhere('assignment.sector = :sector', { sector })
    }

    return await query.getMany()
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
        productCategory: item.productCategory
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