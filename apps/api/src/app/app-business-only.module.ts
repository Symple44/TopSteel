import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
// Configuration
import { appConfig } from '../core/config/app.config'
import { databaseConfig } from '../core/config/database.config'
// Core modules
import { DatabaseMultiTenantModule } from '../core/database/database-multi-tenant.module'
// Business modules
import { BusinessModule } from '../domains/business.module'

/**
 * Module principal simplifié pour démontrer l'architecture business multi-tenant
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Base de données multi-tenant
    DatabaseMultiTenantModule,

    // Modules métier
    BusinessModule,
  ],
  controllers: [],
  providers: [],
})
export class AppBusinessOnlyModule {}
