import * as crypto from 'node:crypto'
import type { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { type EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { firstValueFrom } from 'rxjs'
import type { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import { WebhookDelivery as WebhookDeliveryEntity } from '../entities/webhook-delivery.entity'
import { WebhookEvent as WebhookEventEntity } from '../entities/webhook-event.entity'
import { WebhookSubscription as WebhookSubscriptionEntity } from '../entities/webhook-subscription.entity'
import {
  type WebhookDelivery,
  type WebhookEvent,
  WebhookEventType,
  type WebhookSubscription,
} from '../types/webhook.types'

interface WebhookError {
  response?: {
    status: number
  }
}

interface PriceChangeEvent {
  previousPrice: number
  newPrice: number
  societeId: string
  articleId?: string
}

interface RuleAppliedEvent {
  societeId: string
  ruleId: string
  articleId?: string
  channel?: string
}

@Injectable()
export class PricingWebhooksService {
  async listSubscriptions(societeId: string): Promise<WebhookSubscription[]> {
    return await this.subscriptionRepo.find({
      where: { societeId },
      order: { id: 'DESC' },
    })
  }

  async updateSubscription(
    id: string,
    updates: unknown,
    societeId: string
  ): Promise<WebhookSubscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id, societeId },
    })

    if (!subscription) {
      throw new Error('Subscription not found')
    }

    Object.assign(subscription, updates)
    return await this.subscriptionRepo.save(subscription)
  }

  async deleteSubscription(id: string, societeId: string): Promise<void> {
    await this.subscriptionRepo.delete({ id, societeId })
  }

  async testWebhook(url: string, event: Record<string, unknown>): Promise<unknown> {
    const startTime = Date.now()

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, event, {
          headers: { 'X-Webhook-Test': 'true' },
          timeout: 3000,
        })
      )

      return {
        success: true,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        error: null,
      }
    } catch (error: unknown) {
      return {
        success: false,
        statusCode: (error as WebhookError).response?.status || 0,
        responseTime: Date.now() - startTime,
        error: getErrorMessage(error),
      }
    }
  }

  async getEventHistory(
    societeId: string,
    options: { limit: number; offset: number; type?: WebhookEventType }
  ): Promise<{ events: WebhookEvent[]; total: number }> {
    const query = this.eventRepo
      .createQueryBuilder('event')
      .where('event.societeId = :societeId', { societeId })

    if (options.type) {
      query.andWhere('event.type = :type', { type: options.type })
    }

    const [events, total] = await query
      .orderBy('event.timestamp', 'DESC')
      .limit(options.limit)
      .offset(options.offset)
      .getManyAndCount()

    return { events, total }
  }

  async getDeliveryStatus(eventId: string, _societeId: string): Promise<WebhookDelivery[]> {
    return await this.deliveryRepo.find({
      where: { eventId },
      relations: ['subscription'],
      order: { id: 'DESC' },
    })
  }
  private readonly logger = new Logger(PricingWebhooksService.name)
  private deliveryQueue: Map<string, WebhookDelivery> = new Map()

  constructor(
    @InjectRepository(WebhookSubscriptionEntity, 'tenant')
    private readonly subscriptionRepo: Repository<WebhookSubscriptionEntity>,
    @InjectRepository(WebhookEventEntity, 'tenant')
    private readonly eventRepo: Repository<WebhookEventEntity>,
    @InjectRepository(WebhookDeliveryEntity, 'tenant')
    private readonly deliveryRepo: Repository<WebhookDeliveryEntity>,
    private readonly httpService: HttpService,
    readonly _eventEmitter: EventEmitter2
  ) {}

  /**
   * Crée une nouvelle souscription webhook
   */
  async createSubscription(data: {
    societeId: string
    url: string
    events: WebhookEventType[]
    filters?: WebhookSubscription['filters']
    description?: string
  }): Promise<WebhookSubscription> {
    // Générer un secret pour la signature HMAC
    const secret = crypto.randomBytes(32).toString('hex')

    // Valider l'URL
    await this.validateWebhookUrl(data.url)

    const subscription = await this.subscriptionRepo.save({
      ...data,
      secret,
      isActive: true,
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
      metadata: {
        description: data.description,
        createdBy: 'system',
        totalCalls: 0,
        successRate: 100,
      },
    })

    this.logger.log(`Webhook subscription créée: ${subscription.id}`)

    return subscription
  }

  /**
   * Émet un événement webhook
   */
  async emit(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    const savedEvent = await this.eventRepo.save({
      ...event,
      timestamp: new Date(),
    })

    // Trouver les souscriptions correspondantes
    const subscriptions = await this.findMatchingSubscriptions(savedEvent)

    this.logger.debug(
      `${subscriptions.length} souscriptions trouvées pour l'événement ${event.type}`
    )

    // Créer les deliveries
    for (const subscription of subscriptions) {
      if (this.shouldTrigger(subscription, savedEvent)) {
        await this.createDelivery(subscription, savedEvent)
      }
    }

    // Traiter la queue
    await this.processDeliveryQueue()
  }

  /**
   * Trouve les souscriptions correspondant à un événement
   */
  private async findMatchingSubscriptions(event: WebhookEvent): Promise<WebhookSubscription[]> {
    return await this.subscriptionRepo
      .find({
        where: {
          societeId: event.societeId,
          isActive: true,
        },
      })
      .then((subs) => subs.filter((sub) => sub.events.includes(event.type)))
  }

  /**
   * Vérifie si un webhook doit être déclenché selon les filtres
   */
  private shouldTrigger(subscription: WebhookSubscription, event: WebhookEvent): boolean {
    const filters = subscription.filters
    if (!filters) return true

    // Filtre sur le changement de prix minimum
    if (filters.minPriceChange && event.metadata?.changePercent) {
      if (Math.abs(event.metadata.changePercent) < filters.minPriceChange) {
        return false
      }
    }

    // Filtre sur les articles
    if (filters.articleIds && event.metadata?.articleId) {
      if (!filters.articleIds.includes(event.metadata.articleId)) {
        return false
      }
    }

    // Filtre sur les règles
    if (filters.ruleIds && event.metadata?.ruleId) {
      if (!filters.ruleIds.includes(event.metadata.ruleId)) {
        return false
      }
    }

    // Filtre sur les canaux
    if (filters.channels && event.metadata?.channel) {
      if (!filters.channels.includes(event.metadata.channel)) {
        return false
      }
    }

    return true
  }

  /**
   * Crée une delivery pour un webhook
   */
  private async createDelivery(
    subscription: WebhookSubscription,
    event: WebhookEvent
  ): Promise<void> {
    const delivery = await this.deliveryRepo.save({
      subscriptionId: subscription.id,
      eventId: event.id,
      url: subscription.url,
      status: 'pending',
      attempts: 0,
    })

    this.deliveryQueue.set(delivery.id, delivery)
  }

  /**
   * Traite la queue de delivery
   */
  private async processDeliveryQueue(): Promise<void> {
    const pending = Array.from(this.deliveryQueue.values()).filter((d) => d.status === 'pending')

    for (const delivery of pending) {
      await this.deliverWebhook(delivery)
    }
  }

  /**
   * Livre un webhook
   */
  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: delivery.subscriptionId },
    })

    if (!subscription) {
      this.logger.error(`Subscription ${delivery.subscriptionId} non trouvée`)
      return
    }

    const event = await this.eventRepo.findOne({
      where: { id: delivery.eventId },
    })

    if (!event) {
      this.logger.error(`Event ${delivery.eventId} non trouvé`)
      return
    }

    delivery.attempts++
    delivery.lastAttempt = new Date()

    try {
      // Préparer le payload
      const payload = {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        data: event.data,
        metadata: event.metadata,
      }

      // Générer la signature HMAC
      const signature = this.generateSignature(payload, subscription.secret)

      // Envoyer la requête
      const response = await firstValueFrom(
        this.httpService.post(subscription.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event.type,
            'X-Webhook-Delivery': delivery.id,
          },
          timeout: 5000,
        })
      )

      delivery.status = 'success'
      delivery.response = {
        statusCode: response.status,
        body: response.data,
      }

      // Mettre à jour les stats
      await this.updateSubscriptionStats(subscription.id, true)

      this.logger.log(`Webhook délivré avec succès: ${delivery.id}`)
    } catch (error: unknown) {
      delivery.response = {
        statusCode: (error as WebhookError).response?.status || 0,
        error: getErrorMessage(error),
      }

      // Vérifier si on doit réessayer
      if (delivery.attempts < subscription.retryPolicy.maxRetries) {
        delivery.status = 'pending'

        // Planifier le retry avec backoff exponentiel
        const delay =
          subscription.retryPolicy.retryDelay *
          subscription.retryPolicy.backoffMultiplier ** (delivery.attempts - 1)

        setTimeout(() => {
          this.deliverWebhook(delivery)
        }, delay)

        this.logger.warn(
          `Webhook échoué, retry ${delivery.attempts}/${subscription.retryPolicy.maxRetries} dans ${delay}ms`
        )
      } else {
        delivery.status = 'failed'
        await this.updateSubscriptionStats(subscription.id, false)
        this.logger.error(`Webhook définitivement échoué après ${delivery.attempts} tentatives`)
      }
    }

    // Sauvegarder l'état de la delivery
    await this.deliveryRepo.save(delivery)

    // Retirer de la queue si terminé
    if (delivery.status !== 'pending') {
      this.deliveryQueue.delete(delivery.id)
    }
  }

  /**
   * Génère une signature HMAC pour sécuriser les webhooks
   */
  private generateSignature(payload: unknown, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(JSON.stringify(payload))
    return `sha256=${hmac.digest('hex')}`
  }

  /**
   * Valide une URL de webhook
   */
  private async validateWebhookUrl(url: string): Promise<void> {
    try {
      const testPayload = { test: true, timestamp: new Date() }
      const response = await firstValueFrom(
        this.httpService.post(url, testPayload, {
          headers: { 'X-Webhook-Test': 'true' },
          timeout: 3000,
        })
      )

      if (response.status >= 400) {
        throw new Error(`URL returned ${response.status}`)
      }
    } catch (error: unknown) {
      throw new Error(`URL validation failed: ${getErrorMessage(error)}`)
    }
  }

  /**
   * Met à jour les statistiques d'une souscription
   */
  private async updateSubscriptionStats(subscriptionId: string, success: boolean): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
    })

    if (!subscription) return

    const metadata = subscription.metadata || {}
    metadata.lastTriggered = new Date()
    metadata.totalCalls = (metadata.totalCalls || 0) + 1

    if (success) {
      const successCount = Math.floor(((metadata.successRate || 100) * metadata.totalCalls) / 100)
      metadata.successRate = ((successCount + 1) / metadata.totalCalls) * 100
    } else {
      const successCount = Math.floor(
        ((metadata.successRate || 100) * (metadata.totalCalls - 1)) / 100
      )
      metadata.successRate = (successCount / metadata.totalCalls) * 100
    }

    subscription.metadata = metadata
    await this.subscriptionRepo.save(subscription)
  }

  /**
   * Gestionnaires d'événements internes
   */
  @OnEvent('price.calculated')
  async handlePriceCalculated(event: unknown): Promise<void> {
    const priceEvent = event as PriceChangeEvent
    if (priceEvent.previousPrice && priceEvent.newPrice) {
      const changePercent =
        ((priceEvent.newPrice - priceEvent.previousPrice) / priceEvent.previousPrice) * 100

      if (Math.abs(changePercent) > 10) {
        await this.emit({
          type: WebhookEventType.PRICE_CHANGED,
          societeId: priceEvent.societeId,
          data: priceEvent,
          metadata: {
            articleId: priceEvent.articleId,
            previousValue: priceEvent.previousPrice,
            newValue: priceEvent.newPrice,
            changePercent,
          },
        })
      }
    }
  }

  @OnEvent('rule.applied')
  async handleRuleApplied(event: unknown): Promise<void> {
    const ruleEvent = event as RuleAppliedEvent
    await this.emit({
      type: WebhookEventType.RULE_APPLIED,
      societeId: ruleEvent.societeId,
      data: ruleEvent,
      metadata: {
        ruleId: ruleEvent.ruleId,
        articleId: ruleEvent.articleId,
        channel: ruleEvent.channel,
      },
    })
  }

  /**
   * Nettoyage périodique des anciennes deliveries
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldDeliveries(): Promise<void> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const deleted = await this.deliveryRepo
      .createQueryBuilder()
      .delete()
      .where('lastAttempt < :date', { date: thirtyDaysAgo })
      .execute()

    this.logger.log(`Nettoyage: ${deleted.affected} anciennes deliveries supprimées`)
  }

  /**
   * Monitoring des webhooks défaillants
   */
  @Cron(CronExpression.EVERY_HOUR)
  async monitorFailingWebhooks(): Promise<void> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { isActive: true },
    })

    for (const subscription of subscriptions) {
      if (subscription.metadata?.successRate && subscription.metadata.successRate < 50) {
        this.logger.warn(
          `Webhook ${subscription.id} a un taux de succès faible: ${subscription.metadata.successRate}%`
        )

        // Désactiver automatiquement si trop de failures
        if (
          subscription.metadata.successRate < 10 &&
          (subscription.metadata.totalCalls ?? 0) > 100
        ) {
          subscription.isActive = false
          await this.subscriptionRepo.save(subscription)
          this.logger.error(`Webhook ${subscription.id} désactivé automatiquement`)
        }
      }
    }
  }
}
