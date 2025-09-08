import { PriceRuleChannel } from '@erp/entities'
import { UseGuards } from '@nestjs/common'
import { Args, Float, Mutation, Query, Resolver } from '@nestjs/graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type { PricingAnalyticsService } from '../services/pricing-analytics.service'
import type { PricingEngineService } from '../services/pricing-engine.service'
import type { MLPricingContext, PricingMLService } from '../services/pricing-ml.service'

// Type definitions
interface AuthenticatedUser {
  id: string
  societeId: string
  [key: string]: unknown
}

interface PricingContext {
  articleId: string
  quantity?: number
  societeId?: string
  customerId?: string
  customerGroup?: string
  channel?: string
  [key: string]: unknown
}

interface Scenario {
  name?: string
  [key: string]: unknown
}

interface RuleDefinition {
  channel?: string
  [key: string]: unknown
}

interface CompetitorPrices {
  [articleId: string]: number[]
}

interface PeakHour {
  hour: number
  count: number
}

interface CustomerGroup {
  group: string
  count: number
}

interface RuleWithPeakUsage {
  peakUsageHours?: Array<{ hour: number; count: number }>
  topCustomerGroups?: Array<{ group: string; count: number }>
  [key: string]: unknown
}

// GraphQL Types
@Resolver('Pricing')
export class PricingResolver {
  constructor(
    private readonly pricingEngine: PricingEngineService,
    private readonly analytics: PricingAnalyticsService,
    private readonly mlService: PricingMLService
  ) {}

  /**
   * Simulation de prix simple
   */
  @Query(() => GraphQLJSONObject, {
    name: 'simulatePrice',
    description: 'Simule le calcul de prix pour un article avec contexte flexible',
  })
  @UseGuards(JwtAuthGuard)
  async simulatePrice(
    @Args('articleId') articleId: string,
    @Args('quantity', { type: () => Float, nullable: true }) quantity?: number,
    @Args('context', { type: () => GraphQLJSONObject, nullable: true }) context?: PricingContext,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    const pricingContext = {
      articleId,
      quantity: quantity || 1,
      societeId: user?.societeId || '',
      customerId: context?.customerId || user?.id,
      customerGroup: context?.customerGroup,
      channel: (context?.channel as PriceRuleChannel) || PriceRuleChannel.ERP,
      ...context,
    }

    return await this.pricingEngine.calculatePrice(pricingContext as unknown, {
      detailed: true,
      includeMargins: true,
      includeSkippedRules: true,
    })
  }

  /**
   * Simulation de scénarios multiples
   */
  @Query(() => [GraphQLJSONObject], {
    name: 'simulateScenarios',
    description: 'Compare plusieurs scénarios de prix en parallèle',
  })
  @UseGuards(JwtAuthGuard)
  async simulateScenarios(
    @Args('baseContext', { type: () => GraphQLJSONObject }) baseContext: PricingContext,
    @Args('scenarios', { type: () => [GraphQLJSONObject] }) scenarios: Scenario[],
    @CurrentUser() user?: AuthenticatedUser
  ) {
    const results = []

    for (const scenario of scenarios) {
      const context = {
        ...baseContext,
        ...scenario,
        societeId: user?.societeId || '',
      }

      const result = await this.pricingEngine.calculatePrice(context as unknown)
      results.push({
        scenario: scenario.name || 'Scenario',
        ...result,
        priceChange: result.finalPrice - result.basePrice,
        priceChangePercent: ((result.finalPrice - result.basePrice) / result.basePrice) * 100,
      })
    }

    return results
  }

  /**
   * Matrice de prix par quantité
   */
  @Query(() => [GraphQLJSONObject], {
    name: 'priceMatrix',
    description: 'Génère une matrice de prix selon différentes quantités',
  })
  @UseGuards(JwtAuthGuard)
  async priceMatrix(
    @Args('articleId') articleId: string,
    @Args('quantities', { type: () => [Float] }) quantities: number[],
    @Args('customerGroups', { type: () => [String], nullable: true }) customerGroups?: string[],
    @CurrentUser() user?: AuthenticatedUser
  ) {
    const matrix = []
    const groups = customerGroups || ['STANDARD']

    for (const quantity of quantities) {
      for (const group of groups) {
        const context = {
          articleId,
          quantity,
          customerGroup: group !== 'STANDARD' ? group : undefined,
          societeId: user?.societeId || '',
          channel: PriceRuleChannel.ERP,
        }

        const result = await this.pricingEngine.calculatePrice(context as unknown)

        matrix.push({
          quantity,
          customerGroup: group,
          unitPrice: result.finalPrice,
          totalPrice: result.finalPrice * quantity,
          discount: result.totalDiscount,
          discountPercent: result.totalDiscountPercentage,
          appliedRules: result.appliedRules.map((r) => r.ruleName),
        })
      }
    }

    return matrix
  }

  /**
   * Optimisation ML du prix
   */
  @Query(() => GraphQLJSONObject, {
    name: 'suggestOptimalPrice',
    description: 'Suggère un prix optimal basé sur le machine learning',
  })
  @UseGuards(JwtAuthGuard)
  async suggestOptimalPrice(
    @Args('articleId') articleId: string,
    @Args('includeCompetitors', { nullable: true }) _includeCompetitors?: boolean,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    // Récupérer l'historique des ventes
    interface SalesHistoryItem {
      date: Date
      quantity: number
      price: number
      revenue: number
    }
    const salesHistory: SalesHistoryItem[] = [] // À implémenter: récupérer depuis la DB

    const context: MLPricingContext = {
      articleId,
      historicalSales: salesHistory,
      inventory: 100, // À récupérer depuis l'article
      cost: 50, // À récupérer depuis l'article
      category: 'GENERAL',
    }

    const suggestion = await this.mlService.suggestOptimalPrice(context)

    // Comparer avec le prix actuel calculé
    const currentPricing = await this.pricingEngine.calculatePrice({
      articleId,
      societeId: user?.societeId || '',
      quantity: 1,
      channel: PriceRuleChannel.ERP,
    })

    return {
      ...suggestion,
      currentCalculatedPrice: currentPricing.finalPrice,
      priceDifference: suggestion.suggestedPrice - currentPricing.finalPrice,
      implementation: {
        createRule: suggestion.suggestedPrice !== currentPricing.finalPrice,
        ruleType: suggestion.suggestedPrice > currentPricing.finalPrice ? 'MARKUP' : 'DISCOUNT',
        adjustmentValue: Math.abs(suggestion.suggestedPrice - currentPricing.finalPrice),
      },
    }
  }

  /**
   * Analytics dashboard
   */
  @Query(() => GraphQLJSONObject, {
    name: 'pricingAnalytics',
    description: 'Tableau de bord analytics des règles de prix',
  })
  @UseGuards(JwtAuthGuard)
  async pricingAnalytics(
    @Args('from', { type: () => String }) from: string,
    @Args('to', { type: () => String }) to: string,
    @Args('groupBy', { nullable: true }) _groupBy?: string,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    const dashboard = await this.analytics.getDashboard(
      user?.societeId ?? '',
      new Date(from),
      new Date(to)
    )

    // Ajouter des insights supplémentaires
    const insights = {
      mostProfitableRules: dashboard.topRules
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 3),
      underperformingRules: dashboard.topRules.filter((r) => r.conversionRate < 20).slice(0, 3),
      peakHours: this.aggregatePeakHours(dashboard.topRules as unknown),
      customerSegmentation: this.aggregateCustomerGroups(dashboard.topRules as unknown),
    }

    return {
      ...dashboard,
      insights,
      exportUrl: `/api/pricing/analytics/export?from=${from}&to=${to}`,
    }
  }

  /**
   * Test d'une règle avant création
   */
  @Mutation(() => GraphQLJSONObject, {
    name: 'testPriceRule',
    description: "Teste l'impact d'une règle avant de la créer",
  })
  @UseGuards(JwtAuthGuard)
  async testPriceRule(
    @Args('rule', { type: () => GraphQLJSONObject }) rule: RuleDefinition,
    @Args('testArticles', { type: () => [String] }) testArticles: string[],
    @CurrentUser() user?: AuthenticatedUser
  ) {
    const results = []

    for (const articleId of testArticles) {
      // Prix sans la règle
      const withoutRule = await this.pricingEngine.calculatePrice({
        articleId,
        societeId: user?.societeId || '',
        quantity: 1,
        channel: (rule.channel as PriceRuleChannel) || PriceRuleChannel.ERP,
      })

      // Simuler avec la règle
      const withRule = await this.pricingEngine.previewRule('test-rule', articleId, {
        societeId: user?.societeId || '',
        quantity: 1,
        channel: (rule.channel as PriceRuleChannel) || PriceRuleChannel.ERP,
      })

      results.push({
        articleId,
        priceWithoutRule: withoutRule.finalPrice,
        priceWithRule: withRule.finalPrice,
        impact: withRule.finalPrice - withoutRule.finalPrice,
        impactPercent:
          ((withRule.finalPrice - withoutRule.finalPrice) / withoutRule.finalPrice) * 100,
      })
    }

    const avgImpact = results.reduce((sum, r) => sum + r.impact, 0) / results.length
    const avgImpactPercent = results.reduce((sum, r) => sum + r.impactPercent, 0) / results.length

    return {
      rule,
      testResults: results,
      summary: {
        articlesTestés: results.length,
        averageImpact: avgImpact,
        averageImpactPercent: avgImpactPercent,
        totalRevenuImpact: results.reduce((sum, r) => sum + r.impact, 0),
        recommendation: Math.abs(avgImpactPercent) < 50 ? 'SAFE' : 'REVIEW',
      },
    }
  }

  /**
   * Comparaison avec la concurrence
   */
  @Query(() => GraphQLJSONObject, {
    name: 'competitivePricing',
    description: 'Compare les prix avec la concurrence',
  })
  @UseGuards(JwtAuthGuard)
  async competitivePricing(
    @Args('articleIds', { type: () => [String] }) articleIds: string[],
    @Args('competitorPrices', { type: () => GraphQLJSONObject }) competitorPrices: CompetitorPrices,
    @CurrentUser() user?: AuthenticatedUser
  ) {
    const analysis = []

    for (const articleId of articleIds) {
      const ourPrice = await this.pricingEngine.calculatePrice({
        articleId,
        societeId: user?.societeId || '',
        quantity: 1,
        channel: PriceRuleChannel.MARKETPLACE,
      })

      const competitors = competitorPrices[articleId] || []
      const avgCompetitorPrice =
        competitors.length > 0
          ? competitors.reduce((a: number, b: number) => a + b, 0) / competitors.length
          : ourPrice.finalPrice

      const position =
        ourPrice.finalPrice < avgCompetitorPrice
          ? 'BELOW_MARKET'
          : ourPrice.finalPrice > avgCompetitorPrice * 1.1
            ? 'ABOVE_MARKET'
            : 'COMPETITIVE'

      analysis.push({
        articleId,
        ourPrice: ourPrice.finalPrice,
        marketAverage: avgCompetitorPrice,
        lowestCompetitor: Math.min(...competitors),
        highestCompetitor: Math.max(...competitors),
        position,
        gap: ourPrice.finalPrice - avgCompetitorPrice,
        gapPercent: ((ourPrice.finalPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100,
        recommendation: this.generateCompetitiveRecommendation(
          position,
          ourPrice.finalPrice,
          avgCompetitorPrice
        ),
      })
    }

    return {
      analysis,
      summary: {
        totalArticles: analysis.length,
        belowMarket: analysis.filter((a) => a.position === 'BELOW_MARKET').length,
        competitive: analysis.filter((a) => a.position === 'COMPETITIVE').length,
        aboveMarket: analysis.filter((a) => a.position === 'ABOVE_MARKET').length,
        averageGap: analysis.reduce((sum, a) => sum + a.gapPercent, 0) / analysis.length,
      },
    }
  }

  // Méthodes utilitaires privées
  private aggregatePeakHours(rules: RuleWithPeakUsage[]): PeakHour[] {
    const hourMap = new Map<number, number>()

    for (const rule of rules) {
      for (const peak of rule.peakUsageHours || []) {
        const current = hourMap.get(peak.hour) || 0
        hourMap.set(peak.hour, current + peak.count)
      }
    }

    return Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private aggregateCustomerGroups(rules: RuleWithPeakUsage[]): CustomerGroup[] {
    const groupMap = new Map<string, number>()

    for (const rule of rules) {
      for (const group of rule.topCustomerGroups || []) {
        const current = groupMap.get(group.group) || 0
        groupMap.set(group.group, current + group.count)
      }
    }

    return Array.from(groupMap.entries())
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => b.count - a.count)
  }

  private generateCompetitiveRecommendation(
    position: string,
    ourPrice: number,
    marketAvg: number
  ): string {
    switch (position) {
      case 'BELOW_MARKET':
        return `Opportunité d'augmenter le prix de ${(((marketAvg - ourPrice) / ourPrice) * 100).toFixed(1)}% tout en restant compétitif`
      case 'ABOVE_MARKET':
        return `Considérer une réduction de ${(((ourPrice - marketAvg) / ourPrice) * 100).toFixed(1)}% pour améliorer la compétitivité`
      default:
        return 'Prix aligné avec le marché'
    }
  }
}
