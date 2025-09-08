import { join } from 'node:path'
// apps/api/src/config/env.config.ts
import { config } from 'dotenv'

// Charger les fichiers .env dans l'ordre de priorité
// 1. .env.local (local overrides)
// 2. .env (configuration principale)
const rootDir = join(__dirname, '../../../..')

config({ path: join(rootDir, '.env.local') })
config({ path: join(rootDir, '.env') })

export const envConfig = {
  // Application
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.API_PORT ?? '3001', 10),
  host: process.env.API_HOST ?? '127.0.0.1',

  // Base de données
  database: {
    type: 'postgres' as const,
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'erp_topsteel',
    schema: process.env.DB_SCHEMA ?? 'public',
    ssl: process.env.DB_SSL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    maxConnections: Number.parseInt(process.env.DB_MAX_CONNECTIONS ?? '100', 10),
  },

  // JWT
  jwt: {
    secret: (() => {
      const secret = process.env.JWT_SECRET
      if (!secret || secret.length < 32) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be set and at least 32 characters in production')
        }
        // Generate a random secret for development only
        const crypto = require('node:crypto')
        return crypto.randomBytes(32).toString('hex')
      }
      return secret
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
    refreshSecret: (() => {
      const secret = process.env.JWT_REFRESH_SECRET
      if (!secret || secret.length < 32) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters in production')
        }
        // Generate a random secret for development only
        const crypto = require('node:crypto')
        return crypto.randomBytes(32).toString('hex')
      }
      return secret
    })(),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    issuer: process.env.JWT_ISSUER ?? 'topsteel-erp',
    audience: process.env.JWT_AUDIENCE ?? 'topsteel-users',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
    db: Number.parseInt(process.env.REDIS_DB ?? '0', 10),
    ttl: Number.parseInt(process.env.REDIS_TTL ?? '3600', 10),
  },

  // CORS
  cors: {
    origin: process.env.API_CORS_ORIGIN ?? 'http://127.0.0.1:3000',
    credentials: true,
  },

  // Rate Limiting
  throttle: {
    ttl: Number.parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: Number.parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  // Uploads
  upload: {
    maxSize: Number.parseInt(process.env.UPLOAD_MAX_SIZE ?? '10485760', 10),
    destination: process.env.UPLOAD_DIR ?? 'uploads',
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') ?? ['image/*'],
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL ?? 'info',
    file: process.env.LOG_FILE === 'true',
    dir: process.env.LOG_DIR ?? 'logs',
  },
}
