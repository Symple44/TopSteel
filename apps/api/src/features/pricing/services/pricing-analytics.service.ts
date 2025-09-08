import { PriceRule } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, type Repository } from 'typeorm'
import { PricingLog } from '../entities/pricing-log.entity'

export interface RuleAnalytics {
  ruleId: string
  ruleName: string
  usageCount: number
  conversionRate: number
  averageDiscount: number
  totalRevenue: number
  effectivenessScore: number
  lastUsed: Date
  topCustomerGroups: Array<{ group: string; count: number }>
  peakUsageHours: Array<{ hour: number; count: number }>
}

export interface PricingDashboard {
  period: { from: Date; to: Date }
  totalCalculations: number
  totalDiscountGiven: number
  averageDiscountPercentage: number
  topRules: RuleAnalytics[]
  rulesByChannel: Record<string, number>
  conversionFunnel: {
    rulesEvaluated: number
    rulesApplicable: number
    rulesApplied: number
    conversionRate: number
  }
  performanceMetrics: {
    averageCalculationTime: number
    cacheHitRate: number
    errorRate: number
  }
  recommendations: string[]
}

@Injectable()
export class PricingAnalyticsService {
  private readonly logger = new Logger(PricingAnalyticsService.name)
  private metricsBuffer: Map<string, any[]> = new Map()

  constructor(
    @InjectRepository(PriceRule, 'tenant')
    private readonly priceRuleRepository: Repository<PriceRule>,
    @InjectRepository(PricingLog, 'tenant')
    private readonly pricingLogRepository: Repository<PricingLog>
  ) {}

  /**
   * Enregistre une utilisation de règle pour analytics
   */
  async logRuleUsage(data: {
    ruleId: string
    societeId: string
    customerId?: string
    customerGroup?: string
    articleId?: string
    basePrice: number
    finalPrice: number
    discount: number
    channel: string
    calculationTime: number
    applied: boolean
    reason?: string
  }): Promise<void> {
    try {
      // Buffer les métriques pour insertion batch
      const key = `rule_usage_${data.societeId}`
      if (!this.metricsBuffer.has(key)) {
        this.metricsBuffer.set(key, [])
      }

      this.metricsBuffer.get(key)?.push({
        ...data,
        timestamp: new Date(),
      })

      // Flush si le buffer est plein
      const buffer = this.metricsBuffer.get(key)
      if (buffer && buffer.length >= 100) {
        await this.flushMetrics(key)
      }
    } catch (error) {
      this.logger.error('Erreur log usage:', error)
    }
  }

  /**
   * Flush périodique des métriques
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async flushAllMetrics(): Promise<void> {
    for (const key of this.metricsBuffer.keys()) {
      await this.flushMetrics(key)
    }
  }

  private async flushMetrics(key: string): Promise<void> {
    const metrics = this.metricsBuffer.get(key)
    if (!metrics || metrics.length === 0) return

    try {
      await this.pricingLogRepository.save(metrics)
      this.metricsBuffer.set(key, [])
      this.logger.debug(`Flushed ${metrics.length} metrics for ${key}`)
    } catch (error) {
      this.logger.error('Erreur flush metrics:', error)
    }
  }

  /**
   * Génère le dashboard analytics
   */
  async getDashboard(societeId: string, from: Date, to: Date): Promise<PricingDashboard> {
    // Récupérer toutes les métriques de la période
    const logs = await this.pricingLogRepository.find({
      where: {
        societeId,
        createdAt: Between(from, to),
      },
      order: { createdAt: 'DESC' },
    })

    // Calculer les statistiques globales
    const totalCalculations = logs.length
    const totalDiscountGiven = logs.reduce((sum, log) => sum + (log.discount || 0), 0)
    const averageDiscountPercentage =
      logs.length > 0
        ? logs.reduce((sum, log) => {
            const percentage = log.basePrice > 0 ? (log.discount / log.basePrice) * 100 : 0
            return sum + percentage
          }, 0) / logs.length
        : 0

    // Analyser les règles les plus utilisées
    const ruleStats = new Map<string, any>()

    for (const log of logs) {
      if (!log.ruleId) continue

      if (!ruleStats.has(log.ruleId)) {
        ruleStats.set(log.ruleId, {
          ruleId: log.ruleId,
          usageCount: 0,
          appliedCount: 0,
          totalDiscount: 0,
          totalRevenue: 0,
          customerGroups: new Map(),
          hourlyUsage: new Array(24).fill(0),
          lastUsed: log.createdAt,
        })
      }

      const stats = ruleStats.get(log.ruleId)
      stats.usageCount++
      if (log.applied) {
        stats.appliedCount++
        stats.totalDiscount += log.discount
        stats.totalRevenue += log.finalPrice
      }

      // Tracking par groupe client
      if (log.customerGroup) {
        const count = stats.customerGroups.get(log.customerGroup) || 0
        stats.customerGroups.set(log.customerGroup, count + 1)
      }

      // Tracking par heure
      const hour = new Date(log.createdAt).getHours()
      stats.hourlyUsage[hour]++

      // Mettre à jour lastUsed
      if (log.createdAt > stats.lastUsed) {
        stats.lastUsed = log.createdAt
      }
    }

    // Récupérer les détails des règles
    const ruleIds = Array.from(ruleStats.keys())
    const rules = await this.priceRuleRepository.findByIds(ruleIds)
    const ruleMap = new Map(rules.map((r) => [r.id, r]))

    // Construire les analytics par règle
    const topRules: RuleAnalytics[] = Array.from(ruleStats.entries())
      .map(([ruleId, stats]) => {
        const rule = ruleMap.get(ruleId)
        const conversionRate =
          stats.usageCount > 0 ? (stats.appliedCount / stats.usageCount) * 100 : 0

        const averageDiscount =
          stats.appliedCount > 0 ? stats.totalDiscount / stats.appliedCount : 0

        // Score d'efficacité basé sur conversion et revenue
        const effectivenessScore =
          conversionRate * 0.4 +
          Math.min(stats.totalRevenue / 10000, 100) * 0.3 +
          Math.min(stats.usageCount / 100, 100) * 0.3

        // Top groupes clients
        const topCustomerGroups = Array.from(stats.customerGroups.entries())
          .sort((a, b) => (b as [string, number])[1] - (a as [string, number])[1])
          .slice(0, 5)
          .map((entry) => {
            const [group, count] = entry as [string, number]
            return { group, count }
          })

        // Heures de pointe
        const peakUsageHours = stats.hourlyUsage
          .map((count: number, hour: number) => ({ hour, count }))
          .filter((h: unknown) => h.count > 0)
          .sort((a: unknown, b: any) => b.count - a.count)
          .slice(0, 5)

        return {
          ruleId,
          ruleName: rule?.ruleName || 'Unknown',
          usageCount: stats.usageCount,
          conversionRate,
          averageDiscount,
          totalRevenue: stats.totalRevenue,
          effectivenessScore,
          lastUsed: stats.lastUsed,
          topCustomerGroups,
          peakUsageHours,
        }
      })
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 10)

    // Statistiques par canal
    const rulesByChannel: Record<string, number> = {}
    for (const log of logs) {
      const channel = log.channel || 'UNKNOWN'
      rulesByChannel[channel] = (rulesByChannel[channel] || 0) + 1
    }

    // Funnel de conversion
    const rulesEvaluated = logs.length
    const rulesApplicable = logs.filter((l) => l.reason !== 'Not applicable').length
    const rulesApplied = logs.filter((l) => l.applied).length

    // Métriques de performance
    const averageCalculationTime =
      logs.length > 0
        ? logs.reduce((sum, log) => sum + (log.calculationTime || 0), 0) / logs.length
        : 0

    const cacheHits = logs.filter((l) => l.cacheHit).length
    const cacheHitRate = logs.length > 0 ? (cacheHits / logs.length) * 100 : 0

    const errors = logs.filter((l) => l.error).length
    const errorRate = logs.length > 0 ? (errors / logs.length) * 100 : 0

    // Générer des recommandations
    const recommendations = this.generateRecommendations({
      topRules,
      conversionRate: (rulesApplied / rulesEvaluated) * 100,
      cacheHitRate,
      errorRate,
      averageCalculationTime,
    })

    return {
      period: { from, to },
      totalCalculations,
      totalDiscountGiven,
      averageDiscountPercentage,
      topRules,
      rulesByChannel,
      conversionFunnel: {
        rulesEvaluated,
        rulesApplicable,
        rulesApplied,
        conversionRate: rulesEvaluated > 0 ? (rulesApplied / rulesEvaluated) * 100 : 0,
      },
      performanceMetrics: {
        averageCalculationTime,
        cacheHitRate,
        errorRate,
      },
      recommendations,
    }
  }

  /**
   * Génère des recommandations basées sur les analytics
   */
  private generateRecommendations(data: {
    topRules: RuleAnalytics[]
    conversionRate: number
    cacheHitRate: number
    errorRate: number
    averageCalculationTime: number
  }): string[] {
    const recommendations: string[] = []

    // Performance
    if (data.averageCalculationTime > 100) {
      recommendations.push(
        "⚡ Temps de calcul élevé détecté. Considérez l'optimisation des règles complexes."
      )
    }

    if (data.cacheHitRate < 50) {
      recommendations.push(
        '📊 Taux de cache faible. Activez le préchauffage du cache pour les articles populaires.'
      )
    }

    if (data.errorRate > 1) {
      recommendations.push(
        "⚠️ Taux d'erreur élevé. Vérifiez les règles avec formules personnalisées."
      )
    }

    // Business
    if (data.conversionRate < 30) {
      recommendations.push(
        '💡 Taux de conversion faible. Revoyez les conditions des règles pour plus de pertinence.'
      )
    }

    // Règles sous-utilisées
    const underusedRules = data.topRules.filter((r) => r.usageCount < 10)
    if (underusedRules.length > 0) {
      recommendations.push(
        `🔍 ${underusedRules.length} règles peu utilisées. Considérez leur archivage ou modification.`
      )
    }

    // Règles très efficaces
    const highPerformers = data.topRules.filter((r) => r.effectivenessScore > 80)
    if (highPerformers.length > 0) {
      recommendations.push(
        `🌟 Règles performantes: ${highPerformers.map((r) => r.ruleName).join(', ')}. Dupliquez leur logique pour d'autres segments.`
      )
    }

    return recommendations
  }

  /**
   * Export des analytics en CSV
   */
  async exportAnalytics(societeId: string, from: Date, to: Date): Promise<string> {
    const dashboard = await this.getDashboard(societeId, from, to)

    const csv: string[] = []
    csv.push('Pricing Analytics Report')
    csv.push(`Period: ${from.toISOString()} to ${to.toISOString()}`)
    csv.push('')

    csv.push('Summary')
    csv.push(`Total Calculations,${dashboard.totalCalculations}`)
    csv.push(`Total Discount Given,${dashboard.totalDiscountGiven}`)
    csv.push(`Average Discount %,${dashboard.averageDiscountPercentage.toFixed(2)}`)
    csv.push('')

    csv.push('Top Rules')
    csv.push(
      'Rule Name,Usage Count,Conversion Rate,Average Discount,Total Revenue,Effectiveness Score'
    )
    for (const rule of dashboard.topRules) {
      csv.push(
        `${rule.ruleName},${rule.usageCount},${rule.conversionRate.toFixed(2)}%,${rule.averageDiscount.toFixed(2)},${rule.totalRevenue.toFixed(2)},${rule.effectivenessScore.toFixed(2)}`
      )
    }
    csv.push('')

    csv.push('Performance Metrics')
    csv.push(
      `Average Calculation Time,${dashboard.performanceMetrics.averageCalculationTime.toFixed(2)}ms`
    )
    csv.push(`Cache Hit Rate,${dashboard.performanceMetrics.cacheHitRate.toFixed(2)}%`)
    csv.push(`Error Rate,${dashboard.performanceMetrics.errorRate.toFixed(2)}%`)
    csv.push('')

    csv.push('Recommendations')
    dashboard.recommendations.forEach((r) => {
      csv.push(r)
    })

    return csv.join('\n')
  }
}
