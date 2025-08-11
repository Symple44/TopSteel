import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from '@nestjs-modules/ioredis'
import { GraphQLModule } from '@nestjs/graphql'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { BullModule } from '@nestjs/bull'
import { ThrottlerModule } from '@nestjs/throttler'
import { HttpModule } from '@nestjs/axios'
import { AuthModule } from '../../domains/auth/auth.module'

// Entities
import { PriceRule } from '@erp/entities'
import { Article } from '../../domains/inventory/entities/article.entity'
import { BTPIndex } from '../../modules/pricing/entities/btp-index.entity'
import { SectorCoefficient } from '../../modules/pricing/entities/sector-coefficient.entity'
import { CustomerSectorAssignment } from '../../modules/pricing/entities/customer-sector-assignment.entity'

// Pricing Analytics Entities
import { PricingLog } from './entities/pricing-log.entity'
import { WebhookSubscription } from './entities/webhook-subscription.entity'
import { WebhookEvent } from './entities/webhook-event.entity'
import { WebhookDelivery } from './entities/webhook-delivery.entity'
import { SalesHistory } from './entities/sales-history.entity'

// Core Services
import { PricingEngineService } from './services/pricing-engine.service'
import { PricingCacheService } from './services/pricing-cache.service'
import { PricingAnalyticsService } from './services/pricing-analytics.service'
import { PricingMLService } from './services/pricing-ml.service'
import { PricingWebhooksService } from './services/pricing-webhooks.service'

// Repositories
import { PriceRuleRepository } from './repositories/price-rule.repository'
import { PRICE_RULE_REPOSITORY } from './repositories/price-rule.repository.interface'

// BTP Services (integrated from modules/pricing)
import { SectorPricingService } from '../../modules/pricing/services/sector-pricing.service'
import { BTPIndexService } from '../../modules/pricing/services/btp-index.service'

// Controllers
import { PricingController } from './controllers/pricing.controller'
import { PriceRulesController } from './controllers/price-rules.controller'
import { PricingQuoteController } from './controllers/pricing-quote.controller'
import { SectorPricingController } from '../../modules/pricing/controllers/sector-pricing.controller'
import { PricingAnalyticsController } from './controllers/pricing-analytics.controller'
import { PricingWebhooksController } from './controllers/pricing-webhooks.controller'

// GraphQL
import { PricingResolver } from './graphql/pricing.resolver'

// Utils & Factories
import * as mathjs from 'mathjs'

// Import auth entities needed by guards
import { SocieteUser } from '../../features/societes/entities/societe-user.entity'

@Module({
  imports: [
    // Import AuthModule for guards and services
    AuthModule,
    
    // Auth entities needed by guards
    TypeOrmModule.forFeature([SocieteUser], 'auth'),
    
    // Database entities
    TypeOrmModule.forFeature([
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
      SalesHistory
    ], 'tenant'),

    // Redis for caching
    RedisModule.forRoot({
      type: 'single',
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
    }),

    // Bull Queue for async processing
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
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
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute in ms
      limit: 100, // 100 requests per minute
    }]),
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
          'add', 'subtract', 'multiply', 'divide', 'mod',
          'sqrt', 'cbrt', 'pow', 'exp', 'log', 'log10',
          'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
          'min', 'max', 'round', 'ceil', 'floor', 'abs',
          'sign', 'random'
        ]
        
        // Créer un scope sécurisé
        const scope = {}
        allowedFunctions.forEach(fn => {
          if (mathjs[fn]) {
            scope[fn] = mathjs[fn]
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
          ttl: parseInt(process.env.PRICING_CACHE_TTL || '3600'), // 1 hour
          maxKeys: parseInt(process.env.PRICING_CACHE_MAX_KEYS || '10000'),
        },
        calculations: {
          maxBulkSize: parseInt(process.env.PRICING_MAX_BULK_SIZE || '1000'),
          timeout: parseInt(process.env.PRICING_TIMEOUT || '30000'), // 30s
          circuitBreakerThreshold: parseInt(process.env.PRICING_CB_THRESHOLD || '5'),
        },
        webhooks: {
          maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3'),
          timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '5000'),
          maxSubscriptionsPerSociete: parseInt(process.env.WEBHOOK_MAX_SUBS || '50'),
        },
        ml: {
          modelPath: process.env.ML_MODEL_PATH || './models/pricing',
          trainingEnabled: process.env.ML_TRAINING_ENABLED === 'true',
          confidenceThreshold: parseFloat(process.env.ML_CONFIDENCE_THRESHOLD || '0.7'),
        },
        analytics: {
          retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90'),
          batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000'),
        }
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
export class PricingUnifiedModule {
  constructor() {
    // Module initialized
  }

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