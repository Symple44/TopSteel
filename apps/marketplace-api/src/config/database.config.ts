import { registerAs } from '@nestjs/config'
import type { TypeOrmModuleOptions } from '@nestjs/typeorm'

export const databaseConfig = registerAs(
  'database',
  (): Record<string, TypeOrmModuleOptions> => ({
    // Base ERP Auth (lecture seule)
    erpAuth: {
      type: 'postgres',
      host: process.env.ERP_DB_HOST || 'localhost',
      port: parseInt(process.env.ERP_DB_PORT || '5432', 10),
      username: process.env.ERP_DB_USERNAME || 'postgres',
      password: (() => {
        const password = process.env.ERP_DB_PASSWORD
        const nodeEnv = process.env.NODE_ENV

        if (!password) {
          if (nodeEnv === 'production') {
            throw new Error('ERP_DB_PASSWORD environment variable is required in production')
          }
          // Use development default password for non-production environments
          return 'dev_password'
        }
        return password
      })(),
      database: process.env.ERP_DB_AUTH || 'erp_topsteel_auth',
      synchronize: false, // NEVER true in production
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
      entities: ['dist/shared/entities/erp/*.entity{.ts,.js}'],
    },

    // Base Marketplace (lecture/écriture)
    marketplace: {
      type: 'postgres',
      host: process.env.MARKETPLACE_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.MARKETPLACE_DB_PORT || process.env.DB_PORT || '5432', 10),
      username: process.env.MARKETPLACE_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
      password: (() => {
        const password = process.env.MARKETPLACE_DB_PASSWORD || process.env.DB_PASSWORD
        const nodeEnv = process.env.NODE_ENV

        if (!password) {
          if (nodeEnv === 'production') {
            throw new Error(
              'MARKETPLACE_DB_PASSWORD or DB_PASSWORD environment variable is required in production'
            )
          }
          // Use development default password for non-production environments
          return 'dev_password'
        }
        return password
      })(),
      database: process.env.MARKETPLACE_DB_NAME || 'erp_topsteel_marketplace',
      synchronize: process.env.NODE_ENV === 'development', // NEVER true in production
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
      entities: ['dist/domains/**/entities/*.entity{.ts,.js}'],
      migrations: ['dist/infrastructure/database/migrations/*.js'],
      migrationsTableName: 'marketplace_migrations',
    },
  })
)
