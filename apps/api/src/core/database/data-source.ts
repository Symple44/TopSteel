import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',

  synchronize: false,
  logging: true,

  // Entités - utiliser des chemins relatifs simples
  entities: ['src/**/*.entity.{ts,js}'],

  // Migrations
  migrations: ['src/database/migrations/**/*.{ts,js}'],
  migrationsTableName: 'migrations',
})
