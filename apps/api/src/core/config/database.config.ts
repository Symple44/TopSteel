// apps/api/src/config/database.config.ts
import { registerAs } from '@nestjs/config'

export const databaseConfig = registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: (() => {
    const password = process.env.DB_PASSWORD
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction && !password) {
      throw new Error('DB_PASSWORD environment variable is required in production')
    }

    // Use a development default only in non-production environments
    return password || (isProduction ? undefined : 'postgres')
  })(),
  database: process.env.DB_NAME || 'erp_topsteel',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: true }
      : process.env.DB_SSL === 'true',
  synchronize: process.env.NODE_ENV === 'development', // NEVER in production
  logging: process.env.DB_LOGGING === 'true',
  autoLoadEntities: true,
  retryAttempts: 3,
  retryDelay: 3000,
}))
