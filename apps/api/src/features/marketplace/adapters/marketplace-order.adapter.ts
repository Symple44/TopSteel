import { Article } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Not, type Repository } from 'typeorm'
import { Partner } from '../../../domains/partners/entities/partner.entity'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity'

export interface ERPOrderView {
  id: string
  orderNumber: string
  status: string
  // Client ERP
  partnerId?: string
  partnerCode?: string
  partnerName?: string
  // Articles ERP
  items: Array<{
    articleId: string
    articleReference: string
    articleDesignation: string
    quantity: number
    unitPrice: number
    totalPrice: number
    unitStock: string
  }>
  // Montants
  subtotalHT: number
  taxAmount: number
  totalTTC: number
  shippingCost: number
  discountAmount: number
  // Adresses
  shippingAddress?: any
  billingAddress?: any
  // Dates
  orderDate: Date
  deliveryDate?: Date
  // Métadonnées ERP
  erpMetadata?: {
    paymentMethod?: string
    paymentStatus?: string
    conditions?: string
    notes?: string
    commercialReference?: string
  }
}

export interface MarketplaceOrderFilters {
  customerId?: string
  status?: string
  paymentStatus?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string // order number, customer name
}

export interface OrderSyncStats {
  totalOrders: number
  withERPPartner: number
  withoutERPPartner: number
  processed: number
  failed: number
}

/**
 * Adapter pour convertir les commandes marketplace en vue ERP
 * Prépare l'intégration future avec le système de commandes ERP
 */
@Injectable()
export class MarketplaceOrderAdapter {
  private readonly logger = new Logger(MarketplaceOrderAdapter.name)

  constructor(
    @InjectRepository(MarketplaceOrder)
    private readonly orderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceOrderItem)
    private readonly orderItemRepository: Repository<MarketplaceOrderItem>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Partner) readonly _partnerRepository: Repository<Partner>,
    @InjectRepository(MarketplaceCustomer)
    readonly _customerRepository: Repository<MarketplaceCustomer>
  ) {}

  /**
   * Convertir une commande marketplace en vue ERP
   */
  async getERPOrderView(tenantId: string, orderId: string): Promise<ERPOrderView | null> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, tenantId },
      relations: ['items', 'customer', 'customer.erpPartner'],
    })

    if (!order) {
      return null
    }

    return await this.convertToERPView(order)
  }

  /**
   * Obtenir toutes les commandes en vue ERP avec filtres
   */
  async getERPOrdersView(
    tenantId: string,
    filters: MarketplaceOrderFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{
    orders: ERPOrderView[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('customer.erpPartner', 'partner')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.status != :cartStatus', { cartStatus: 'CART' }) // Exclure les paniers

    // Appliquer les filtres
    if (filters.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId: filters.customerId })
    }

    if (filters.status) {
      queryBuilder.andWhere('order.status = :status', { status: filters.status })
    }

    if (filters.paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      })
    }

    if (filters.dateFrom) {
      queryBuilder.andWhere('order.createdAt >= :dateFrom', { dateFrom: filters.dateFrom })
    }

    if (filters.dateTo) {
      queryBuilder.andWhere('order.createdAt <= :dateTo', { dateTo: filters.dateTo })
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(order.orderNumber ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${filters.search}%` }
      )
    }

    const total = await queryBuilder.getCount()

    queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)

    const orders = await queryBuilder.getMany()
    const erpOrders = await Promise.all(orders.map((order) => this.convertToERPView(order)))

    return {
      orders: erpOrders,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    }
  }

  /**
   * Obtenir les statistiques de synchronisation ERP
   */
  async getOrderSyncStats(tenantId: string): Promise<OrderSyncStats> {
    const totalOrders = await this.orderRepository.count({
      where: {
        tenantId,
        status: Not('CART'), // Exclure les paniers
      },
    })

    const ordersWithPartner = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.customer', 'customer')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.status != :cartStatus', { cartStatus: 'CART' })
      .andWhere('customer.erpPartnerId IS NOT NULL')
      .getCount()

    return {
      totalOrders,
      withERPPartner: ordersWithPartner,
      withoutERPPartner: totalOrders - ordersWithPartner,
      processed: ordersWithPartner, // Considéré comme traité si lié à un partenaire ERP
      failed: 0, // À implémenter si nécessaire
    }
  }

  /**
   * Synchroniser toutes les commandes avec les partenaires ERP
   */
  async syncOrdersWithERP(tenantId: string): Promise<{
    processed: number
    errors: string[]
  }> {
    const orders = await this.orderRepository.find({
      where: {
        tenantId,
        status: Not('CART'),
      },
      relations: ['customer'],
    })

    let processed = 0
    const errors: string[] = []

    for (const order of orders) {
      try {
        if (!order.customer.erpPartnerId) {
          // Le client n'a pas de partenaire ERP - créer ou synchroniser
          this.logger.warn(`Order ${order.orderNumber} customer has no ERP partner`)
          errors.push(`Order ${order.orderNumber}: Customer has no ERP partner`)
          continue
        }

        // Vérifier que les articles des commandes sont bien des articles ERP
        const items = await this.orderItemRepository.find({
          where: { orderId: order.id },
        })

        for (const item of items) {
          // Les articles marketplace seront maintenant synchronisés avec les articles ERP
          // Nous devons vérifier via l'ID du produit marketplace
          this.logger.debug(`Checking item ${item.productId} for order ${order.orderNumber}`)
        }

        processed++
      } catch (error) {
        this.logger.error(`Failed to sync order ${order.orderNumber}:`, error)
        errors.push(`Order ${order.orderNumber}: ${error.message}`)
      }
    }

    this.logger.log(`Processed ${processed} orders, ${errors.length} errors`)
    return { processed, errors }
  }

  /**
   * Créer une commande ERP à partir d'une commande marketplace
   * (Fonction de préparation pour future intégration)
   */
  async prepareERPOrderData(marketplaceOrder: MarketplaceOrder): Promise<any> {
    // Cette fonction prépare les données pour créer une commande ERP
    // Elle sera utilisée quand le module commandes ERP sera implémenté

    const items = await this.orderItemRepository.find({
      where: { orderId: marketplaceOrder.id },
    })

    const erpOrderData = {
      // Données de base
      numeroCommande: marketplaceOrder.orderNumber,
      dateCommande: marketplaceOrder.createdAt,
      clientId: marketplaceOrder.customer?.erpPartnerId,

      // Articles
      lignes: await Promise.all(
        items.map(async (item) => {
          // Note: Avec la nouvelle architecture, productId référence maintenant un Article ERP
          const article = await this.articleRepository.findOne({
            where: { id: item.productId },
          })

          return {
            articleId: item.productId,
            articleReference: article?.reference || 'UNKNOWN',
            designation: article?.designation || 'Unknown Product',
            quantite: item.quantity,
            prixUnitaireHT: item.price,
            montantHT: item.totalPrice,
            tauxTVA: article?.tauxTVA || 20,
          }
        })
      ),

      // Montants
      sousTotal: marketplaceOrder.subtotal,
      montantTVA: marketplaceOrder.tax,
      fraisLivraison: marketplaceOrder.shippingCost,
      remise: marketplaceOrder.discountAmount,
      totalTTC: marketplaceOrder.total,

      // Adresses
      adresseLivraison: marketplaceOrder.shippingAddress,
      adresseFacturation: marketplaceOrder.billingAddress,

      // Statut et paiement
      statut: this.mapMarketplaceStatusToERP(marketplaceOrder.status),
      statutPaiement: this.mapPaymentStatusToERP(marketplaceOrder.paymentStatus),
      modePaiement: marketplaceOrder.paymentMethod,

      // Métadonnées
      notes: marketplaceOrder.notes,
      metadonnees: {
        sourceMarketplace: true,
        marketplaceOrderId: marketplaceOrder.id,
        paymentProvider: marketplaceOrder.paymentProvider,
        appliedPromotions: marketplaceOrder.appliedPromotions,
      },
    }

    return erpOrderData
  }

  /**
   * Convertir une commande marketplace en vue ERP
   */
  private async convertToERPView(order: MarketplaceOrder): Promise<ERPOrderView> {
    const items = await this.orderItemRepository.find({
      where: { orderId: order.id },
    })

    const erpItems = await Promise.all(
      items.map(async (item) => {
        // Avec la nouvelle architecture, productId référence directement un Article ERP
        const article = await this.articleRepository.findOne({
          where: { id: item.productId },
        })

        return {
          articleId: item.productId,
          articleReference: article?.reference || 'UNKNOWN',
          articleDesignation: article?.designation || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.totalPrice,
          unitStock: article?.uniteStock || 'PCS',
        }
      })
    )

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: this.mapMarketplaceStatusToERP(order.status),
      partnerId: order.customer?.erpPartnerId,
      partnerCode: order.customer?.erpPartner?.code,
      partnerName:
        order.customer?.erpPartner?.denomination ||
        `${order.customer?.firstName} ${order.customer?.lastName}`,
      items: erpItems,
      subtotalHT: order.subtotal,
      taxAmount: order.tax,
      totalTTC: order.total,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      orderDate: order.createdAt,
      deliveryDate: order.deliveredAt,
      erpMetadata: {
        paymentMethod: order.paymentMethod,
        paymentStatus: this.mapPaymentStatusToERP(order.paymentStatus),
        conditions: '30J', // Conditions par défaut
        notes: order.notes,
        commercialReference: order.orderNumber,
      },
    }
  }

  /**
   * Mapper le statut marketplace vers ERP
   */
  private mapMarketplaceStatusToERP(marketplaceStatus: string): string {
    const statusMap: Record<string, string> = {
      CART: 'BROUILLON',
      PENDING: 'EN_ATTENTE',
      CONFIRMED: 'CONFIRMEE',
      PROCESSING: 'EN_COURS',
      SHIPPED: 'EXPEDIEE',
      DELIVERED: 'LIVREE',
      CANCELLED: 'ANNULEE',
      REFUNDED: 'REMBOURSEE',
    }

    return statusMap[marketplaceStatus] || marketplaceStatus
  }

  /**
   * Mapper le statut de paiement marketplace vers ERP
   */
  private mapPaymentStatusToERP(paymentStatus: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'EN_ATTENTE',
      PAID: 'PAYE',
      FAILED: 'ECHEC',
      CANCELLED: 'ANNULE',
      REFUNDED: 'REMBOURSE',
      PARTIALLY_REFUNDED: 'PARTIELLEMENT_REMBOURSE',
    }

    return statusMap[paymentStatus] || paymentStatus
  }
}
