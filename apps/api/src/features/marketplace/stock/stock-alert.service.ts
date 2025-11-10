import { Article } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectRedis } from '@nestjs-modules/ioredis'
import type { Redis } from 'ioredis'
import { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import { EmailService } from '../../../core/email/email.service'
import type { StockAlert } from '../../../domains/inventory/repositories/article.repository'

interface StockAlertEvent {
  productId: string
  productName: string
  currentStock: number
  minStockLevel?: number
}

interface AlertConfig {
  lowStockThreshold: number
  outOfStockAlert: boolean
  emailNotifications: boolean
  adminEmails: string[]
  suppressDuplicates: boolean
  alertCooldownMinutes: number
}

@Injectable()
export class StockAlertService {
  private readonly logger = new Logger(StockAlertService.name)
  private readonly defaultConfig: AlertConfig

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly emailService: EmailService,
    @InjectRedis() private readonly redisService: Redis,
    private readonly configService: ConfigService
  ) {
    this.defaultConfig = {
      lowStockThreshold: this.configService.get<number>('STOCK_LOW_THRESHOLD', 10),
      outOfStockAlert: this.configService.get<boolean>('STOCK_OUT_ALERT', true),
      emailNotifications: this.configService.get<boolean>('STOCK_EMAIL_ALERTS', true),
      adminEmails: this.configService
        .get<string>('STOCK_ALERT_EMAILS', 'admin@topsteel.com')
        .split(','),
      suppressDuplicates: true,
      alertCooldownMinutes: 60, // Prevent spam by limiting alerts to once per hour per product
    }
  }

  /**
   * Handle low stock events
   */
  @OnEvent('marketplace.stock.low')
  async handleLowStockEvent(event: StockAlertEvent): Promise<void> {
    try {
      this.logger.warn(
        `Low stock alert for product ${event.productName}: ${event.currentStock} units remaining`
      )

      if (this.defaultConfig.suppressDuplicates) {
        const isDuplicate = await this.checkDuplicateAlert(event.productId, 'low')
        if (isDuplicate) {
          this.logger.debug(`Suppressing duplicate low stock alert for product ${event.productId}`)
          return
        }
      }

      // Send email notification
      if (this.defaultConfig.emailNotifications && this.defaultConfig.adminEmails.length > 0) {
        await this.sendLowStockEmail(event)
      }

      // Store alert in database or event log
      await this.logStockAlert(event.productId, 'low', event.currentStock)

      // Mark alert as sent to prevent duplicates
      if (this.defaultConfig.suppressDuplicates) {
        await this.markAlertSent(event.productId, 'low')
      }
    } catch (error) {
      this.logger.error(`Failed to handle low stock event for product ${event.productId}:`, error)
    }
  }

  /**
   * Handle out of stock events
   */
  @OnEvent('marketplace.stock.out')
  async handleOutOfStockEvent(event: StockAlertEvent): Promise<void> {
    try {
      this.logger.error(
        `Out of stock alert for product ${event.productName}: ${event.currentStock} units`
      )

      if (this.defaultConfig.suppressDuplicates) {
        const isDuplicate = await this.checkDuplicateAlert(event.productId, 'out')
        if (isDuplicate) {
          this.logger.debug(
            `Suppressing duplicate out of stock alert for product ${event.productId}`
          )
          return
        }
      }

      // Disable product on marketplace if out of stock
      await this.disableProductOnMarketplace(event.productId)

      // Send email notification
      if (this.defaultConfig.emailNotifications && this.defaultConfig.adminEmails.length > 0) {
        await this.sendOutOfStockEmail(event)
      }

      // Store alert in database or event log
      await this.logStockAlert(event.productId, 'out', event.currentStock)

      // Mark alert as sent to prevent duplicates
      if (this.defaultConfig.suppressDuplicates) {
        await this.markAlertSent(event.productId, 'out')
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle out of stock event for product ${event.productId}:`,
        error
      )
    }
  }

  /**
   * Handle stock replenishment events
   */
  @OnEvent('marketplace.stock.replenished')
  async handleStockReplenishedEvent(event: StockAlertEvent): Promise<void> {
    try {
      this.logger.log(
        `Stock replenished for product ${event.productName}: ${event.currentStock} units`
      )

      // Re-enable product on marketplace if it was disabled
      await this.enableProductOnMarketplace(event.productId)

      // Clear duplicate alert markers since stock is now available
      await this.clearAlertMarkers(event.productId)

      // Send replenishment notification
      if (this.defaultConfig.emailNotifications && this.defaultConfig.adminEmails.length > 0) {
        await this.sendStockReplenishedEmail(event)
      }

      // Log the replenishment
      await this.logStockAlert(event.productId, 'replenished', event.currentStock)
    } catch (error) {
      this.logger.error(
        `Failed to handle stock replenished event for product ${event.productId}:`,
        error
      )
    }
  }

  /**
   * Send low stock email alert
   */
  private async sendLowStockEmail(event: StockAlertEvent): Promise<void> {
    try {
      const subject = `⚠️ Alerte Stock Faible - ${event.productName}`

      const emailResult = await this.emailService.sendEmail({
        to: this.defaultConfig.adminEmails,
        subject,
        template: 'stock-low-alert',
        context: {
          productName: event.productName,
          currentStock: event.currentStock,
          minStockLevel: event.minStockLevel || this.defaultConfig.lowStockThreshold,
          productId: event.productId,
          timestamp: new Date().toLocaleString('fr-FR'),
        },
      })

      if (emailResult.success) {
        this.logger.log(`Low stock email sent for product ${event.productId}`)
      } else {
        this.logger.error(`Failed to send low stock email: ${emailResult.error}`)
      }
    } catch (error) {
      this.logger.error('Failed to send low stock email:', error)
    }
  }

  /**
   * Send out of stock email alert
   */
  private async sendOutOfStockEmail(event: StockAlertEvent): Promise<void> {
    try {
      const subject = `🚨 Alerte Rupture Stock - ${event.productName}`

      const emailResult = await this.emailService.sendEmail({
        to: this.defaultConfig.adminEmails,
        subject,
        template: 'stock-out-alert',
        context: {
          productName: event.productName,
          currentStock: event.currentStock,
          productId: event.productId,
          timestamp: new Date().toLocaleString('fr-FR'),
        },
      })

      if (emailResult.success) {
        this.logger.log(`Out of stock email sent for product ${event.productId}`)
      } else {
        this.logger.error(`Failed to send out of stock email: ${emailResult.error}`)
      }
    } catch (error) {
      this.logger.error('Failed to send out of stock email:', error)
    }
  }

  /**
   * Send stock replenished email notification
   */
  private async sendStockReplenishedEmail(event: StockAlertEvent): Promise<void> {
    try {
      const subject = `✅ Stock Reconstitué - ${event.productName}`

      const emailResult = await this.emailService.sendEmail({
        to: this.defaultConfig.adminEmails,
        subject,
        template: 'stock-replenished',
        context: {
          productName: event.productName,
          currentStock: event.currentStock,
          productId: event.productId,
          timestamp: new Date().toLocaleString('fr-FR'),
        },
      })

      if (emailResult.success) {
        this.logger.log(`Stock replenished email sent for product ${event.productId}`)
      } else {
        this.logger.error(`Failed to send stock replenished email: ${emailResult.error}`)
      }
    } catch (error) {
      this.logger.error('Failed to send stock replenished email:', error)
    }
  }

  /**
   * Check if an alert for this product type was already sent recently
   */
  private async checkDuplicateAlert(productId: string, alertType: string): Promise<boolean> {
    try {
      const key = `stock_alert:${productId}:${alertType}`
      const exists = await this.redisService.exists(key)
      return exists === 1
    } catch (error) {
      this.logger.error(`Failed to check duplicate alert: ${getErrorMessage(error)}`)
      return false // If Redis fails, don't suppress alerts
    }
  }

  /**
   * Mark an alert as sent to prevent duplicates
   */
  private async markAlertSent(productId: string, alertType: string): Promise<void> {
    try {
      const key = `stock_alert:${productId}:${alertType}`
      const ttl = this.defaultConfig.alertCooldownMinutes * 60 // Convert to seconds
      await this.redisService.setex(key, ttl, '1')
    } catch (error) {
      this.logger.error(`Failed to mark alert as sent: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Clear alert markers (used when stock is replenished)
   */
  private async clearAlertMarkers(productId: string): Promise<void> {
    try {
      const keys = [`stock_alert:${productId}:low`, `stock_alert:${productId}:out`]

      for (const key of keys) {
        await this.redisService.del(key)
      }
    } catch (error) {
      this.logger.error(`Failed to clear alert markers: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Disable product on marketplace when out of stock
   */
  private async disableProductOnMarketplace(productId: string): Promise<void> {
    try {
      await this.articleRepository.update(productId, {
        isMarketplaceEnabled: false,
      })

      this.logger.log(`Product ${productId} disabled on marketplace due to stock shortage`)
    } catch (error) {
      this.logger.error(`Failed to disable product ${productId} on marketplace:`, error)
    }
  }

  /**
   * Re-enable product on marketplace when stock is replenished
   */
  private async enableProductOnMarketplace(productId: string): Promise<void> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: productId },
        select: ['id', 'isMarketplaceEnabled', 'stockPhysique'],
      })

      if (article && !article.isMarketplaceEnabled && (article.stockPhysique || 0) > 0) {
        await this.articleRepository.update(productId, {
          isMarketplaceEnabled: true,
        })

        this.logger.log(`Product ${productId} re-enabled on marketplace after stock replenishment`)
      }
    } catch (error) {
      this.logger.error(`Failed to re-enable product ${productId} on marketplace:`, error)
    }
  }

  /**
   * Log stock alert to database or external system
   */
  private async logStockAlert(
    productId: string,
    alertType: string,
    currentStock: number
  ): Promise<void> {
    try {
      // Store in Redis for audit trail
      const alertLog = {
        productId,
        alertType,
        currentStock,
        timestamp: new Date().toISOString(),
      }

      const key = `stock_alert_log:${productId}:${Date.now()}`
      await this.redisService.setex(key, 86400 * 30, JSON.stringify(alertLog)) // Keep for 30 days

      this.logger.debug(`Stock alert logged: ${alertType} for product ${productId}`)
    } catch (error) {
      this.logger.error(`Failed to log stock alert: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Get stock alert history for a product
   */
  async getAlertHistory(productId: string): Promise<StockAlert[]> {
    try {
      const pattern = `stock_alert_log:${productId}:*`
      const keys = await this.redisService.keys(pattern)

      const alerts = []
      for (const key of keys) {
        const alertData = await this.redisService.get(key)
        if (alertData) {
          alerts.push(JSON.parse(alertData))
        }
      }

      return alerts.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      this.logger.error(`Failed to get alert history for product ${productId}:`, error)
      return []
    }
  }

  /**
   * Health check for the alert system
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Test Redis connectivity
      await this.redisService.ping()

      // Test email service if configured
      if (this.defaultConfig.emailNotifications) {
        return await this.emailService.isHealthy()
      }

      return true
    } catch (error) {
      this.logger.error('Stock alert service health check failed:', error)
      return false
    }
  }
}
