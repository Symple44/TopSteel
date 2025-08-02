import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

export const MarketplaceDataSource = new DataSource({
  type: 'postgres',
  host: process.env.MARKETPLACE_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MARKETPLACE_DB_PORT || process.env.DB_PORT || '5432'),
  username: process.env.MARKETPLACE_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.MARKETPLACE_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.MARKETPLACE_DB_NAME || 'erp_topsteel_topsteel',

  synchronize: false,
  logging: true,

  // Entités - utiliser des chemins relatifs simples
  entities: ['src/**/*.entity.{ts,js}'],

  // Migrations
  migrations: ['src/infrastructure/database/migrations/**/*.{ts,js}'],
  migrationsTableName: 'marketplace_migrations',
})