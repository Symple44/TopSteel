import { Article } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { DataSource, QueryRunner, Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import {
  Partner,
  PartnerCategory,
  PartnerStatus,
  PartnerType,
} from '../../../domains/partners/entities/partner.entity'
import { MarketplaceCustomer } from '../entities/marketplace-customer.entity'
import { MarketplaceOrder } from '../entities/marketplace-order.entity'
import { MarketplaceOrderItem } from '../entities/marketplace-order-item.entity'

export interface MigrationPlan {
  articlesToUpdate: number // Articles ERP à activer pour marketplace
  customersToMigrate: number
  ordersToUpdate: number
  estimatedDuration: number // en minutes
  warnings: string[]
  prerequisites: string[]
}

export interface MigrationResult {
  success: boolean
  articlesUpdated: number // Articles ERP mis à jour
  customersProcessed: number
  ordersUpdated: number
  errors: Array<{
    type: 'ARTICLE' | 'CUSTOMER' | 'ORDER'
    id: string
    error: string
  }>
  duration: number
  timestamp: Date
}

export interface MigrationProgress {
  phase: 'PREPARING' | 'ARTICLES' | 'CUSTOMERS' | 'ORDERS' | 'CLEANUP' | 'COMPLETED' | 'FAILED'
  progress: number // 0-100
  currentItem?: string
  processed: number
  total: number
  errors: number
}

/**
 * Service de migration des données marketplace vers l'architecture ERP
 * Convertit les entités marketplace existantes en entités ERP intégrées
 */
@Injectable()
export class MarketplaceToERPMigrationService {
  private readonly logger = new Logger(MarketplaceToERPMigrationService.name)
  private migrationInProgress = false
  private currentProgress: MigrationProgress | null = null

  constructor(
    @InjectRepository(MarketplaceCustomer)
    private readonly marketplaceCustomerRepository: Repository<MarketplaceCustomer>,
    @InjectRepository(MarketplaceOrder)
    private readonly marketplaceOrderRepository: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceOrderItem)
    readonly _marketplaceOrderItemRepository: Repository<MarketplaceOrderItem>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Partner)
    private readonly partnerRepository: Repository<Partner>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Analyser les données existantes et créer un plan de migration
   */
  async createMigrationPlan(_tenantId: string): Promise<MigrationPlan> {
    // Compter les articles ERP qui ne sont pas encore activés pour le marketplace
    const [articlesNotEnabled, customersCount, ordersCount] = await Promise.all([
      this.articleRepository.count({ where: { isMarketplaceEnabled: false } }),
      this.marketplaceCustomerRepository.count({ where: {} }),
      this.marketplaceOrderRepository.count({ where: {} }),
    ])

    const warnings: string[] = []
    const prerequisites: string[] = []

    // Vérifier les conflits potentiels
    const existingArticles = await this.articleRepository.count({ where: {} })
    const existingPartners = await this.partnerRepository.count({ where: {} })

    if (existingArticles > 0) {
      warnings.push(
        `${existingArticles} articles ERP existants - vérification des conflits nécessaire`
      )
    }

    if (existingPartners > 0) {
      warnings.push(
        `${existingPartners} partenaires ERP existants - vérification des conflits nécessaire`
      )
    }

    // Vérifier les clients sans partenaire ERP
    const customersWithoutPartner = await this.marketplaceCustomerRepository.count({
      where: { erpPartnerId: null } as any,
    })

    if (customersWithoutPartner > 0) {
      prerequisites.push('Création de partenaires ERP pour les clients marketplace')
    }

    // Estimation de durée (approximative)
    const estimatedDuration = Math.ceil(
      (articlesNotEnabled * 0.05 + customersCount * 0.2 + ordersCount * 0.05) / 60
    )

    return {
      articlesToUpdate: articlesNotEnabled,
      customersToMigrate: customersWithoutPartner,
      ordersToUpdate: ordersCount,
      estimatedDuration: Math.max(1, estimatedDuration),
      warnings,
      prerequisites,
    }
  }

  /**
   * Exécuter la migration complète
   */
  async executeMigration(tenantId: string): Promise<MigrationResult> {
    if (this.migrationInProgress) {
      throw new Error('Migration already in progress')
    }

    this.migrationInProgress = true
    const startTime = Date.now()
    const timestamp = new Date()
    const errors: MigrationResult['errors'] = []

    let articlesUpdated = 0
    let customersProcessed = 0
    let ordersUpdated = 0

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      this.logger.log(`Starting marketplace to ERP migration for tenant ${tenantId}`)

      // Phase 1: Activer les articles ERP pour le marketplace
      this.updateProgress('ARTICLES', 0, 'Enabling articles for marketplace...')

      // Trouver tous les articles qui ne sont pas encore activés pour le marketplace
      const articlesNotEnabled = await this.articleRepository.find({
        where: { isMarketplaceEnabled: false },
      })

      for (let i = 0; i < articlesNotEnabled.length; i++) {
        const article = articlesNotEnabled[i]
        try {
          // Activer l'article pour le marketplace avec des paramètres par défaut
          article.isMarketplaceEnabled = true
          article.marketplaceSettings = article.marketplaceSettings || {
            basePrice: article.prixVenteHT || 0,
            categories: article.famille ? [article.famille] : [],
            description: article.description || '',
            images: [],
            tags: [],
          }

          await queryRunner.manager.save(Article, article)
          articlesUpdated++

          this.updateProgress(
            'ARTICLES',
            Math.round(((i + 1) / articlesNotEnabled.length) * 100),
            `Enabled article: ${article.designation}`
          )
        } catch (error) {
          this.logger.error(`Failed to enable article ${article.id}:`, error)
          errors.push({
            type: 'ARTICLE',
            id: article.id,
            error: getErrorMessage(error),
          })
        }
      }

      // Phase 2: Créer les partenaires ERP pour les clients
      this.updateProgress('CUSTOMERS', 0, 'Starting customer migration...')

      const customersWithoutPartner = await this.marketplaceCustomerRepository.find({
        where: { erpPartnerId: null } as any,
      })

      for (let i = 0; i < customersWithoutPartner.length; i++) {
        const customer = customersWithoutPartner[i]
        try {
          await this.createPartnerForCustomer(queryRunner, customer, tenantId)
          customersProcessed++

          this.updateProgress(
            'CUSTOMERS',
            Math.round(((i + 1) / customersWithoutPartner.length) * 100),
            `Created partner for: ${customer.email}`
          )
        } catch (error) {
          this.logger.error(`Failed to create partner for customer ${customer.id}:`, error)
          errors.push({
            type: 'CUSTOMER',
            id: customer.id,
            error: getErrorMessage(error),
          })
        }
      }

      // Phase 3: Mettre à jour les références des commandes
      this.updateProgress('ORDERS', 0, 'Updating order references...')

      const orders = await this.marketplaceOrderRepository.find({
        where: { tenantId },
        relations: ['items'],
      })

      for (let i = 0; i < orders.length; i++) {
        const order = orders[i]
        try {
          await this.updateOrderReferences(queryRunner, order, tenantId)
          ordersUpdated++

          this.updateProgress(
            'ORDERS',
            Math.round(((i + 1) / orders.length) * 100),
            `Updated order: ${order.orderNumber}`
          )
        } catch (error) {
          this.logger.error(`Failed to update order ${order.id}:`, error)
          errors.push({
            type: 'ORDER',
            id: order.id,
            error: getErrorMessage(error),
          })
        }
      }

      // Phase 4: Nettoyage (optionnel - garder les données pour sécurité)
      this.updateProgress('CLEANUP', 100, 'Migration completed successfully')

      await queryRunner.commitTransaction()

      this.updateProgress('COMPLETED', 100, 'Migration completed successfully')

      const duration = Date.now() - startTime
      this.logger.log(
        `Migration completed: ${articlesUpdated} articles, ${customersProcessed} customers, ${ordersUpdated} orders in ${duration}ms`
      )

      return {
        success: errors.length === 0,
        articlesUpdated,
        customersProcessed,
        ordersUpdated,
        errors,
        duration,
        timestamp,
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      this.logger.error('Migration failed:', error)

      this.updateProgress('FAILED', 0, `Migration failed: ${getErrorMessage(error)}`)

      return {
        success: false,
        articlesUpdated,
        customersProcessed,
        ordersUpdated,
        errors: [
          ...errors,
          { type: 'ORDER' as const, id: 'SYSTEM', error: getErrorMessage(error) },
        ],
        duration: Date.now() - startTime,
        timestamp,
      }
    } finally {
      await queryRunner.release()
      this.migrationInProgress = false
      this.currentProgress = null
    }
  }

  /**
   * Obtenir le progrès de la migration en cours
   */
  getMigrationProgress(): MigrationProgress | null {
    return this.currentProgress
  }

  /**
   * Vérifier si une migration est en cours
   */
  isMigrationInProgress(): boolean {
    return this.migrationInProgress
  }

  // SUPPRIMÉ : migrateProductToArticle - Plus besoin car on utilise directement les Articles ERP

  /**
   * Créer un partenaire ERP pour un client marketplace
   */
  private async createPartnerForCustomer(
    queryRunner: QueryRunner,
    customer: MarketplaceCustomer,
    tenantId: string
  ): Promise<void> {
    // Générer un code unique
    const baseCode = `CLI${Date.now().toString().slice(-6)}`
    let code = baseCode
    let counter = 1

    while (await queryRunner.manager.findOne(Partner, { where: { code } })) {
      code = `${baseCode}${counter.toString().padStart(2, '0')}`
      counter++
    }

    const partner = queryRunner.manager.create(Partner, {
      tenantId,
      code,
      type: PartnerType.CLIENT,
      status: PartnerStatus.ACTIF,
      category: PartnerCategory.PARTICULIER,
      denomination: `${customer.firstName} ${customer.lastName}`,
      contactPrincipal: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      telephone: customer.phone,
      pays: 'France',
      conditionsPaiement: '30J',
      modePaiement: 'CARTE',
      notes: {
        commentaires: 'Partenaire créé automatiquement lors de la migration marketplace',
        tagsPersonnalises: ['marketplace', 'migration'],
      },
    })

    const savedPartner = await queryRunner.manager.save(Partner, partner)

    // Lier le client au partenaire
    customer.erpPartnerId = savedPartner.id
    await queryRunner.manager.save(MarketplaceCustomer, customer)
  }

  /**
   * Mettre à jour les références des commandes
   */
  private async updateOrderReferences(
    queryRunner: any,
    order: MarketplaceOrder,
    _tenantId: string
  ): Promise<void> {
    // Les références des produits dans les items de commande doivent pointer vers les articles ERP
    const items = await queryRunner.manager.find(MarketplaceOrderItem, {
      where: { orderId: order.id },
    })

    for (const item of items) {
      // Vérifier que l'item pointe bien vers un Article ERP
      const article = await queryRunner.manager.findOne(Article, {
        where: { id: item.productId },
      })

      if (!article) {
        // Si l'article n'existe pas, log une erreur mais continue
        this.logger.warn(`Order item ${item.id} references non-existent article ${item.productId}`)
      } else if (!article.isMarketplaceEnabled) {
        // Activer l'article pour le marketplace s'il ne l'est pas
        article.isMarketplaceEnabled = true
        article.marketplaceSettings = article.marketplaceSettings || {
          basePrice: article.prixVenteHT || 0,
          categories: article.famille ? [article.famille] : [],
          description: article.description || '',
          images: [],
          tags: [],
        }
        await queryRunner.manager.save(Article, article)
      }
    }
  }

  /**
   * Mettre à jour le progrès de la migration
   */
  private updateProgress(
    phase: MigrationProgress['phase'],
    progress: number,
    currentItem?: string
  ): void {
    this.currentProgress = {
      phase,
      progress,
      currentItem,
      processed: this.currentProgress?.processed || 0,
      total: this.currentProgress?.total || 0,
      errors: this.currentProgress?.errors || 0,
    }

    if (phase !== 'FAILED') {
      this.currentProgress.processed = Math.round((progress / 100) * this.currentProgress.total)
    }
  }
}
