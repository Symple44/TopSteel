import { registerAs } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'

export const databaseConfig = registerAs('database', (): Record<string, TypeOrmModuleOptions> => ({
  // Base ERP Auth (lecture seule)
  erpAuth: {
    type: 'postgres',
    host: process.env.ERP_DB_HOST || 'localhost',
    port: parseInt(process.env.ERP_DB_PORT) || 5432,
    username: process.env.ERP_DB_USERNAME || 'postgres',
    password: process.env.ERP_DB_PASSWORD || 'postgres',
    database: process.env.ERP_DB_AUTH || 'erp_topsteel_auth',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: ['dist/shared/entities/erp/*.entity{.ts,.js}'],
  },

  // Base Marketplace (lecture/écriture)
  marketplace: {
    type: 'postgres',
    host: process.env.MARKETPLACE_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MARKETPLACE_DB_PORT || process.env.DB_PORT) || 5432,
    username: process.env.MARKETPLACE_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
    password: process.env.MARKETPLACE_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.MARKETPLACE_DB_NAME || 'erp_topsteel_marketplace',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: ['dist/domains/**/entities/*.entity{.ts,.js}'],
    migrations: ['dist/infrastructure/database/migrations/*.js'],
    migrationsTableName: 'marketplace_migrations',
  },
}))