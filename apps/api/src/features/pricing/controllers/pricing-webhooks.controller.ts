import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { Roles } from '../../../core/common/decorators/roles.decorator'
import { getErrorMessage } from '../../../core/common/utils'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import { SkipCsrf } from '../../../infrastructure/security/csrf'
import { PricingWebhooksService } from '../services/pricing-webhooks.service'
import type { AuthenticatedUser } from '../types/auth.types'
import { WebhookEventType } from '../types/webhook.types'

// DTOs
export class CreateWebhookSubscriptionDto {
  @IsUrl()
  url!: string

  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events!: WebhookEventType[]

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  filters?: {
    minPriceChange?: number
    articleIds?: string[]
    ruleIds?: string[]
    channels?: string[]
  }
}

export class UpdateWebhookSubscriptionDto {
  @IsOptional()
  @IsUrl()
  url?: string

  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEventType, { each: true })
  events?: WebhookEventType[]

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  filters?: {
    minPriceChange?: number
    articleIds?: string[]
    ruleIds?: string[]
    channels?: string[]
  }
}

export class TestWebhookDto {
  @IsUrl()
  url!: string

  @IsOptional()
  @IsEnum(WebhookEventType)
  eventType?: WebhookEventType
}

@ApiTags('Pricing Webhooks')
@Controller('pricing/webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PricingWebhooksController {
  private readonly logger = new Logger(PricingWebhooksController.name)

  constructor(private readonly webhooksService: PricingWebhooksService) {}

  @SkipCsrf()
  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée une nouvelle souscription webhook',
    description: 'Abonne votre endpoint aux événements de pricing',
  })
  @ApiBody({ type: CreateWebhookSubscriptionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Souscription créée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'URL invalide ou données incorrectes',
  })
  @Roles('ADMIN', 'MANAGER')
  async createSubscription(
    @Body(ValidationPipe) dto: CreateWebhookSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    this.logger.log(`Création webhook par ${user.email} vers ${dto.url}`)

    try {
      const subscription = await this.webhooksService.createSubscription({
        ...dto,
        societeId: user.societeId || user.currentSocieteId || 'default',
      })

      this.logger.log(`Webhook ${subscription.id} créé avec succès`)

      return {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events,
        isActive: subscription.isActive,
        secret: subscription.secret, // Affiché une seule fois
        createdAt: new Date(),
      }
    } catch (error) {
      this.logger.error('Erreur création webhook:', error)
      throw new BadRequestException(`Erreur création webhook: ${getErrorMessage(error)}`)
    }
  }

  @Get('subscriptions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liste les souscriptions webhooks',
    description: 'Récupère toutes vos souscriptions actives et inactives',
  })
  @ApiResponse({ status: 200, description: 'Liste des souscriptions' })
  async listSubscriptions(@CurrentUser() user: AuthenticatedUser) {
    try {
      // Cette méthode sera implémentée dans PricingWebhooksService
      const subscriptions = await this.webhooksService.listSubscriptions(
        user.societeId || user.currentSocieteId || 'default'
      )

      return {
        subscriptions: subscriptions.map((sub) => ({
          id: sub.id,
          url: sub.url,
          events: sub.events,
          isActive: sub.isActive,
          description: sub.metadata?.description,
          createdAt: sub.metadata?.createdBy,
          lastTriggered: sub.metadata?.lastTriggered,
          totalCalls: sub.metadata?.totalCalls || 0,
          successRate: sub.metadata?.successRate || 100,
        })),
        total: subscriptions.length,
      }
    } catch (error) {
      this.logger.error('Erreur liste webhooks:', error)
      throw error
    }
  }

  @Put('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Met à jour une souscription',
    description: "Modifie les paramètres d'une souscription existante",
  })
  @ApiParam({ name: 'id', description: 'ID de la souscription' })
  @ApiBody({ type: UpdateWebhookSubscriptionDto })
  @ApiResponse({ status: 200, description: 'Souscription mise à jour' })
  @Roles('ADMIN', 'MANAGER')
  async updateSubscription(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateWebhookSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    this.logger.log(`Mise à jour webhook ${id} par ${user.email}`)

    try {
      const subscription = await this.webhooksService.updateSubscription(
        id,
        dto,
        user.societeId || user.currentSocieteId || 'default'
      )

      return {
        id: subscription.id,
        url: subscription.url,
        events: subscription.events,
        isActive: subscription.isActive,
        updatedAt: new Date(),
      }
    } catch (error) {
      this.logger.error('Erreur mise à jour webhook:', error)
      throw error
    }
  }

  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprime une souscription',
    description: 'Supprime définitivement une souscription webhook',
  })
  @ApiParam({ name: 'id', description: 'ID de la souscription' })
  @ApiResponse({ status: 204, description: 'Souscription supprimée' })
  @Roles('ADMIN', 'MANAGER')
  async deleteSubscription(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.logger.log(`Suppression webhook ${id} par ${user.email}`)

    try {
      await this.webhooksService.deleteSubscription(
        id,
        user.societeId || user.currentSocieteId || 'default'
      )
      this.logger.log(`Webhook ${id} supprimé avec succès`)
    } catch (error) {
      this.logger.error('Erreur suppression webhook:', error)
      throw error
    }
  }

  @SkipCsrf()
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Teste un webhook',
    description: 'Envoie un événement de test vers votre endpoint',
  })
  @ApiBody({ type: TestWebhookDto })
  @ApiResponse({
    status: 200,
    description: 'Test effectué',
    schema: {
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        responseTime: { type: 'number' },
        error: { type: 'string' },
      },
    },
  })
  async testWebhook(
    @Body(ValidationPipe) dto: TestWebhookDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    this.logger.log(`Test webhook ${dto.url} par ${user.email}`)

    try {
      const result = await this.webhooksService.testWebhook(dto.url, {
        type: dto.eventType || WebhookEventType.PRICE_CHANGED,
        societeId: user.societeId || user.currentSocieteId || 'default',
        data: {
          test: true,
          articleId: 'test-123',
          previousPrice: 100,
          newPrice: 95,
          changePercent: -5,
        },
        metadata: {
          articleId: 'test-123',
          previousValue: 100,
          newValue: 95,
          changePercent: -5,
          userId: user.id,
        },
      })

      return result
    } catch (error) {
      this.logger.error('Erreur test webhook:', error)
      return {
        success: false,
        error: getErrorMessage(error),
        statusCode: 0,
        responseTime: 0,
      }
    }
  }

  @Get('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historique des événements',
    description: "Récupère l'historique des événements webhook envoyés",
  })
  @ApiResponse({ status: 200, description: 'Historique des événements' })
  async getEvents(
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('type') type: WebhookEventType | undefined,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      const events = await this.webhooksService.getEventHistory(
        user.societeId || user.currentSocieteId || 'default',
        { limit, offset, type }
      )

      return {
        events: events.events,
        total: events.total,
        pagination: {
          limit,
          offset,
          hasMore: events.total > offset + limit,
        },
      }
    } catch (error) {
      this.logger.error('Erreur récupération événements:', error)
      throw error
    }
  }

  @Get('delivery-status/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Statut de livraison d'un événement",
    description: "Détails sur la livraison d'un événement spécifique",
  })
  @ApiParam({ name: 'eventId', description: "ID de l'événement" })
  @ApiResponse({ status: 200, description: 'Statut de livraison' })
  async getDeliveryStatus(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    try {
      const delivery = await this.webhooksService.getDeliveryStatus(
        eventId,
        user.societeId || user.currentSocieteId || 'default'
      )

      return {
        eventId,
        deliveries: delivery.map((d) => ({
          id: d.id,
          url: d.url,
          status: d.status,
          attempts: d.attempts,
          lastAttempt: d.lastAttempt,
          response: d.response,
        })),
      }
    } catch (error) {
      this.logger.error('Erreur statut livraison:', error)
      throw error
    }
  }
}
