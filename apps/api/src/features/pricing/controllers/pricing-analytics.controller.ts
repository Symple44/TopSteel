import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { Roles } from '../../../core/common/decorators/roles.decorator'
import { PricingAnalyticsService } from '../services/pricing-analytics.service'
import type { AuthenticatedUser } from '../types/auth.types'

@ApiTags('Pricing Analytics')
@Controller('pricing/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PricingAnalyticsController {
  private readonly logger = new Logger(PricingAnalyticsController.name)
  
  constructor(
    private readonly analyticsService: PricingAnalyticsService
  ) {}
  
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Récupère le dashboard analytics', 
    description: 'Tableau de bord complet avec métriques, règles populaires et recommandations'
  })
  @ApiQuery({ name: 'from', type: Date, description: 'Date de début' })
  @ApiQuery({ name: 'to', type: Date, description: 'Date de fin' })
  @ApiResponse({ status: 200, description: 'Dashboard récupéré avec succès' })
  async getDashboard(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()
    this.logger.log(`Dashboard analytics demandé par ${user.email} pour période ${fromDate.toISOString()} - ${toDate.toISOString()}`)
    
    try {
      const dashboard = await this.analyticsService.getDashboard(
        user.societeId || user.currentSocieteId || 'default',
        fromDate,
        toDate
      )
      
      this.logger.log(`Dashboard généré: ${dashboard.totalCalculations} calculs analysés`)
      
      return dashboard
    } catch (error) {
      this.logger.error('Erreur génération dashboard:', error)
      throw error
    }
  }
  
  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Exporte les analytics en CSV', 
    description: 'Export détaillé des métriques pour analyse externe'
  })
  @ApiQuery({ name: 'from', type: Date })
  @ApiQuery({ name: 'to', type: Date })
  @ApiResponse({ 
    status: 200, 
    description: 'Export CSV généré',
    schema: { type: 'string' }
  })
  @Roles('ADMIN', 'MANAGER')
  async exportAnalytics(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()
    this.logger.log(`Export analytics demandé par ${user.email}`)
    
    try {
      const csvData = await this.analyticsService.exportAnalytics(
        user.societeId || user.currentSocieteId || 'default',
        fromDate,
        toDate
      )
      
      return {
        data: csvData,
        filename: `pricing-analytics-${fromDate.toISOString().split('T')[0]}-${toDate.toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv'
      }
    } catch (error) {
      this.logger.error('Erreur export analytics:', error)
      throw error
    }
  }
  
  @Get('rules/performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Performance des règles individuelles',
    description: 'Analyse détaillée de chaque règle: usage, conversion, impact'
  })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Performance des règles' })
  async getRulesPerformance(
    @Query('limit') limit: number = 20,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const dashboard = await this.analyticsService.getDashboard(
        user.societeId || user.currentSocieteId || 'default',
        thirtyDaysAgo,
        new Date()
      )
      
      return {
        rules: dashboard.topRules.slice(0, limit),
        summary: {
          totalRules: dashboard.topRules.length,
          averageEffectiveness: dashboard.topRules.reduce((sum, rule) => sum + rule.effectivenessScore, 0) / dashboard.topRules.length,
          topPerformer: dashboard.topRules[0]?.ruleName || 'Aucune règle'
        }
      }
    } catch (error) {
      this.logger.error('Erreur performance règles:', error)
      throw error
    }
  }
  
  @Get('insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Insights et recommandations automatiques',
    description: 'Recommandations basées sur l\'analyse des données'
  })
  @ApiResponse({ status: 200, description: 'Insights générés' })
  async getInsights(
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const dashboard = await this.analyticsService.getDashboard(
        user.societeId || user.currentSocieteId || 'default',
        sevenDaysAgo,
        new Date()
      )
      
      // Générer des insights personnalisés
      const insights = {
        performance: {
          trend: dashboard.conversionFunnel.conversionRate > 50 ? 'positive' : 'negative',
          conversionRate: dashboard.conversionFunnel.conversionRate,
          topChannel: Object.entries(dashboard.rulesByChannel)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'ERP'
        },
        opportunities: [],
        alerts: []
      }
      
      // Opportunités d'amélioration
      if (dashboard.performanceMetrics.cacheHitRate < 70) {
        insights.opportunities.push({
          type: 'performance',
          priority: 'high',
          message: `Taux de cache faible (${dashboard.performanceMetrics.cacheHitRate.toFixed(1)}%). Activez le préchauffage.`,
          action: 'configure_cache_warmup'
        })
      }
      
      const underusedRules = dashboard.topRules.filter(r => r.usageCount < 5)
      if (underusedRules.length > 0) {
        insights.opportunities.push({
          type: 'business',
          priority: 'medium',
          message: `${underusedRules.length} règles peu utilisées. Revoyez leurs conditions.`,
          action: 'review_rules',
          data: { ruleIds: underusedRules.map(r => r.ruleId) }
        })
      }
      
      // Alertes
      if (dashboard.performanceMetrics.errorRate > 1) {
        insights.alerts.push({
          type: 'error',
          severity: 'high',
          message: `Taux d'erreur élevé: ${dashboard.performanceMetrics.errorRate.toFixed(1)}%`,
          action: 'investigate_errors'
        })
      }
      
      return insights
    } catch (error) {
      this.logger.error('Erreur génération insights:', error)
      throw error
    }
  }
}