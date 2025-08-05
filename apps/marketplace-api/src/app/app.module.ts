import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CacheModule } from '@nestjs/cache-manager'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'

// Configuration
import { databaseConfig } from '../config/database.config'
import { redisConfig } from '../config/redis.config'
import { appConfig } from '../config/app.config'

// Modules
import { DatabaseModule } from '../infrastructure/database/database.module'
import { TenantModule } from '../shared/tenant/tenant.module'
import { AuthModule } from '../domains/auth/auth.module'
import { ProductsModule } from '../domains/products/products.module'
import { CustomersModule } from '../domains/customers/customers.module'
import { OrdersModule } from '../domains/orders/orders.module'
import { ThemesModule } from '../domains/themes/themes.module'
import { StorefrontModule } from '../domains/storefront/storefront.module'
import { PageBuilderModule } from '../domains/page-builder/page-builder.module'

// Controllers & Services
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TestSimpleController } from '../test-simple.controller'
// import { HealthController } from '../infrastructure/health/health.controller' // Disabled for now

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
      expandVariables: true,
    }),

    // Cache Redis
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        store: 'redis',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        db: parseInt(process.env.REDIS_DB) || 2,
        ttl: parseInt(process.env.CACHE_TTL) || 300,
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Infrastructure
    DatabaseModule,
    TenantModule,

    // Auth
    AuthModule,

    // Business domains
    ProductsModule,
    CustomersModule,
    OrdersModule,
    ThemesModule,
    StorefrontModule,
    PageBuilderModule,
  ],
  controllers: [AppController, TestSimpleController],
  providers: [AppService],
})
export class AppModule {}
