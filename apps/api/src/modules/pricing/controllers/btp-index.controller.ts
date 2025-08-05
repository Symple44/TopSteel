import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import {
  BTPIndexService,
  IndexedPricingContext,
  IndexedPricingResult,
} from '../services/btp-index.service'
import { BTPIndex, BTPIndexType } from '../entities/btp-index.entity'
import { TenantGuard } from '../../../infrastructure/security/guards/tenant.guard'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'

// DTOs
export class CreateBTPIndexDto {
  indexType!: BTPIndexType
  indexName!: string
  indexCode!: string
  year!: number
  month!: number
  indexValue!: number
  publicationDate!: Date
  applicationDate!: Date
  isOfficial?: boolean
  isProvisional?: boolean
  indexMetadata?: any
  metadata?: any
}

export class UpdateBTPIndexDto {
  indexValue?: number
  publicationDate?: Date
  applicationDate?: Date
  isOfficial?: boolean
  isProvisional?: boolean
  indexMetadata?: any
  metadata?: any
}

export class IndexedPricingDto {
  basePrice!: number
  quantity!: number
  indexType!: BTPIndexType
  contractDate?: Date
  deliveryDate?: Date
  baseIndexValue?: number
  indexationClause?: {
    threshold?: number
    sharing?: number
    cappingMin?: number
    cappingMax?: number
  }
}

@ApiTags('BTP Indices')
@ApiBearerAuth()
@Controller('pricing/btp-indices')
@UseGuards(TenantGuard)
export class BTPIndexController {
  constructor(private readonly btpIndexService: BTPIndexService) {}

  @Post()
  @ApiOperation({ summary: 'Créer ou mettre à jour un indice BTP' })
  @ApiResponse({ status: 201, description: 'Indice créé/mis à jour', type: BTPIndex })
  async createIndex(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateBTPIndexDto
  ): Promise<BTPIndex> {
    return await this.btpIndexService.createOrUpdateIndex({
      societeId: tenantId,
      ...createDto,
    })
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les indices BTP' })
  @ApiResponse({ status: 200, description: 'Liste des indices', type: [BTPIndex] })
  async getIndices(
    @CurrentTenant() tenantId: string,
    @Query('indexType') indexType?: BTPIndexType,
    @Query('year') year?: number,
    @Query('month') month?: number
  ): Promise<BTPIndex[]> {
    // Implementation basique - à améliorer selon besoins
    const query: any = { tenantId }

    if (indexType) query.indexType = indexType
    if (year) query.year = year
    if (month) query.month = month

    // Pour l'instant, retourner une requête simple
    // Dans une vraie implémentation, utiliser le repository avec les filtres
    return []
  }

  @Get('latest/:indexType')
  @ApiOperation({ summary: 'Obtenir le dernier indice publié' })
  @ApiResponse({ status: 200, description: 'Dernier indice', type: BTPIndex })
  async getLatestIndex(
    @CurrentTenant() tenantId: string,
    @Param('indexType') indexType: BTPIndexType
  ): Promise<BTPIndex | null> {
    return await this.btpIndexService.getLatestIndex(tenantId, indexType)
  }

  @Get('for-date/:indexType')
  @ApiOperation({ summary: "Obtenir l'indice pour une date donnée" })
  @ApiResponse({ status: 200, description: 'Indice pour la date', type: BTPIndex })
  async getIndexForDate(
    @CurrentTenant() tenantId: string,
    @Param('indexType') indexType: BTPIndexType,
    @Query('date') dateStr: string
  ): Promise<BTPIndex | null> {
    const date = new Date(dateStr)
    return await this.btpIndexService.getIndexForDate(tenantId, indexType, date)
  }

  @Get('history/:indexType')
  @ApiOperation({ summary: "Obtenir l'historique d'un indice" })
  @ApiResponse({ status: 200, description: "Historique de l'indice", type: [BTPIndex] })
  async getIndexHistory(
    @CurrentTenant() tenantId: string,
    @Param('indexType') indexType: BTPIndexType,
    @Query('fromDate') fromDateStr: string,
    @Query('toDate') toDateStr: string
  ): Promise<BTPIndex[]> {
    const fromDate = new Date(fromDateStr)
    const toDate = new Date(toDateStr)

    return await this.btpIndexService.getIndexHistory(tenantId, indexType, fromDate, toDate)
  }

  @Post('calculate-indexed-price')
  @ApiOperation({ summary: 'Calculer un prix avec indexation BTP' })
  @ApiResponse({ status: 200, description: 'Prix calculé avec indexation' })
  async calculateIndexedPrice(
    @CurrentTenant() tenantId: string,
    @Body() pricingDto: IndexedPricingDto
  ): Promise<IndexedPricingResult> {
    return await this.btpIndexService.calculateIndexedPrice(tenantId, pricingDto)
  }

  @Post('setup-defaults')
  @ApiOperation({ summary: 'Créer les indices BTP par défaut' })
  @ApiResponse({ status: 201, description: 'Indices BTP créés', type: [BTPIndex] })
  async setupDefaultIndices(
    @CurrentTenant() tenantId: string
  ): Promise<BTPIndex[]> {
    return await this.btpIndexService.createDefaultBTPIndices(tenantId)
  }

  @Get('types')
  @ApiOperation({ summary: "Obtenir la liste des types d'indices BTP disponibles" })
  @ApiResponse({ status: 200, description: "Types d'indices disponibles" })
  async getIndexTypes(): Promise<Array<{ value: BTPIndexType; label: string; category: string }>> {
    return this.btpIndexService.getAvailableIndexTypes()
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un indice BTP' })
  @ApiResponse({ status: 200, description: 'Indice mis à jour', type: BTPIndex })
  async updateIndex(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBTPIndexDto
  ): Promise<BTPIndex> {
    // Implementation à compléter selon besoins
    throw new Error('Not implemented yet')
  }

  @Get('dashboard/:indexType')
  @ApiOperation({ summary: "Obtenir le tableau de bord d'un indice" })
  @ApiResponse({ status: 200, description: 'Données du tableau de bord' })
  async getIndexDashboard(
    @CurrentTenant() tenantId: string,
    @Param('indexType') indexType: BTPIndexType
  ): Promise<{
    current: BTPIndex | null
    previous: BTPIndex | null
    yearAgo: BTPIndex | null
    trend: 'up' | 'down' | 'stable'
    monthlyVariation: number
    yearlyVariation: number
    alerts: any[]
  }> {
    const current = await this.btpIndexService.getLatestIndex(tenantId, indexType)

    if (!current) {
      return {
        current: null,
        previous: null,
        yearAgo: null,
        trend: 'stable',
        monthlyVariation: 0,
        yearlyVariation: 0,
        alerts: [],
      }
    }

    // Chercher l'indice du mois précédent
    const prevDate = new Date(current.year, current.month - 2) // month-2 car month est 1-based
    const previous = await this.btpIndexService.getIndexForDate(tenantId, indexType, prevDate)

    // Chercher l'indice de l'année précédente
    const yearAgoDate = new Date(current.year - 1, current.month - 1)
    const yearAgo = await this.btpIndexService.getIndexForDate(tenantId, indexType, yearAgoDate)

    // Déterminer la tendance
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (current.monthlyVariation) {
      if (current.monthlyVariation > 0.5) trend = 'up'
      else if (current.monthlyVariation < -0.5) trend = 'down'
    }

    return {
      current,
      previous,
      yearAgo,
      trend,
      monthlyVariation: current.monthlyVariation || 0,
      yearlyVariation: current.yearlyVariation || 0,
      alerts: current.metadata?.alerts || [],
    }
  }
}
