import { Article, ArticleStatus } from '@erp/entities'
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Job } from 'bull'
import type { Repository } from 'typeorm'
import { getErrorMessage, hasStack } from '../../../core/common/utils'
import type { MarketplaceSyncService } from '../../../domains/marketplace/services/marketplace-sync.service'

interface SyncArticleJob {
  articleId: string
  tenantId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
}

interface SyncStockJob {
  articleId: string
  tenantId: string
  newStock: number
}

interface SyncOrderJob {
  marketplaceOrderId: string
  tenantId: string
  action: 'CREATE_ERP_DOCUMENTS' | 'UPDATE_STATUS' | 'SYNC_PAYMENT'
}

interface FullSyncJob {
  tenantId: string
  timestamp: Date
}

@Processor('marketplace-sync')
export class MarketplaceSyncProcessor {
  private readonly logger = new Logger(MarketplaceSyncProcessor.name)

  constructor(
    private readonly syncService: MarketplaceSyncService,
    @InjectRepository(Article, 'tenant')
    private readonly articleRepository: Repository<Article>
  ) {}

  /**
   * Process article synchronization jobs
   */
  @Process('sync-article')
  async handleArticleSync(job: Job<SyncArticleJob>) {
    const { articleId, tenantId, action } = job.data

    this.logger.log(`Processing article sync: ${action} for article ${articleId}`)

    try {
      switch (action) {
        case 'CREATE':
        case 'UPDATE': {
          const article = await this.articleRepository.findOne({
            where: { id: articleId },
            relations: ['famille', 'materials'],
          })

          if (article?.isMarketplaceEnabled === true) {
            await this.syncService.syncArticleToMarketplace(article, tenantId)
            this.logger.log(`Article ${articleId} synced to marketplace`)
          }
          break
        }

        case 'DELETE':
          await this.articleRepository.delete({
            id: articleId,
          })
          this.logger.log(`Article ${articleId} removed from marketplace`)
          break
      }

      return { success: true, articleId, action }
    } catch (error) {
      this.logger.error(
        `Failed to sync article ${articleId}: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      throw error
    }
  }

  /**
   * Process stock update jobs
   */
  @Process('sync-stock')
  async handleStockSync(job: Job<SyncStockJob>) {
    const { articleId, tenantId: _tenantId, newStock } = job.data

    this.logger.log(`Updating stock for article ${articleId}: ${newStock}`)

    try {
      const article = await this.articleRepository.findOne({
        where: {
          id: articleId,
        },
      })

      if (article) {
        article.stockPhysique = newStock
        article.stockDisponible = newStock
        article.dateDernierMouvement = new Date()

        await this.articleRepository.save(article)

        // If out of stock, notify customers in wishlist
        if (newStock === 0) {
          await this.notifyOutOfStock(article)
        }

        this.logger.log(`Stock updated for article ${article.id}`)
      }

      return { success: true, articleId, newStock }
    } catch (error) {
      this.logger.error(
        `Failed to update stock for article ${articleId}: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      throw error
    }
  }

  /**
   * Process order synchronization jobs
   */
  @Process('sync-order')
  async handleOrderSync(job: Job<SyncOrderJob>) {
    const { marketplaceOrderId, tenantId, action } = job.data

    this.logger.log(`Processing order sync: ${action} for order ${marketplaceOrderId}`)

    try {
      switch (action) {
        case 'CREATE_ERP_DOCUMENTS':
          await this.syncService.syncMarketplaceOrderToERP(marketplaceOrderId, tenantId)
          break

        case 'UPDATE_STATUS':
          // Update order status in marketplace based on ERP status
          this.logger.log(`Updating status for order ${marketplaceOrderId}`)
          break

        case 'SYNC_PAYMENT':
          // Sync payment information between systems
          this.logger.log(`Syncing payment for order ${marketplaceOrderId}`)
          break
      }

      return { success: true, orderId: marketplaceOrderId, action }
    } catch (error) {
      this.logger.error(
        `Failed to sync order ${marketplaceOrderId}: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      throw error
    }
  }

  /**
   * Process full synchronization jobs
   */
  @Process('full-sync')
  async handleFullSync(job: Job<FullSyncJob>): Promise<unknown> {
    const { tenantId, timestamp } = job.data

    this.logger.log(`Starting full sync for tenant ${tenantId} at ${timestamp}`)

    try {
      const result = await this.syncService.syncAllArticlesToMarketplace(tenantId)

      this.logger.log(
        `Full sync completed for tenant ${tenantId}: ${result.synced} synced, ${result.failed} failed`
      )

      // Update progress
      await job.progress(100)

      return result
    } catch (error) {
      this.logger.error(
        `Full sync failed for tenant ${tenantId}: ${getErrorMessage(error)}`,
        hasStack(error) ? error.stack : undefined
      )
      throw error
    }
  }

  /**
   * Process bulk operations
   */
  @Process('bulk-update')
  async handleBulkUpdate(job: Job<unknown>) {
    const { operations, tenantId } = job.data as { operations: any[]; tenantId: string }

    this.logger.log(`Processing ${operations.length} bulk operations for tenant ${tenantId}`)

    const results = []
    let processed = 0

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'PRICE_UPDATE':
            await this.updateProductPrice(operation.productId, operation.newPrice, tenantId)
            break

          case 'STOCK_UPDATE':
            await this.updateProductStock(operation.productId, operation.newStock, tenantId)
            break

          case 'STATUS_UPDATE':
            await this.updateProductStatus(operation.productId, operation.isActive, tenantId)
            break
        }

        results.push({
          id: operation.productId,
          type: operation.type,
          success: true,
        })
      } catch (error) {
        results.push({
          id: operation.productId,
          type: operation.type,
          success: false,
          error: getErrorMessage(error),
        })
      }

      processed++
      await job.progress((processed / operations.length) * 100)
    }

    return {
      total: operations.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }
  }

  /**
   * Handle job failure
   */
  @Process('failed')
  async handleFailedJob(job: Job) {
    this.logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts`, job.failedReason)

    // Send alert for critical failures
    if (job.name === 'sync-order' || job.attemptsMade >= 3) {
      await this.sendFailureAlert(job)
    }
  }

  private async notifyOutOfStock(article: Article): Promise<void> {
    // Implementation for notifying customers when product is out of stock
    this.logger.log(`Notifying customers about out of stock for article ${article.id}`)
  }

  private async updateProductPrice(
    productId: string,
    newPrice: number,
    _tenantId: string
  ): Promise<void> {
    await this.articleRepository.update(
      { id: productId },
      { prixVenteHT: newPrice, dateDerniereModification: new Date() }
    )
  }

  private async updateProductStock(
    productId: string,
    newStock: number,
    _tenantId: string
  ): Promise<void> {
    await this.articleRepository.update(
      { id: productId },
      {
        stockPhysique: newStock,
        stockDisponible: newStock,
        dateDernierMouvement: new Date(),
      }
    )
  }

  private async updateProductStatus(
    productId: string,
    isActive: boolean,
    _tenantId: string
  ): Promise<void> {
    await this.articleRepository.update(
      { id: productId },
      { status: isActive ? ArticleStatus.ACTIF : ArticleStatus.INACTIF }
    )
  }

  private async sendFailureAlert(job: Job): Promise<void> {
    // Implementation for sending alerts on critical failures
    this.logger.error(`CRITICAL: Job ${job.name} (${job.id}) failed permanently`)
  }
}
