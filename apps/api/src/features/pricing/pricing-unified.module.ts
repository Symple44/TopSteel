// Entities
import { PriceRule } from '@erp/entities'
import { HttpModule } from '@nestjs/axios'
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from '@nestjs-modules/ioredis'
// Utils & Factories
import * as mathjs from 'mathjs'
import { AuthModule } from '../../domains/auth/auth.module'
import { Article } from '../../domains/inventory/entities/article.entity'
// Import auth entities needed by guards
import { SocieteUser } from '../../features/societes/entities/societe-user.entity'
import { SectorPricingController } from '../../modules/pricing/controllers/sector-pricing.controller'
import { BTPIndex } from '../../modules/pricing/entities/btp-index.entity'
import { CustomerSectorAssignment } from '../../modules/pricing/entities/customer-sector-assignment.entity'
import { SectorCoefficient } from '../../modules/pricing/entities/sector-coefficient.entity'
import { BTPIndexService } from '../../modules/pricing/services/btp-index.service'
// BTP Services (integrated from modules/pricing)
import { SectorPricingService } from '../../modules/pricing/services/sector-pricing.service'
import { PriceRulesController } from './controllers/price-rules.controller'
// Controllers
import { PricingController } from './controllers/pricing.controller'
import { PricingAnalyticsController } from './controllers/pricing-analytics.controller'
import { PricingQuoteController } from './controllers/pricing-quote.controller'
import { PricingWebhooksController } from './controllers/pricing-webhooks.controller'
// Pricing Analytics Entities
import { PricingLog } from './entities/pricing-log.entity'
import { SalesHistory } from './entities/sales-history.entity'
import { WebhookDelivery } from './entities/webhook-delivery.entity'
import { WebhookEvent } from './entities/webhook-event.entity'
import { WebhookSubscription } from './entities/webhook-subscription.entity'
// GraphQL
import { PricingResolver } from './graphql/pricing.resolver'
// Repositories
import { PriceRuleRepository } from './repositories/price-rule.repository'
import { PRICE_RULE_REPOSITORY } from './repositories/price-rule.repository.interface'
import { PricingAnalyticsService } from './services/pricing-analytics.service'
import { PricingCacheService } from './services/pricing-cache.service'
// Core Services
import { PricingEngineService } from './services/pricing-engine.service'
import { PricingMLService } from './services/pricing-ml.service'
import { PricingWebhooksService } from './services/pricing-webhooks.service'

@Module({
  imports: [
    // Import AuthModule for guards and services
    AuthModule,

    // Auth entities needed by guards
    TypeOrmModule.forFeature([SocieteUser], 'auth'),

    // Database entities
    TypeOrmModule.forFeature(
      [
        // Core pricing entities
        PriceRule,
        Article,
        // BTP entities
        BTPIndex,
        SectorCoefficient,
        CustomerSectorAssignment,
        // Analytics entities
        PricingLog,
        WebhookSubscription,
        WebhookEvent,
        WebhookDelivery,
        SalesHistory,
      ],
      'tenant'
    ),

    // Redis for caching
    RedisModule.forRoot({
      type: 'single',
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
      },
    }),

    // Bull Queue for async processing
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'pricing-calculations',
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),

    // Event system
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // HTTP for webhooks
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute in ms
        limit: 100, // 100 requests per minute
      },
    ]),
  ],

  providers: [
    // ============= REPOSITORIES =============
    PriceRuleRepository,
    {
      provide: PRICE_RULE_REPOSITORY,
      useClass: PriceRuleRepository,
    },
    {
      provide: 'PriceRuleRepository',
      useClass: PriceRuleRepository,
    },

    // ============= CORE SERVICES =============
    PricingEngineService,
    PricingCacheService,
    PricingAnalyticsService,
    PricingMLService,
    PricingWebhooksService,

    // ============= BTP SERVICES =============
    SectorPricingService,
    BTPIndexService,

    // ============= SINGLETONS & FACTORIES =============
    {
      provide: 'MATH_PARSER',
      useFactory: () => {
        const parser = mathjs.parser()

        // Sécuriser le parser - whitelist des fonctions autorisées
        const allowedFunctions = [
          'add',
          'subtract',
          'multiply',
          'divide',
          'mod',
          'sqrt',
          'cbrt',
          'pow',
          'exp',
          'log',
          'log10',
          'sin',
          'cos',
          'tan',
          'asin',
          'acos',
          'atan',
          'min',
          'max',
          'round',
          'ceil',
          'floor',
          'abs',
          'sign',
          'random',
        ]

        // Créer un scope sécurisé
        const scope: Record<string, unknown> = {}
        const mathjsLib = mathjs as Record<string, unknown>
        allowedFunctions.forEach((fn) => {
          if (mathjsLib[fn]) {
            scope[fn] = mathjsLib[fn]
          }
        })

        // Parser is already secure by default
        return parser
      },
      inject: [],
    },

    {
      provide: 'PRICING_CONFIG',
      useValue: {
        cache: {
          ttl: parseInt(process.env.PRICING_CACHE_TTL || '3600', 10), // 1 hour
          maxKeys: parseInt(process.env.PRICING_CACHE_MAX_KEYS || '10000', 10),
        },
        calculations: {
          maxBulkSize: parseInt(process.env.PRICING_MAX_BULK_SIZE || '1000', 10),
          timeout: parseInt(process.env.PRICING_TIMEOUT || '30000', 10), // 30s
          circuitBreakerThreshold: parseInt(process.env.PRICING_CB_THRESHOLD || '5', 10),
        },
        webhooks: {
          maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
          timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000', 10),
          maxSubscriptionsPerSociete: parseInt(process.env.WEBHOOK_MAX_SUBS || '50', 10),
        },
        ml: {
          modelPath: process.env.ML_MODEL_PATH || './models/pricing',
          trainingEnabled: process.env.ML_TRAINING_ENABLED === 'true',
          confidenceThreshold: parseFloat(process.env.ML_CONFIDENCE_THRESHOLD || '0.7'),
        },
        analytics: {
          retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10),
          batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000', 10),
        },
      },
    },

    // ============= RESOLVERS =============
    PricingResolver,
  ],

  controllers: [
    // Core controllers
    PricingController,
    PriceRulesController,
    PricingQuoteController,

    // BTP controller (integrated)
    SectorPricingController,

    // Advanced controllers
    PricingAnalyticsController,
    PricingWebhooksController,
  ],

  exports: [
    // Export repositories
    PriceRuleRepository,
    PRICE_RULE_REPOSITORY,
    'PriceRuleRepository',

    // Export all services for use by other modules
    PricingEngineService,
    PricingCacheService,
    PricingAnalyticsService,
    PricingMLService,
    PricingWebhooksService,
    SectorPricingService,
    BTPIndexService,
    'MATH_PARSER',
    'PRICING_CONFIG',
  ],
})
// biome-ignore lint/complexity/noStaticOnlyClass: NestJS module pattern requires static methods for configuration
export class PricingUnifiedModule {
  /**
   * Configuration dynamique pour différents environnements
   */
  static forRoot(options?: {
    redis?: {
      host: string
      port: number
      password?: string
    }
    ml?: {
      enabled: boolean
      modelPath?: string
    }
    analytics?: {
      enabled: boolean
      retentionDays?: number
    }
    webhooks?: {
      enabled: boolean
      maxRetries?: number
    }
  }) {
    return {
      module: PricingUnifiedModule,
      providers: [
        {
          provide: 'DYNAMIC_CONFIG',
          useValue: options || {},
        },
      ],
    }
  }
}
