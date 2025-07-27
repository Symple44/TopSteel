import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard'
import { 
  ProcurementPoolService, 
  RequestFilters, 
  PoolFilters 
} from '../services/procurement-pool.service'
import { PurchaseRequest } from '../entities/purchase-request.entity'
import { PurchasePool } from '../entities/purchase-pool.entity'
import { SupplierQuote } from '../entities/supplier-quote.entity'
import { Supplier } from '../entities/supplier.entity'

@ApiTags('Procurement Pool')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('procurement')
export class ProcurementPoolController {
  constructor(private readonly procurementService: ProcurementPoolService) {}

  // ===== DASHBOARD =====

  @Get('dashboard')
  @ApiOperation({ summary: 'Récupérer les statistiques du dashboard achats' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getDashboard() {
    return await this.procurementService.getDashboardStats()
  }

  // ===== DEMANDES D'ACHAT =====

  @Get('requests')
  @ApiOperation({ summary: 'Lister les demandes d\'achat avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des demandes d\'achat', type: [PurchaseRequest] })
  async getPurchaseRequests(@Query() filters: RequestFilters) {
    return await this.procurementService.findPurchaseRequests(filters)
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Récupérer une demande d\'achat par ID' })
  @ApiResponse({ status: 200, description: 'Demande d\'achat trouvée', type: PurchaseRequest })
  @ApiResponse({ status: 404, description: 'Demande d\'achat non trouvée' })
  async getPurchaseRequest(@Param('id') id: string) {
    const request = await this.procurementService.getPurchaseRequestById(id)
    if (!request) {
      throw new Error('Demande d\'achat non trouvée')
    }
    return request
  }

  @Post('requests')
  @ApiOperation({ summary: 'Créer une nouvelle demande d\'achat' })
  @ApiResponse({ status: 201, description: 'Demande d\'achat créée', type: PurchaseRequest })
  async createPurchaseRequest(@Body() requestData: Partial<PurchaseRequest>) {
    return await this.procurementService.createPurchaseRequest(requestData)
  }

  @Put('requests/:id')
  @ApiOperation({ summary: 'Mettre à jour une demande d\'achat' })
  @ApiResponse({ status: 200, description: 'Demande d\'achat mise à jour', type: PurchaseRequest })
  async updatePurchaseRequest(@Param('id') id: string, @Body() requestData: Partial<PurchaseRequest>) {
    return await this.procurementService.updatePurchaseRequest(id, requestData)
  }

  @Get('requests/:id/matching-pools')
  @ApiOperation({ summary: 'Trouver des pools compatibles pour une demande' })
  @ApiResponse({ status: 200, description: 'Pools compatibles trouvés' })
  async findMatchingPools(@Param('id') requestId: string) {
    return await this.procurementService.findMatchingPools(requestId)
  }

  // ===== POOLS D'ACHAT =====

  @Get('pools')
  @ApiOperation({ summary: 'Lister les pools d\'achat avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des pools d\'achat', type: [PurchasePool] })
  async getPurchasePools(@Query() filters: PoolFilters) {
    return await this.procurementService.findPurchasePools(filters)
  }

  @Get('pools/:id')
  @ApiOperation({ summary: 'Récupérer un pool d\'achat par ID' })
  @ApiResponse({ status: 200, description: 'Pool d\'achat trouvé', type: PurchasePool })
  @ApiResponse({ status: 404, description: 'Pool d\'achat non trouvé' })
  async getPurchasePool(@Param('id') id: string) {
    const pool = await this.procurementService.getPurchasePoolById(id)
    if (!pool) {
      throw new Error('Pool d\'achat non trouvé')
    }
    return pool
  }

  @Post('pools')
  @ApiOperation({ summary: 'Créer un nouveau pool d\'achat' })
  @ApiResponse({ status: 201, description: 'Pool d\'achat créé', type: PurchasePool })
  async createPurchasePool(@Body() poolData: Partial<PurchasePool>) {
    return await this.procurementService.createPurchasePool(poolData)
  }

  @Post('pools/:poolId/join')
  @ApiOperation({ summary: 'Rejoindre un pool d\'achat' })
  @ApiResponse({ status: 200, description: 'Pool rejoint avec succès' })
  async joinPool(
    @Param('poolId') poolId: string,
    @Body() data: { requestId: string; userId: string }
  ) {
    const participant = await this.procurementService.joinPool(poolId, data.requestId, data.userId)
    return {
      message: 'Pool rejoint avec succès',
      participation: participant
    }
  }

  @Post('pools/:id/invite-quotes')
  @ApiOperation({ summary: 'Lancer les invitations aux fournisseurs' })
  @ApiResponse({ status: 200, description: 'Invitations envoyées' })
  async inviteQuotes(@Param('id') poolId: string) {
    await this.procurementService.inviteQuotes(poolId)
    return { message: 'Invitations envoyées aux fournisseurs' }
  }

  @Get('pools/:id/quotes')
  @ApiOperation({ summary: 'Récupérer les devis pour un pool' })
  @ApiResponse({ status: 200, description: 'Liste des devis', type: [SupplierQuote] })
  async getPoolQuotes(@Param('id') poolId: string) {
    return await this.procurementService.evaluateQuotes(poolId)
  }

  @Post('pools/:poolId/select-quote/:quoteId')
  @ApiOperation({ summary: 'Sélectionner le devis gagnant' })
  @ApiResponse({ status: 200, description: 'Devis sélectionné' })
  async selectWinningQuote(
    @Param('poolId') poolId: string,
    @Param('quoteId') quoteId: string,
    @Body() data: { userId: string }
  ) {
    await this.procurementService.selectWinningQuote(poolId, quoteId, data.userId)
    return { message: 'Devis sélectionné avec succès' }
  }

  // ===== FOURNISSEURS =====

  @Get('suppliers')
  @ApiOperation({ summary: 'Lister les fournisseurs' })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs', type: [Supplier] })
  async getSuppliers(@Query('category') category?: string) {
    return await this.procurementService.findSuppliers(category as any)
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Créer un nouveau fournisseur' })
  @ApiResponse({ status: 201, description: 'Fournisseur créé', type: Supplier })
  async createSupplier(@Body() supplierData: Partial<Supplier>) {
    return await this.procurementService.createSupplier(supplierData)
  }

  // ===== DEVIS =====

  @Post('quotes')
  @ApiOperation({ summary: 'Soumettre un devis fournisseur' })
  @ApiResponse({ status: 201, description: 'Devis soumis', type: SupplierQuote })
  async createSupplierQuote(@Body() quoteData: Partial<SupplierQuote>) {
    return await this.procurementService.createSupplierQuote(quoteData)
  }

  // ===== RAPPORTS ET ANALYSES =====

  @Get('reports/savings')
  @ApiOperation({ summary: 'Rapport des économies réalisées' })
  @ApiResponse({ status: 200, description: 'Rapport des économies' })
  async getSavingsReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    return await this.procurementService.generateSavingsReport(start, end)
  }

  @Get('analytics/category-performance')
  @ApiOperation({ summary: 'Performance par catégorie de produits' })
  @ApiResponse({ status: 200, description: 'Performance par catégorie' })
  async getCategoryPerformance() {
    // TODO: Calculer depuis les vraies données de pools terminés
    return {
      message: 'Analytics non disponibles - données réelles de pools requises'
    }
  }

  @Get('analytics/supplier-ranking')
  @ApiOperation({ summary: 'Classement des fournisseurs' })
  @ApiResponse({ status: 200, description: 'Classement des fournisseurs' })
  async getSupplierRanking() {
    // TODO: Calculer depuis les vraies données de fournisseurs et devis
    return {
      message: 'Analytics non disponibles - historique réel de devis requis'
    }
  }

  @Get('analytics/pool-trends')
  @ApiOperation({ summary: 'Tendances des pools d\'achat' })
  @ApiResponse({ status: 200, description: 'Tendances des pools' })
  async getPoolTrends() {
    // TODO: Analyser depuis l'historique réel des pools
    return {
      message: 'Analytics non disponibles - historique réel des pools requis'
    }
  }

  @Get('simulation/pool-potential')
  @ApiOperation({ summary: 'Simuler le potentiel d\'un nouveau pool' })
  @ApiResponse({ status: 200, description: 'Simulation du potentiel' })
  async simulatePoolPotential(
    @Query('category') category: string,
    @Query('quantity') quantity: string,
    @Query('budget') budget: string
  ) {
    // TODO: Baser la simulation sur de vraies données historiques
    return {
      message: 'Simulation non disponible - historique réel de pools requis pour calculs précis'
    }
  }
}