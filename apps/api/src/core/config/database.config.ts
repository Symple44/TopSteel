// apps/api/src/config/database.config.ts
import { registerAs } from '@nestjs/config'

export const databaseConfig = registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',
  ssl: process.env.DB_SSL === 'true',
  synchronize: true, // Activé pour développement
  logging: process.env.DB_LOGGING === 'true',
  autoLoadEntities: true,
  retryAttempts: 3,
  retryDelay: 3000,
}))
