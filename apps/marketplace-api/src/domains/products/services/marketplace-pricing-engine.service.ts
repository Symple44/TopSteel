import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MarketplacePriceRule, AdjustmentType } from '../entities/marketplace-price-rule.entity'

export interface PriceCalculationContext {
  customerId?: string
  customerEmail?: string
  customerGroup?: string
  quantity?: number
  orderTotal?: number
  promotionCode?: string
  isFirstOrder?: boolean
  customerSegment?: string
}

export interface PriceCalculationResult {
  basePrice: number
  finalPrice: number
  appliedRules: Array<{
    ruleId: string
    ruleName: string
    adjustment: number
    adjustmentType: AdjustmentType
    discountAmount: number
  }>
  totalDiscount: number
  totalDiscountPercentage: number
}

@Injectable()
export class MarketplacePricingEngine {
  constructor(
    @InjectRepository(MarketplacePriceRule, 'marketplace')
    private priceRuleRepo: Repository<MarketplacePriceRule>,
  ) {}

  async calculatePrice(
    productId: string,
    basePrice: number,
    customerId?: string,
    context: PriceCalculationContext = {}
  ): Promise<PriceCalculationResult> {
    // Récupérer toutes les règles actives pour ce produit
    const rules = await this.priceRuleRepo.find({
      where: { 
        productId, 
        isActive: true 
      },
      order: { priority: 'DESC' } // Plus haute priorité en premier
    })

    const result: PriceCalculationResult = {
      basePrice,
      finalPrice: basePrice,
      appliedRules: [],
      totalDiscount: 0,
      totalDiscountPercentage: 0
    }

    if (rules.length === 0) {
      return result
    }

    // Enrichir le contexte avec l'ID client
    const enrichedContext = {
      ...context,
      customerId,
      productId
    }

    let currentPrice = basePrice
    const appliedRules: typeof result.appliedRules = []

    for (const rule of rules) {
      if (rule.canBeApplied(enrichedContext)) {
        const newPrice = rule.calculatePrice(currentPrice)
        const discountAmount = currentPrice - newPrice

        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          adjustment: rule.adjustmentValue,
          adjustmentType: rule.adjustmentType,
          discountAmount
        })

        // Incrémenter l'usage de la règle
        rule.incrementUsage()
        await this.priceRuleRepo.save(rule)

        // Si la règle n'est pas combinable, utiliser son prix et arrêter
        if (!rule.combinable) {
          currentPrice = newPrice
          break
        }

        // Sinon, continuer avec le nouveau prix
        currentPrice = newPrice
      }
    }

    result.finalPrice = Math.max(0, currentPrice) // Prix ne peut pas être négatif
    result.appliedRules = appliedRules
    result.totalDiscount = basePrice - result.finalPrice
    result.totalDiscountPercentage = basePrice > 0 ? (result.totalDiscount / basePrice) * 100 : 0

    return result
  }

  async calculateBulkPrices(
    products: Array<{ productId: string; basePrice: number; quantity?: number }>,
    customerId?: string,
    context: PriceCalculationContext = {}
  ): Promise<Array<PriceCalculationResult & { productId: string }>> {
    const results = await Promise.all(
      products.map(async (product) => {
        const priceResult = await this.calculatePrice(
          product.productId,
          product.basePrice,
          customerId,
          { ...context, quantity: product.quantity }
        )

        return {
          ...priceResult,
          productId: product.productId
        }
      })
    )

    return results
  }

  async getApplicableRules(
    productId: string,
    context: PriceCalculationContext = {}
  ): Promise<MarketplacePriceRule[]> {
    const rules = await this.priceRuleRepo.find({
      where: { 
        productId, 
        isActive: true 
      },
      order: { priority: 'DESC' }
    })

    return rules.filter(rule => rule.canBeApplied(context))
  }

  async previewPriceWithRule(
    productId: string,
    basePrice: number,
    ruleId: string,
    context: PriceCalculationContext = {}
  ): Promise<PriceCalculationResult> {
    const rule = await this.priceRuleRepo.findOne({
      where: { id: ruleId, productId, isActive: true }
    })

    if (!rule || !rule.canBeApplied(context)) {
      return {
        basePrice,
        finalPrice: basePrice,
        appliedRules: [],
        totalDiscount: 0,
        totalDiscountPercentage: 0
      }
    }

    const finalPrice = rule.calculatePrice(basePrice)
    const discountAmount = basePrice - finalPrice

    return {
      basePrice,
      finalPrice: Math.max(0, finalPrice),
      appliedRules: [{
        ruleId: rule.id,
        ruleName: rule.ruleName,
        adjustment: rule.adjustmentValue,
        adjustmentType: rule.adjustmentType,
        discountAmount
      }],
      totalDiscount: discountAmount,
      totalDiscountPercentage: basePrice > 0 ? (discountAmount / basePrice) * 100 : 0
    }
  }

  async createCustomerGroupRule(
    productId: string,
    customerGroup: string,
    adjustmentType: AdjustmentType,
    adjustmentValue: number,
    ruleName?: string
  ): Promise<MarketplacePriceRule> {
    const rule = this.priceRuleRepo.create({
      productId,
      ruleName: ruleName || `Group discount for ${customerGroup}`,
      adjustmentType,
      adjustmentValue,
      conditions: [{
        type: 'customer_group',
        operator: 'equals',
        value: customerGroup
      }],
      priority: 10,
      isActive: true
    })

    return await this.priceRuleRepo.save(rule)
  }

  async createQuantityRule(
    productId: string,
    minQuantity: number,
    adjustmentType: AdjustmentType,
    adjustmentValue: number,
    ruleName?: string
  ): Promise<MarketplacePriceRule> {
    const rule = this.priceRuleRepo.create({
      productId,
      ruleName: ruleName || `Quantity discount (${minQuantity}+)`,
      adjustmentType,
      adjustmentValue,
      conditions: [{
        type: 'quantity',
        operator: 'greater_than',
        value: minQuantity - 1
      }],
      priority: 5,
      isActive: true,
      combinable: false // Les règles de quantité ne se combinent généralement pas
    })

    return await this.priceRuleRepo.save(rule)
  }

  async createTimedPromotion(
    productId: string,
    startDate: Date,
    endDate: Date,
    adjustmentType: AdjustmentType,
    adjustmentValue: number,
    ruleName?: string
  ): Promise<MarketplacePriceRule> {
    const rule = this.priceRuleRepo.create({
      productId,
      ruleName: ruleName || 'Timed promotion',
      adjustmentType,
      adjustmentValue,
      conditions: [{
        type: 'date_range',
        operator: 'between',
        value: [startDate.toISOString(), endDate.toISOString()]
      }],
      validFrom: startDate,
      validUntil: endDate,
      priority: 15,
      isActive: true
    })

    return await this.priceRuleRepo.save(rule)
  }

  async validateRule(rule: Partial<MarketplacePriceRule>): Promise<string[]> {
    const errors: string[] = []

    if (!rule.ruleName?.trim()) {
      errors.push('Rule name is required')
    }

    if (!rule.adjustmentType) {
      errors.push('Adjustment type is required')
    }

    if (rule.adjustmentValue === undefined || rule.adjustmentValue === null) {
      errors.push('Adjustment value is required')
    }

    if (rule.adjustmentType === AdjustmentType.PERCENTAGE && Math.abs(rule.adjustmentValue!) > 100) {
      errors.push('Percentage adjustment cannot exceed 100%')
    }

    if (rule.adjustmentType === AdjustmentType.FIXED_PRICE && rule.adjustmentValue! < 0) {
      errors.push('Fixed price cannot be negative')
    }

    if (rule.validFrom && rule.validUntil && rule.validFrom > rule.validUntil) {
      errors.push('Valid from date cannot be after valid until date')
    }

    if (rule.usageLimit && rule.usageLimit < 1) {
      errors.push('Usage limit must be at least 1')
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('At least one condition is required')
    }

    return errors
  }
}