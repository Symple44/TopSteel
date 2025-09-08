import { PriceRuleChannel } from '@erp/entities'
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { Roles } from '../../../domains/auth/decorators/roles.decorator'
import { EnhancedTenantGuard } from '../../../domains/auth/security/guards/enhanced-tenant.guard'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import type { User } from '../../../domains/users/entities/user.entity'
import type { PricingEngineService } from '../services/pricing-engine.service'

export interface QuoteLineItem {
  articleId?: string
  articleReference?: string
  quantity: number
  unitPrice?: number
  description?: string
}

export interface QuoteRequest {
  societeId: string
  customerId?: string
  customerGroup?: string
  customerEmail?: string
  channel?: PriceRuleChannel
  items: QuoteLineItem[]
  includeBreakdown?: boolean
  includeMargins?: boolean
  currency?: string
  promotionCode?: string
  metadata?: Record<string, unknown>
}

export interface QuoteLineResult {
  articleId?: string
  articleReference?: string
  description?: string
  quantity: number
  unitPrice: number
  basePrice: number
  finalPrice: number
  lineTotal: number
  discount: number
  discountPercentage: number
  appliedRules: Array<{
    ruleId: string
    ruleName: string
    discount: number
  }>
  breakdown?: any
  warnings?: string[]
}

export interface QuoteResponse {
  quoteId: string
  createdAt: string
  expiresAt: string
  societeId: string
  customerId?: string
  currency: string
  lines: QuoteLineResult[]
  subtotal: number
  totalDiscount: number
  totalDiscountPercentage: number
  totalBeforeTax: number
  taxAmount?: number
  totalIncludingTax?: number
  metadata?: Record<string, unknown>
  breakdown?: {
    rulesApplied: number
    totalItems: number
    averageDiscount: number
    processingTime: number
  }
}

@ApiTags('pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard, EnhancedTenantGuard)
@ApiBearerAuth()
export class PricingQuoteController {
  constructor(private readonly pricingEngine: PricingEngineService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'MANAGER', 'COMMERCIAL', 'USER')
  @ApiOperation({
    summary: 'Générer un devis avec calcul de prix détaillé',
    description:
      'Calcule les prix pour plusieurs articles en tenant compte des règles de prix et retourne un devis détaillé',
  })
  @ApiResponse({
    status: 200,
    description: 'Devis généré avec succès',
    schema: {
      type: 'object',
      properties: {
        quoteId: { type: 'string' },
        createdAt: { type: 'string' },
        expiresAt: { type: 'string' },
        societeId: { type: 'string' },
        currency: { type: 'string' },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              articleId: { type: 'string' },
              quantity: { type: 'number' },
              unitPrice: { type: 'number' },
              lineTotal: { type: 'number' },
            },
          },
        },
        subtotal: { type: 'number' },
        totalDiscount: { type: 'number' },
      },
    },
  })
  async generateQuote(
    @Body() request: QuoteRequest,
    @CurrentUser() user: User
  ): Promise<QuoteResponse> {
    const startTime = Date.now()
    const quoteId = `QUOTE-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`

    // Calculer les prix pour chaque ligne
    const lines: QuoteLineResult[] = []
    let totalAppliedRules = 0

    for (const item of request.items) {
      const priceResult = await this.pricingEngine.calculatePrice(
        {
          societeId: request.societeId,
          articleId: item.articleId,
          articleReference: item.articleReference,
          customerId: request.customerId,
          customerGroup: request.customerGroup,
          customerEmail: request.customerEmail,
          channel: request.channel || PriceRuleChannel.ERP,
          quantity: item.quantity,
          promotionCode: request.promotionCode,
        },
        {
          detailed: request.includeBreakdown,
          includeMargins: request.includeMargins,
          includeSkippedRules: false,
        }
      )

      const lineTotal = priceResult.finalPrice * item.quantity
      const baseTotal = priceResult.basePrice * item.quantity

      totalAppliedRules += priceResult.appliedRules.length

      lines.push({
        articleId: item.articleId,
        articleReference: item.articleReference || priceResult.breakdown?.context.article.reference,
        description: item.description || priceResult.breakdown?.context.article.designation,
        quantity: item.quantity,
        unitPrice: priceResult.finalPrice,
        basePrice: priceResult.basePrice,
        finalPrice: priceResult.finalPrice,
        lineTotal,
        discount: baseTotal - lineTotal,
        discountPercentage: priceResult.totalDiscountPercentage,
        appliedRules: priceResult.appliedRules.map((rule) => ({
          ruleId: rule.ruleId,
          ruleName: rule.ruleName,
          discount: rule.discountAmount,
        })),
        breakdown: request.includeBreakdown ? priceResult.breakdown : undefined,
        warnings: priceResult.warnings,
      })
    }

    // Calculer les totaux
    const subtotal = lines.reduce((sum, line) => sum + line.basePrice * line.quantity, 0)
    const totalBeforeTax = lines.reduce((sum, line) => sum + line.lineTotal, 0)
    const totalDiscount = subtotal - totalBeforeTax
    const totalDiscountPercentage = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0

    // Calculer la TVA si demandée (20% par défaut pour la France)
    const taxRate = (request.metadata?.taxRate as number) || 0.2
    const taxAmount = request.metadata?.includeTax ? totalBeforeTax * taxRate : undefined
    const totalIncludingTax = taxAmount ? totalBeforeTax + taxAmount : undefined

    const processingTime = Date.now() - startTime

    // Créer la date d'expiration (30 jours par défaut)
    const expirationDays = (request.metadata?.expirationDays as number) || 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    return {
      quoteId,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      societeId: request.societeId,
      customerId: request.customerId,
      currency: request.currency || 'EUR',
      lines,
      subtotal,
      totalDiscount,
      totalDiscountPercentage,
      totalBeforeTax,
      taxAmount,
      totalIncludingTax,
      metadata: {
        ...request.metadata,
        generatedBy: user.id,
        generatedByEmail: user.email,
      },
      breakdown: {
        rulesApplied: totalAppliedRules,
        totalItems: lines.length,
        averageDiscount:
          lines.length > 0
            ? lines.reduce((sum, line) => sum + line.discountPercentage, 0) / lines.length
            : 0,
        processingTime,
      },
    }
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'MANAGER', 'COMMERCIAL')
  @ApiOperation({
    summary: 'Simuler plusieurs scénarios de prix',
    description: 'Permet de tester différents scénarios de prix en variant les paramètres',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulations effectuées avec succès',
  })
  async simulateScenarios(
    @Body() request: {
      societeId: string
      articleId: string
      scenarios: Array<{
        name: string
        quantity: number
        customerGroup?: string
        channel?: PriceRuleChannel
        promotionCode?: string
      }>
      includeBreakdown?: boolean
    },
    @CurrentUser() _user: User
  ): Promise<{
    articleId: string
    scenarios: Array<{
      name: string
      quantity: number
      basePrice: number
      finalPrice: number
      discount: number
      discountPercentage: number
      appliedRules: number
      breakdown?: any
    }>
    comparison: {
      bestPrice: number
      bestScenario: string
      worstPrice: number
      worstScenario: string
      averageDiscount: number
    }
  }> {
    const results = []

    for (const scenario of request.scenarios) {
      const priceResult = await this.pricingEngine.calculatePrice(
        {
          societeId: request.societeId,
          articleId: request.articleId,
          quantity: scenario.quantity,
          customerGroup: scenario.customerGroup,
          channel: scenario.channel || PriceRuleChannel.ERP,
          promotionCode: scenario.promotionCode,
        },
        {
          detailed: request.includeBreakdown,
        }
      )

      results.push({
        name: scenario.name,
        quantity: scenario.quantity,
        basePrice: priceResult.basePrice,
        finalPrice: priceResult.finalPrice,
        discount: priceResult.totalDiscount,
        discountPercentage: priceResult.totalDiscountPercentage,
        appliedRules: priceResult.appliedRules.length,
        breakdown: request.includeBreakdown ? priceResult.breakdown : undefined,
      })
    }

    // Analyser les résultats
    const prices = results.map((r) => r.finalPrice)
    const bestPrice = Math.min(...prices)
    const worstPrice = Math.max(...prices)
    const bestScenario = results.find((r) => r.finalPrice === bestPrice)?.name || ''
    const worstScenario = results.find((r) => r.finalPrice === worstPrice)?.name || ''
    const averageDiscount =
      results.reduce((sum, r) => sum + r.discountPercentage, 0) / results.length

    return {
      articleId: request.articleId,
      scenarios: results,
      comparison: {
        bestPrice,
        bestScenario,
        worstPrice,
        worstScenario,
        averageDiscount,
      },
    }
  }
}
