import { Article } from '@erp/entities'
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { JwtModule } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RedisModule } from '@nestjs-modules/ioredis'
// Core Services
import { EmailService } from '../../core/email/email.service'
// Sync Services
import { MarketplaceSyncService } from '../../domains/marketplace/services/marketplace-sync.service'
import { Partner } from '../../domains/partners/entities/partner.entity'
import { PricingEngineService } from '../pricing/services/pricing-engine.service'
import { MarketplaceAuthGuard } from './auth/guards/marketplace-auth.guard'
import { MarketplaceAuthController } from './auth/marketplace-auth.controller'
// Auth Services
import { MarketplaceAuthService } from './auth/marketplace-auth.service'
import { MarketplacePricingController } from './controllers/marketplace-pricing.controller'
// Entities
import { MarketplaceCustomer } from './entities/marketplace-customer.entity'
import { MarketplaceCustomerAddress } from './entities/marketplace-customer-address.entity'
// MarketplaceProduct supprimé - utilise Article ERP
import { MarketplaceOrder } from './entities/marketplace-order.entity'
import { MarketplaceOrderItem } from './entities/marketplace-order-item.entity'
// Order Services
import { MarketplaceOrderWorkflowService } from './orders/marketplace-order-workflow.service'
import { MarketplacePricingIntegrationService } from './pricing/marketplace-pricing-integration.service'
// Processors
import { MarketplaceSyncProcessor } from './processors/marketplace-sync.processor'

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      MarketplaceCustomer,
      MarketplaceCustomerAddress,
      // MarketplaceProduct supprimé - utilise Article ERP
      Article, // Entité ERP pour les produits
      Partner, // Entité ERP pour les clients
      MarketplaceOrder,
      MarketplaceOrderItem,
    ]),

    // JWT Configuration for Marketplace
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('MARKETPLACE_JWT_SECRET') ||
          configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('MARKETPLACE_JWT_EXPIRY') || '1h',
          issuer: 'topsteel-marketplace',
          audience: 'topsteel-customers',
        },
      }),
    }),

    // Bull Queue for async processing
    BullModule.registerQueue({
      name: 'marketplace-sync',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL') || 60,
            limit: configService.get<number>('THROTTLE_LIMIT') || 10,
          },
        ],
        // Note: storage property should be configured with a proper ThrottlerStorage instance if needed
      }),
    }),

    // Event Emitter
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Redis for caching and sessions
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        options: {
          db: configService.get<number>('REDIS_DB') || 0,
          keyPrefix: 'marketplace:',
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
        },
      }),
    }),

    ConfigModule,
  ],

  controllers: [MarketplaceAuthController, MarketplacePricingController],

  providers: [
    // Core Services
    MarketplaceAuthService,
    MarketplaceOrderWorkflowService,
    MarketplaceSyncService,

    // Guards
    MarketplaceAuthGuard,

    // Processors
    MarketplaceSyncProcessor,

    // Email Service
    EmailService,

    // Pricing Integration
    PricingEngineService,
    MarketplacePricingIntegrationService,

    // Security Event Logger
    {
      provide: 'SECURITY_EVENT_LOGGER',
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get<boolean>('SECURITY_LOGGING_ENABLED') ?? true,
        logLevel: configService.get<string>('SECURITY_LOG_LEVEL') || 'info',
      }),
      inject: [ConfigService],
    },
  ],

  exports: [
    MarketplaceAuthService,
    MarketplaceOrderWorkflowService,
    MarketplaceSyncService,
    MarketplaceAuthGuard,
    JwtModule,
  ],
})
export class MarketplaceModule {
  constructor(private readonly configService: ConfigService) {
    this.validateConfiguration()
  }

  private validateConfiguration(): void {
    const requiredVars = ['MARKETPLACE_JWT_SECRET', 'REDIS_URL', 'MARKETPLACE_URL']

    const missing = requiredVars.filter(
      (varName) =>
        !this.configService.get(varName) &&
        !this.configService.get(varName.replace('MARKETPLACE_', ''))
    )

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }

    // Validate JWT secret strength
    const jwtSecret =
      this.configService.get<string>('MARKETPLACE_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET')

    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long')
    }
  }
}
