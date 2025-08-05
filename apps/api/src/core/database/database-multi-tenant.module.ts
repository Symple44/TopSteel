import { Global, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MultiTenantDatabaseConfig } from './config/multi-tenant-database.config'

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: 'auth',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const multiTenantConfig = new MultiTenantDatabaseConfig(configService)
        return multiTenantConfig.getAuthDatabaseConfig()
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: 'shared',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const multiTenantConfig = new MultiTenantDatabaseConfig(configService)
        return multiTenantConfig.getSharedDatabaseConfig()
      },
      inject: [ConfigService],
    }),
    // Configuration d'un tenant par défaut pour les services qui en ont besoin
    TypeOrmModule.forRootAsync({
      name: 'tenant',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const multiTenantConfig = new MultiTenantDatabaseConfig(configService)
        // Utilise le code tenant depuis la config ou 'topsteel' par défaut
        const defaultTenantCode = configService.get('DEFAULT_TENANT_CODE', 'topsteel')
        return multiTenantConfig.getTenantDatabaseConfig(defaultTenantCode)
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: MultiTenantDatabaseConfig,
      useFactory: (configService: ConfigService) => {
        return new MultiTenantDatabaseConfig(configService)
      },
      inject: [ConfigService],
    },
  ],
  exports: [MultiTenantDatabaseConfig, TypeOrmModule],
})
export class DatabaseMultiTenantModule {}
