import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, In } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PurchaseRequest, RequestStatus, ProductCategory } from '../entities/purchase-request.entity'
import { PurchasePool, PoolStatus } from '../entities/purchase-pool.entity'
import { SupplierQuote, QuoteStatus } from '../entities/supplier-quote.entity'
import { PoolParticipant, ParticipationStatus } from '../entities/pool-participant.entity'
import { Supplier, SupplierStatus } from '../entities/supplier.entity'

export interface RequestFilters {
  status?: RequestStatus
  category?: ProductCategory
  priority?: string
  userId?: string
  minBudget?: number
  maxBudget?: number
}

export interface PoolFilters {
  status?: PoolStatus
  category?: ProductCategory
  canJoin?: boolean
  minParticipants?: number
}

export interface MatchingResult {
  pools: PurchasePool[]
  compatibilityScores: { [poolId: string]: number }
  recommendations: string[]
}

@Injectable()
export class ProcurementPoolService {
  private readonly logger = new Logger(ProcurementPoolService.name)

  constructor(
    @InjectRepository(PurchaseRequest, 'tenant')
    private readonly requestRepository: Repository<PurchaseRequest>,
    @InjectRepository(PurchasePool, 'tenant')
    private readonly poolRepository: Repository<PurchasePool>,
    @InjectRepository(SupplierQuote, 'tenant')
    private readonly quoteRepository: Repository<SupplierQuote>,
    @InjectRepository(PoolParticipant, 'tenant')
    private readonly participantRepository: Repository<PoolParticipant>,
    @InjectRepository(Supplier, 'tenant')
    private readonly supplierRepository: Repository<Supplier>
  ) {}

  // ===== GESTION DES DEMANDES D'ACHAT =====

  async createPurchaseRequest(data: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    const request = PurchaseRequest.create(data)
    return await this.requestRepository.save(request)
  }

  async findPurchaseRequests(filters?: RequestFilters): Promise<PurchaseRequest[]> {
    const queryBuilder = this.requestRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.pool', 'pool')
      .leftJoinAndSelect('request.participations', 'participations')
      .where('request.isActive = :isActive', { isActive: true })

    if (filters) {
      if (filters.status) {
        queryBuilder.andWhere('request.status = :status', { status: filters.status })
      }
      if (filters.category) {
        queryBuilder.andWhere('request.category = :category', { category: filters.category })
      }
      if (filters.userId) {
        queryBuilder.andWhere('request.requestedBy = :userId', { userId: filters.userId })
      }
      if (filters.minBudget) {
        queryBuilder.andWhere('request.estimatedBudget >= :minBudget', { minBudget: filters.minBudget })
      }
      if (filters.maxBudget) {
        queryBuilder.andWhere('request.estimatedBudget <= :maxBudget', { maxBudget: filters.maxBudget })
      }
    }

    return await queryBuilder
      .orderBy('request.createdAt', 'DESC')
      .getMany()
  }

  async getPurchaseRequestById(id: string): Promise<PurchaseRequest | null> {
    return await this.requestRepository.findOne({
      where: { id, isActive: true },
      relations: ['pool', 'participations', 'participations.pool']
    })
  }

  async updatePurchaseRequest(id: string, data: Partial<PurchaseRequest>): Promise<PurchaseRequest> {
    await this.requestRepository.update(id, data)
    const updated = await this.getPurchaseRequestById(id)
    if (!updated) {
      throw new Error('Purchase request not found after update')
    }
    return updated
  }

  // ===== GESTION DES POOLS =====

  async createPurchasePool(data: Partial<PurchasePool>): Promise<PurchasePool> {
    const pool = PurchasePool.create(data)
    return await this.poolRepository.save(pool)
  }

  async findPurchasePools(filters?: PoolFilters): Promise<PurchasePool[]> {
    const queryBuilder = this.poolRepository.createQueryBuilder('pool')
      .leftJoinAndSelect('pool.requests', 'requests')
      .leftJoinAndSelect('pool.participants', 'participants')
      .leftJoinAndSelect('pool.quotes', 'quotes')
      .where('pool.isActive = :isActive', { isActive: true })

    if (filters) {
      if (filters.status) {
        queryBuilder.andWhere('pool.status = :status', { status: filters.status })
      }
      if (filters.category) {
        queryBuilder.andWhere('pool.category = :category', { category: filters.category })
      }
      if (filters.canJoin) {
        queryBuilder.andWhere('pool.status = :formingStatus', { formingStatus: PoolStatus.FORMING })
        queryBuilder.andWhere('pool.formationDeadline > :now', { now: new Date() })
        queryBuilder.andWhere('pool.currentParticipants < pool.maxParticipants')
      }
      if (filters.minParticipants) {
        queryBuilder.andWhere('pool.currentParticipants >= :minParticipants', { 
          minParticipants: filters.minParticipants 
        })
      }
    }

    return await queryBuilder
      .orderBy('pool.formationDeadline', 'ASC')
      .getMany()
  }

  async getPurchasePoolById(id: string): Promise<PurchasePool | null> {
    return await this.poolRepository.findOne({
      where: { id, isActive: true },
      relations: ['requests', 'participants', 'participants.request', 'quotes', 'quotes.supplier']
    })
  }

  async joinPool(poolId: string, requestId: string, userId: string): Promise<PoolParticipant> {
    const pool = await this.getPurchasePoolById(poolId)
    const request = await this.getPurchaseRequestById(requestId)

    if (!pool) {
      throw new NotFoundException('Pool non trouvé')
    }

    if (!request) {
      throw new NotFoundException('Demande d\'achat non trouvée')
    }

    if (!pool.canAcceptNewParticipants()) {
      throw new BadRequestException('Le pool ne peut plus accepter de nouveaux participants')
    }

    if (!request.canJoinPool(pool)) {
      throw new BadRequestException('Cette demande ne peut pas rejoindre ce pool')
    }

    // Créer la participation
    const participant = PoolParticipant.create({
      poolId,
      requestId,
      userId,
      userName: request.requestedByName,
      company: request.department || 'N/A',
      committedQuantity: request.quantity,
      maxBudget: request.maxBudget,
      deliveryAddress: request.deliveryAddress
    })

    const savedParticipant = await this.participantRepository.save(participant)

    // Mettre à jour les statuts
    request.updateStatus(RequestStatus.IN_POOL, userId)
    request.poolId = poolId
    await this.requestRepository.save(request)

    pool.currentParticipants++
    pool.updateTotals()
    await this.poolRepository.save(pool)

    return savedParticipant
  }

  // ===== MATCHING ET RECOMMANDATIONS =====

  async findMatchingPools(requestId: string): Promise<MatchingResult> {
    const request = await this.getPurchaseRequestById(requestId)
    if (!request) {
      throw new NotFoundException('Demande non trouvée')
    }

    const availablePools = await this.findPurchasePools({
      status: PoolStatus.FORMING,
      category: request.category,
      canJoin: true
    })

    const compatibilityScores: { [poolId: string]: number } = {}
    const recommendations: string[] = []

    for (const pool of availablePools) {
      const score = this.calculateCompatibilityScore(request, pool)
      compatibilityScores[pool.id] = score

      if (score >= 70) {
        recommendations.push(`Pool "${pool.title}" - Compatibilité ${score}%`)
      }
    }

    // Trier les pools par score de compatibilité
    availablePools.sort((a, b) => compatibilityScores[b.id] - compatibilityScores[a.id])

    return {
      pools: availablePools,
      compatibilityScores,
      recommendations
    }
  }

  private calculateCompatibilityScore(request: PurchaseRequest, pool: PurchasePool): number {
    let score = 0

    // Catégorie (obligatoire)
    if (request.category === pool.category) {
      score += 30
    } else {
      return 0 // Incompatible
    }

    // Date de livraison
    const requestDelivery = request.desiredDeliveryDate.getTime()
    const poolDelivery = pool.targetDeliveryDate.getTime()
    const deliveryDiff = Math.abs(requestDelivery - poolDelivery) / (1000 * 60 * 60 * 24) // en jours

    if (deliveryDiff <= 7) {
      score += 25
    } else if (deliveryDiff <= 14) {
      score += 15
    } else if (deliveryDiff <= 30) {
      score += 5
    }

    // Quantité (synergie)
    const quantityRatio = request.quantity / (pool.totalQuantity + request.quantity)
    if (quantityRatio >= 0.1 && quantityRatio <= 0.5) {
      score += 20 // Bonne complémentarité
    } else if (quantityRatio < 0.1) {
      score += 10 // Petite contribution
    }

    // Spécifications communes
    if (pool.commonSpecifications && request.specifications) {
      const commonSpecs = Object.keys(pool.commonSpecifications).filter(key =>
        request.specifications[key] === pool.commonSpecifications[key]
      )
      score += Math.min(15, commonSpecs.length * 3)
    }

    // Localisation (si delivery address similaire)
    if (request.deliveryAddress && pool.preferredDeliveryLocation) {
      const sameRegion = this.isSameRegion(request.deliveryAddress, pool.preferredDeliveryLocation)
      if (sameRegion) {
        score += 10
      }
    }

    return Math.min(100, score)
  }

  private isSameRegion(address1: string, address2: string): boolean {
    // Logique simplifiée de comparaison régionale
    const region1 = address1.toLowerCase().split(',').pop()?.trim()
    const region2 = address2.toLowerCase().split(',').pop()?.trim()
    return region1 === region2
  }

  // ===== GESTION DES FOURNISSEURS =====

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const supplier = Supplier.create(data)
    return await this.supplierRepository.save(supplier)
  }

  async findSuppliers(category?: ProductCategory): Promise<Supplier[]> {
    const queryBuilder = this.supplierRepository.createQueryBuilder('supplier')
      .where('supplier.isActive = :isActive', { isActive: true })
      .andWhere('supplier.status = :status', { status: SupplierStatus.ACTIVE })

    if (category) {
      queryBuilder.andWhere(':category = ANY(supplier.categories)', { category })
    }

    return await queryBuilder
      .orderBy('supplier.overallRating', 'DESC')
      .getMany()
  }

  async inviteQuotes(poolId: string): Promise<void> {
    const pool = await this.getPurchasePoolById(poolId)
    if (!pool) {
      throw new NotFoundException('Pool non trouvé')
    }

    const eligibleSuppliers = await this.findEligibleSuppliersForPool(pool)
    
    for (const supplier of eligibleSuppliers) {
      // Envoyer invitation (simulation)
      this.logger.log(`Invitation envoyée à ${supplier.companyName} pour le pool ${pool.poolNumber}`)
    }

    pool.updateStatus(PoolStatus.NEGOTIATING)
    await this.poolRepository.save(pool)
  }

  private async findEligibleSuppliersForPool(pool: PurchasePool): Promise<Supplier[]> {
    return await this.supplierRepository.find({
      where: {
        isActive: true,
        status: SupplierStatus.ACTIVE,
        acceptsPoolPurchases: true,
        categories: In([pool.category])
      },
      order: { overallRating: 'DESC' },
      take: 10 // Limiter à 10 fournisseurs
    })
  }

  // ===== GESTION DES DEVIS =====

  async createSupplierQuote(data: Partial<SupplierQuote>): Promise<SupplierQuote> {
    const quote = SupplierQuote.create(data)
    const savedQuote = await this.quoteRepository.save(quote)

    // Mettre à jour le compteur de devis du pool
    if (data.poolId) {
      const pool = await this.getPurchasePoolById(data.poolId)
      if (pool) {
        pool.quotesReceived++
        await this.poolRepository.save(pool)
      }
    }

    return savedQuote
  }

  async evaluateQuotes(poolId: string): Promise<SupplierQuote[]> {
    const quotes = await this.quoteRepository.find({
      where: { poolId, status: QuoteStatus.SUBMITTED },
      relations: ['supplier']
    })

    // Calculer les scores de compétitivité
    for (const quote of quotes) {
      const competitors = quotes.filter(q => q.id !== quote.id)
      quote.calculateScores(competitors)
      await this.quoteRepository.save(quote)
    }

    return quotes.sort((a, b) => b.overallScore - a.overallScore)
  }

  async selectWinningQuote(poolId: string, quoteId: string, userId: string): Promise<void> {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: ['supplier', 'pool']
    })

    if (!quote) {
      throw new NotFoundException('Devis non trouvé')
    }

    const pool = quote.pool
    
    // Sélectionner le fournisseur
    pool.selectSupplier(quote.supplierId, quote.supplier.companyName, quote.totalPrice)
    await this.poolRepository.save(pool)

    // Mettre à jour le statut du devis
    quote.updateStatus(QuoteStatus.ACCEPTED, userId)
    await this.quoteRepository.save(quote)

    // Rejeter les autres devis
    const otherQuotes = await this.quoteRepository.find({
      where: { poolId, status: QuoteStatus.SUBMITTED }
    })

    for (const otherQuote of otherQuotes) {
      if (otherQuote.id !== quoteId) {
        otherQuote.updateStatus(QuoteStatus.REJECTED, userId, 'Autre devis sélectionné')
        await this.quoteRepository.save(otherQuote)
      }
    }

    // Allouer les quantités aux participants
    await this.allocateQuantitiesToParticipants(poolId)
  }

  private async allocateQuantitiesToParticipants(poolId: string): Promise<void> {
    const participants = await this.participantRepository.find({
      where: { poolId, status: ParticipationStatus.ACTIVE }
    })

    const pool = await this.getPurchasePoolById(poolId)
    if (!pool || !pool.finalPrice) return

    for (const participant of participants) {
      participant.allocateQuantity(participant.committedQuantity, pool.finalPrice / pool.totalQuantity)
      participant.generateOrderNumber()
      await this.participantRepository.save(participant)
    }
  }

  // ===== PROCESSUS AUTOMATIQUES =====

  @Cron(CronExpression.EVERY_HOUR)
  async processPoolFormations(): Promise<void> {
    this.logger.log('Vérification des formations de pools...')

    const formingPools = await this.poolRepository.find({
      where: {
        status: PoolStatus.FORMING,
        formationDeadline: Between(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date()),
        isActive: true
      }
    })

    for (const pool of formingPools) {
      if (pool.isReadyForNegotiation()) {
        pool.updateStatus(PoolStatus.READY)
        await this.poolRepository.save(pool)
        
        this.logger.log(`Pool ${pool.poolNumber} prêt pour négociation`)
        
        // Lancer automatiquement les invitations
        if (pool.automaticNegotiation) {
          await this.inviteQuotes(pool.id)
        }
      } else if (pool.isExpired()) {
        pool.updateStatus(PoolStatus.CANCELLED)
        await this.poolRepository.save(pool)
        
        this.logger.log(`Pool ${pool.poolNumber} annulé - participants insuffisants`)
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async generateDailySummary(): Promise<void> {
    const stats = await this.getDashboardStats()
    this.logger.log(`Résumé quotidien: ${stats.activePools} pools actifs, ${stats.pendingRequests} demandes en attente`)
  }

  // ===== STATISTIQUES ET RAPPORTS =====

  async getDashboardStats(): Promise<any> {
    const [
      totalRequests,
      pendingRequests,
      activePools,
      totalSavings,
      averageSavings
    ] = await Promise.all([
      this.requestRepository.count({ where: { isActive: true } }),
      this.requestRepository.count({ where: { status: RequestStatus.SEEKING_POOL, isActive: true } }),
      this.poolRepository.count({ where: { status: PoolStatus.FORMING, isActive: true } }),
      this.poolRepository
        .createQueryBuilder('pool')
        .select('SUM(pool.totalSavings)', 'total')
        .where('pool.totalSavings IS NOT NULL')
        .getRawOne()
        .then(result => result.total || 0),
      this.poolRepository
        .createQueryBuilder('pool')
        .select('AVG(pool.averageSavings)', 'average')
        .where('pool.averageSavings IS NOT NULL')
        .getRawOne()
        .then(result => result.average || 0)
    ])

    const categoryStats = await this.requestRepository
      .createQueryBuilder('request')
      .select('request.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(request.estimatedBudget)', 'avgBudget')
      .where('request.isActive = :isActive', { isActive: true })
      .groupBy('request.category')
      .getRawMany()

    return {
      overview: {
        totalRequests,
        pendingRequests,
        activePools,
        totalSavings: parseFloat(totalSavings),
        averageSavings: parseFloat(averageSavings)
      },
      categories: categoryStats,
      trends: {
        // Données simulées pour les tendances
        monthlyRequests: [45, 52, 48, 61, 55, 67],
        monthlySavings: [15420, 18650, 22340, 19850, 25600, 28900]
      }
    }
  }

  async generateSavingsReport(startDate: Date, endDate: Date): Promise<any> {
    const completedPools = await this.poolRepository.find({
      where: {
        status: PoolStatus.DELIVERED,
        createdAt: Between(startDate, endDate),
        isActive: true
      },
      relations: ['participants']
    })

    const totalSavings = completedPools.reduce((sum, pool) => sum + (pool.totalSavings || 0), 0)
    const totalOrders = completedPools.reduce((sum, pool) => sum + pool.participants.length, 0)

    return {
      period: { startDate, endDate },
      summary: {
        totalPools: completedPools.length,
        totalSavings,
        totalOrders,
        averageSavingsPerPool: totalSavings / completedPools.length,
        averageSavingsPerOrder: totalSavings / totalOrders
      },
      pools: completedPools.map(pool => ({
        poolNumber: pool.poolNumber,
        category: pool.category,
        participants: pool.currentParticipants,
        totalBudget: pool.totalBudget,
        finalPrice: pool.finalPrice,
        savings: pool.totalSavings,
        savingsPercentage: pool.averageSavings
      }))
    }
  }
}