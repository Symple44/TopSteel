import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Queue } from 'bull'
import type { Redis } from 'ioredis'
import type { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils/error.utils'
import { MarketplaceOrder } from '../../../features/marketplace/entities/marketplace-order.entity'
import { Article, ArticleStatus } from '../../inventory/entities/article.entity'
import { Partner, PartnerType } from '../../partners/entities/partner.entity'

interface SyncResult {
  synced: number
  failed: number
  errors: Array<{ articleId: string; error: string }>
}

interface OrderSyncPayload {
  marketplaceOrderId: string
  tenantId: string
  action: 'CREATE_ERP_DOCUMENTS' | 'UPDATE_STATUS' | 'SYNC_PAYMENT'
}

interface ArticleEventPayload {
  id: string
  tenantId: string
}

interface StockEventPayload {
  articleId: string
  tenantId: string
  quantity: number
}

interface MarketplaceOrderEventPayload {
  orderId: string
  tenantId: string
}

interface MarketplaceCustomer {
  firstName: string
  lastName: string
  email: string
  phone?: string
  defaultAddress?: {
    street: string
    postalCode: string
    city: string
    country?: string
  }
}

interface MarketplaceOrderItem {
  id: string
  productId: string
  quantity: number
  price: number
}

interface MarketplaceOrderData {
  id: string
  orderNumber: string
  items: MarketplaceOrderItem[]
  customer: MarketplaceCustomer
  paymentStatus: string
  total: number
}

interface DeliveryNoteData {
  id: string
  orderNumber: string
  partnerId: string
  status: 'pending' | 'confirmed' | 'shipped'
}

interface InvoiceData {
  id: string
  orderNumber: string
  partnerId: string
  deliveryNoteId: string
  status: 'draft' | 'confirmed' | 'paid'
  total: number
}

@Injectable()
export class MarketplaceSyncService {
  private readonly logger = new Logger(MarketplaceSyncService.name)
  private readonly SYNC_LOCK_TTL = 300 // 5 minutes

  constructor(
    @InjectRepository(Article, 'tenant')
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(MarketplaceOrder)
    private readonly marketplaceOrderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(Partner, 'tenant')
    private readonly partnerRepository: Repository<Partner>,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redisService: Redis,
    @InjectQueue('marketplace-sync')
    private readonly syncQueue: Queue
  ) {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Écoute les changements d'articles ERP
    this.eventEmitter.on('article.created', this.handleArticleCreated.bind(this))
    this.eventEmitter.on('article.updated', this.handleArticleUpdated.bind(this))
    this.eventEmitter.on('article.deleted', this.handleArticleDeleted.bind(this))

    // Écoute les changements de stock
    this.eventEmitter.on('stock.updated', this.handleStockUpdated.bind(this))

    // Écoute les commandes marketplace
    this.eventEmitter.on('marketplace.order.created', this.handleMarketplaceOrderCreated.bind(this))
    this.eventEmitter.on('marketplace.order.paid', this.handleMarketplaceOrderPaid.bind(this))
  }

  /**
   * Synchronise tous les articles ERP vers le marketplace
   */
  async syncAllArticlesToMarketplace(tenantId: string): Promise<SyncResult> {
    const lockKey = `sync:articles:${tenantId}`
    const lock = await this.acquireLock(lockKey)

    if (!lock) {
      throw new Error('Synchronization already in progress')
    }

    try {
      const articles = await this.articleRepository.find({
        where: {
          isMarketplaceEnabled: true,
          status: ArticleStatus.ACTIF,
        },
        relations: ['famille', 'materials'],
      })

      const result: SyncResult = {
        synced: 0,
        failed: 0,
        errors: [],
      }

      for (const article of articles) {
        try {
          await this.syncArticleToMarketplace(article, tenantId)
          result.synced++
        } catch (error) {
          result.failed++
          result.errors.push({
            articleId: article.id,
            error: getErrorMessage(error),
          })
          this.logger.error(`Failed to sync article ${article.id}:`, error)
        }
      }

      this.logger.log(`Sync completed: ${result.synced} synced, ${result.failed} failed`)
      return result
    } finally {
      await this.releaseLock(lockKey)
    }
  }

  /**
   * Synchronise un article ERP vers le marketplace
   */
  async syncArticleToMarketplace(article: Article, tenantId: string): Promise<void> {
    // L'article est déjà prêt pour le marketplace
    // On met juste à jour ses paramètres marketplace
    if (article.marketplaceSettings) {
      // Mise à jour des tags et SEO
      article.marketplaceSettings.tags = this.generateTags(article)
      article.marketplaceSettings.seoTitle = article.designation
      article.marketplaceSettings.seoDescription = article.description || article.designation
    } else {
      article.marketplaceSettings = {
        basePrice: article.prixVenteHT,
        categories: article.famille ? [article.famille] : [],
        description: article.description || article.designation,
        images: [],
        seoTitle: article.designation,
        seoDescription: article.description || article.designation,
        tags: this.generateTags(article),
      }
    }

    // Activer pour le marketplace si ce n'est pas déjà fait
    article.isMarketplaceEnabled = true

    await this.articleRepository.save(article)

    // Émettre événement de synchronisation
    this.eventEmitter.emit('marketplace.product.synced', {
      articleId: article.id,
      tenantId,
    })
  }

  /**
   * Synchronise une commande marketplace vers l'ERP
   */
  async syncMarketplaceOrderToERP(marketplaceOrderId: string, tenantId: string): Promise<void> {
    const order = await this.marketplaceOrderRepository.findOne({
      where: { id: marketplaceOrderId },
      relations: ['items', 'customer'],
    })

    if (!order) {
      throw new Error('Marketplace order not found')
    }

    // Créer ou récupérer le partenaire ERP
    let partner = await this.partnerRepository.findOne({
      where: { email: order.customer.email },
    })

    if (!partner) {
      partner = await this.createPartnerFromMarketplaceCustomer(order.customer, tenantId)
    }

    // Créer le bon de livraison
    const deliveryNote = await this.createDeliveryNote(order, partner, tenantId)

    // Créer la facture si la commande est payée
    if (order.paymentStatus === 'PAID') {
      await this.createInvoice(order, partner, deliveryNote, tenantId)
    }

    // Mettre à jour le statut de la commande
    // order.erpSyncStatus = 'SYNCED'; // Property not available
    // order.erpDocumentIds = {...}; // Property not available
    await this.marketplaceOrderRepository.save(order)

    this.logger.log(`Order ${marketplaceOrderId} synced to ERP successfully`)
  }

  /**
   * Gestion des événements
   */
  private async handleArticleCreated(payload: ArticleEventPayload) {
    await this.syncQueue.add('sync-article', {
      articleId: payload.id,
      tenantId: payload.tenantId,
      action: 'CREATE',
    })
  }

  private async handleArticleUpdated(payload: ArticleEventPayload) {
    await this.syncQueue.add('sync-article', {
      articleId: payload.id,
      tenantId: payload.tenantId,
      action: 'UPDATE',
    })
  }

  private async handleArticleDeleted(payload: ArticleEventPayload) {
    await this.syncQueue.add('sync-article', {
      articleId: payload.id,
      tenantId: payload.tenantId,
      action: 'DELETE',
    })
  }

  private async handleStockUpdated(payload: StockEventPayload) {
    await this.syncQueue.add('sync-stock', {
      articleId: payload.articleId,
      tenantId: payload.tenantId,
      newStock: payload.quantity,
    })
  }

  private async handleMarketplaceOrderCreated(payload: MarketplaceOrderEventPayload) {
    await this.syncQueue.add('sync-order', {
      marketplaceOrderId: payload.orderId,
      tenantId: payload.tenantId,
      action: 'CREATE_ERP_DOCUMENTS',
    } as OrderSyncPayload)
  }

  private async handleMarketplaceOrderPaid(payload: MarketplaceOrderEventPayload) {
    await this.syncQueue.add('sync-order', {
      marketplaceOrderId: payload.orderId,
      tenantId: payload.tenantId,
      action: 'SYNC_PAYMENT',
    } as OrderSyncPayload)
  }

  /**
   * Synchronisation périodique
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async performPeriodicSync() {
    this.logger.log('Starting periodic marketplace sync...')

    // Récupérer tous les tenants actifs
    const tenants = await this.getTenantsList()

    for (const tenantId of tenants) {
      await this.syncQueue.add('full-sync', {
        tenantId,
        timestamp: new Date(),
      })
    }
  }

  /**
   * Vérification de la cohérence des données
   */
  async validateDataConsistency(tenantId: string): Promise<{
    valid: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    // Vérifier les articles marketplace sans configuration
    const articlesWithoutConfig = await this.articleRepository
      .createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.isMarketplaceEnabled = true')
      .andWhere('a.marketplaceSettings IS NULL')
      .getCount()

    if (articlesWithoutConfig > 0) {
      issues.push(`${articlesWithoutConfig} marketplace articles without configuration`)
    }

    // Vérifier les écarts de stock
    const stockMismatches = await this.checkStockConsistency(tenantId)
    if (stockMismatches.length > 0) {
      issues.push(`${stockMismatches.length} products with stock mismatches`)
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }

  /**
   * Helpers privés
   */
  private async acquireLock(key: string): Promise<boolean> {
    const result = await this.redisService.set(
      `lock:${key}`,
      Date.now(),
      'EX',
      this.SYNC_LOCK_TTL,
      'NX'
    )
    return result === 'OK'
  }

  private async releaseLock(key: string): Promise<void> {
    await this.redisService.del(`lock:${key}`)
  }

  private generateTags(article: Article): string[] {
    const tags: string[] = []
    if (article.famille) tags.push(article.famille)
    if (article.sousFamille) tags.push(article.sousFamille)
    if (article.marque) tags.push(article.marque)
    // Ajouter des tags basés sur les caractéristiques
    if (article.caracteristiquesTechniques) {
      const techTags = Object.keys(article.caracteristiquesTechniques).slice(0, 3)
      tags.push(...techTags)
    }
    return [...new Set(tags)]
  }

  private async createPartnerFromMarketplaceCustomer(
    customer: MarketplaceCustomer,
    _tenantId: string
  ): Promise<Partner> {
    const partner = this.partnerRepository.create({
      type: PartnerType.CLIENT,
      denomination: `${customer.firstName} ${customer.lastName}`.trim() || customer.email,
      email: customer.email,
      telephone: customer.phone,
      adresse: customer.defaultAddress?.street,
      codePostal: customer.defaultAddress?.postalCode,
      ville: customer.defaultAddress?.city,
      pays: customer.defaultAddress?.country || 'FR',
    })

    return (await this.partnerRepository.save(partner)) as unknown as Partner
  }

  private async createDeliveryNote(
    order: MarketplaceOrderData,
    partner: Partner,
    _tenantId: string
  ): Promise<DeliveryNoteData> {
    // Création du bon de livraison - sera implémenté avec le module Documents
    // Pour le moment, retourne un placeholder pour maintenir la compatibilité
    this.logger.log(`Bon de livraison à créer pour la commande ${order.orderNumber}`)
    return {
      id: `BL-${order.orderNumber}-${Date.now()}`,
      orderNumber: order.orderNumber,
      partnerId: partner.id,
      status: 'pending',
    }
  }

  private async createInvoice(
    order: MarketplaceOrderData,
    partner: Partner,
    deliveryNote: DeliveryNoteData,
    _tenantId: string
  ): Promise<InvoiceData> {
    // Création de la facture - sera implémenté avec le module Documents
    // Pour le moment, retourne un placeholder pour maintenir la compatibilité
    this.logger.log(`Facture à créer pour la commande ${order.orderNumber}`)
    return {
      id: `FAC-${order.orderNumber}-${Date.now()}`,
      orderNumber: order.orderNumber,
      partnerId: partner.id,
      deliveryNoteId: deliveryNote.id,
      status: 'draft',
      total: order.total,
    }
  }

  private async getTenantsList(): Promise<string[]> {
    // À implémenter : récupérer la liste des tenants actifs
    return []
  }

  private async checkStockConsistency(_tenantId: string): Promise<unknown[]> {
    // À implémenter : vérifier la cohérence des stocks
    return []
  }
}
