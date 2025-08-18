import { Article } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Not, type Repository } from 'typeorm'
import { Partner } from '../../../domains/partners/entities/partner.entity'
import type {
  MarketplaceCustomerAdapter,
  MarketplaceCustomerView,
} from '../adapters/marketplace-customer.adapter'
import type { MarketplaceOrderAdapter, OrderSyncStats } from '../adapters/marketplace-order.adapter'
import type {
  MarketplaceProductAdapter,
  MarketplaceProductView,
} from '../adapters/marketplace-product.adapter'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'

export interface ERPMarketplaceStats {
  products: {
    totalERP: number
    enabledMarketplace: number
    disabledMarketplace: number
    missingMarketplaceSettings: number
  }
  customers: {
    totalMarketplace: number
    withERPPartner: number
    withoutERPPartner: number
    pendingSync: number
  }
  orders: OrderSyncStats
  lastSyncDate?: Date
}

export interface IntegrationHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  issues: Array<{
    type: 'PRODUCT' | 'CUSTOMER' | 'ORDER' | 'SYNC'
    severity: 'INFO' | 'WARNING' | 'ERROR'
    message: string
    count?: number
    suggestion?: string
  }>
  recommendations: string[]
}

export interface SyncOperationResult {
  success: boolean
  processed: number
  errors: string[]
  duration: number
  timestamp: Date
}

/**
 * Service d'intégration entre le marketplace et l'ERP
 * Fournit une interface unifiée et des vues compatibles
 */
@Injectable()
export class ERPMarketplaceIntegrationService {
  private readonly logger = new Logger(ERPMarketplaceIntegrationService.name)

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceCustomer)
    private readonly customerRepository: Repository<MarketplaceCustomer>,
    private readonly productAdapter: MarketplaceProductAdapter,
    private readonly customerAdapter: MarketplaceCustomerAdapter,
    private readonly orderAdapter: MarketplaceOrderAdapter,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Obtenir les statistiques d'intégration ERP-Marketplace
   */
  async getIntegrationStats(tenantId: string): Promise<ERPMarketplaceStats> {
    const [productStats, customerStats, orderStats] = await Promise.all([
      this.getProductStats(tenantId),
      this.getCustomerStats(tenantId),
      this.orderAdapter.getOrderSyncStats(tenantId),
    ])

    return {
      products: productStats,
      customers: customerStats,
      orders: orderStats,
      lastSyncDate: new Date(), // À implémenter avec un cache/registry
    }
  }

  /**
   * Vérifier la santé de l'intégration
   */
  async checkIntegrationHealth(tenantId: string): Promise<IntegrationHealth> {
    const issues: IntegrationHealth['issues'] = []
    const recommendations: string[] = []

    try {
      // Vérifier les produits
      const productsWithoutSettings = await this.articleRepository.count({
        where: {
          isMarketplaceEnabled: true,
          marketplaceSettings: IsNull(),
        },
      })

      if (productsWithoutSettings > 0) {
        issues.push({
          type: 'PRODUCT',
          severity: 'WARNING',
          message: 'Products enabled for marketplace without proper settings',
          count: productsWithoutSettings,
          suggestion: 'Configure marketplace settings for these products',
        })
      }

      // Vérifier les clients
      const customersWithoutPartner = await this.customerRepository.count({
        where: {
          tenantId,
          erpPartnerId: IsNull(),
        },
      })

      if (customersWithoutPartner > 0) {
        issues.push({
          type: 'CUSTOMER',
          severity: 'WARNING',
          message: 'Marketplace customers without ERP partner',
          count: customersWithoutPartner,
          suggestion: 'Synchronize customers with ERP partners',
        })
        recommendations.push(
          'Run customer synchronization to link marketplace customers with ERP partners'
        )
      }

      // Vérifier les commandes
      const ordersWithoutPartner = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoin('order.customer', 'customer')
        .where('order.tenantId = :tenantId', { tenantId })
        .andWhere('order.status != :cartStatus', { cartStatus: 'CART' })
        .andWhere('customer.erpPartnerId IS NULL')
        .getCount()

      if (ordersWithoutPartner > 0) {
        issues.push({
          type: 'ORDER',
          severity: 'ERROR',
          message: 'Orders from customers without ERP partner',
          count: ordersWithoutPartner,
          suggestion: 'These orders cannot be processed in ERP without customer sync',
        })
        recommendations.push('Urgent: Synchronize customers to enable ERP order processing')
      }

      // Déterminer le statut général
      let status: IntegrationHealth['status'] = 'HEALTHY'

      const hasErrors = issues.some((issue) => issue.severity === 'ERROR')
      const hasWarnings = issues.some((issue) => issue.severity === 'WARNING')

      if (hasErrors) {
        status = 'CRITICAL'
      } else if (hasWarnings) {
        status = 'WARNING'
      }

      if (status === 'HEALTHY') {
        recommendations.push('Integration is running smoothly')
      }

      return {
        status,
        issues,
        recommendations,
      }
    } catch (error) {
      this.logger.error('Failed to check integration health:', error)
      return {
        status: 'CRITICAL',
        issues: [
          {
            type: 'SYNC',
            severity: 'ERROR',
            message: 'Failed to perform health check',
            suggestion: 'Check system logs and database connectivity',
          },
        ],
        recommendations: ['Investigate system errors and restore integration services'],
      }
    }
  }

  /**
   * Synchronisation complète marketplace <-> ERP
   */
  async performFullSync(tenantId: string): Promise<SyncOperationResult> {
    const startTime = Date.now()
    const timestamp = new Date()
    const errors: string[] = []
    let processed = 0

    try {
      this.logger.log(`Starting full sync for tenant ${tenantId}`)

      // Étape 1: Synchroniser les produits (Articles -> Marketplace)
      const enabledArticles = await this.articleRepository.find({
        where: {
          isMarketplaceEnabled: true,
        },
      })

      for (const article of enabledArticles) {
        try {
          // Vérifier et compléter les paramètres marketplace si manquants
          if (!article.marketplaceSettings) {
            article.marketplaceSettings = {
              basePrice: article.prixVenteHT,
              categories: [article.famille].filter(Boolean),
              description: article.description,
              images: [],
              tags: [],
            }
            await this.articleRepository.save(article)
          }
          processed++
        } catch (error) {
          errors.push(`Failed to sync product ${article.reference}: ${error.message}`)
        }
      }

      // Étape 2: Synchroniser les clients (Marketplace -> ERP Partners)
      const customersWithoutPartner = await this.customerRepository.find({
        where: {
          tenantId,
          erpPartnerId: IsNull(),
        },
      })

      for (const customer of customersWithoutPartner) {
        try {
          await this.customerAdapter.syncCustomerToPartner(tenantId, {
            customerId: customer.id,
            createPartner: true,
          })
          processed++
        } catch (error) {
          errors.push(`Failed to sync customer ${customer.email}: ${error.message}`)
        }
      }

      // Étape 3: Valider la synchronisation des commandes
      const orderSyncResult = await this.orderAdapter.syncOrdersWithERP(tenantId)
      processed += orderSyncResult.processed
      errors.push(...orderSyncResult.errors)

      // Émettre un événement de fin de synchronisation
      this.eventEmitter.emit('erp.marketplace.sync.completed', {
        tenantId,
        processed,
        errors: errors.length,
        duration: Date.now() - startTime,
        timestamp,
      })

      const success = errors.length === 0
      const duration = Date.now() - startTime

      this.logger.log(
        `Full sync completed: ${processed} items processed, ${errors.length} errors, ${duration}ms`
      )

      return {
        success,
        processed,
        errors,
        duration,
        timestamp,
      }
    } catch (error) {
      this.logger.error('Full sync failed:', error)
      return {
        success: false,
        processed,
        errors: [...errors, `Critical error: ${error.message}`],
        duration: Date.now() - startTime,
        timestamp,
      }
    }
  }

  /**
   * Obtenir une vue unifiée produit (ERP + Marketplace)
   */
  async getUnifiedProductView(
    tenantId: string,
    productId: string
  ): Promise<{
    erp: Article | null
    marketplace: MarketplaceProductView | null
    synchronized: boolean
  }> {
    const [erpArticle, marketplaceView] = await Promise.all([
      this.articleRepository.findOne({ where: { id: productId } }),
      this.productAdapter.getMarketplaceProductById(tenantId, productId),
    ])

    const synchronized = erpArticle?.isMarketplaceEnabled === true && marketplaceView !== null

    return {
      erp: erpArticle,
      marketplace: marketplaceView,
      synchronized,
    }
  }

  /**
   * Obtenir une vue unifiée client (ERP + Marketplace)
   */
  async getUnifiedCustomerView(
    tenantId: string,
    customerId: string
  ): Promise<{
    marketplace: MarketplaceCustomerView | null
    erp: Partner | null
    synchronized: boolean
  }> {
    const marketplaceCustomer = await this.customerAdapter.getMarketplaceCustomerView(
      tenantId,
      customerId
    )
    // Note: erpPartnerId is not exposed in MarketplaceCustomerView for security reasons
    // We need to check the actual customer entity for synchronization status
    const customer = await this.customerRepository.findOne({ where: { id: customerId } })
    const erpPartner = customer?.erpPartnerId
      ? await this.partnerRepository.findOne({ where: { id: customer.erpPartnerId } })
      : null

    const synchronized = customer?.erpPartnerId !== undefined && erpPartner !== null

    return {
      marketplace: marketplaceCustomer,
      erp: erpPartner,
      synchronized,
    }
  }

  /**
   * Obtenir les statistiques des produits
   */
  private async getProductStats(_tenantId: string): Promise<ERPMarketplaceStats['products']> {
    const [totalERP, enabledMarketplace, missingSettings] = await Promise.all([
      this.articleRepository.count({ where: {} }),
      this.articleRepository.count({ where: { isMarketplaceEnabled: true } }),
      this.articleRepository.count({
        where: {
          isMarketplaceEnabled: true,
          marketplaceSettings: IsNull(),
        },
      }),
    ])

    return {
      totalERP,
      enabledMarketplace,
      disabledMarketplace: totalERP - enabledMarketplace,
      missingMarketplaceSettings: missingSettings,
    }
  }

  /**
   * Obtenir les statistiques des clients
   */
  private async getCustomerStats(_tenantId: string): Promise<ERPMarketplaceStats['customers']> {
    const [totalMarketplace, withERPPartner] = await Promise.all([
      this.customerRepository.count({ where: {} }),
      this.customerRepository.count({
        where: {
          erpPartnerId: Not(IsNull()),
        },
      }),
    ])

    return {
      totalMarketplace,
      withERPPartner,
      withoutERPPartner: totalMarketplace - withERPPartner,
      pendingSync: totalMarketplace - withERPPartner, // Considéré comme en attente de sync
    }
  }
}
