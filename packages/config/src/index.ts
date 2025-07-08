// packages/config/src/index.ts - Configuration centralisée
import { z } from 'zod'

export const ConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production', 'test']),
  api: z.object({
    port: z.number().default(3001),
    host: z.string().default('localhost'),
    cors: z.object({
      origin: z.string().url(),
      credentials: z.boolean().default(true),
    }),
  }),
  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(5432),
    name: z.string().default('erp_topsteel'),
    username: z.string(),
    password: z.string(),
    ssl: z.boolean().default(false),
    synchronize: z.boolean().default(false),
    maxConnections: z.number().default(100),
  }),
  redis: z
    .object({
      host: z.string().default('localhost'),
      port: z.number().default(6379),
      ttl: z.number().default(3600),
    })
    .optional(),
  jwt: z.object({
    secret: z.string().min(32),
    expiresIn: z.string().default('24h'),
    refreshSecret: z.string().min(32),
    refreshExpiresIn: z.string().default('7d'),
  }),
  uploads: z.object({
    maxSize: z.number().default(10485760),
    allowedTypes: z.array(z.string()).default(['image/*', 'application/pdf']),
  }),
})

export type AppConfig = z.infer<typeof ConfigSchema>

export function validateConfig(env: Record<string, string | undefined>): AppConfig {
  return ConfigSchema.parse({
    environment: env.NODE_ENV,
    api: {
      port: parseInt(env.API_PORT || '3001'),
      host: env.API_HOST,
      cors: {
        origin: env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    },
    database: {
      host: env.DB_HOST,
      port: parseInt(env.DB_PORT || '5432'),
      name: env.DB_NAME,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      ssl: env.DB_SSL === 'true',
      synchronize: env.DB_SYNCHRONIZE === 'true',
      maxConnections: parseInt(env.DB_MAX_CONNECTIONS || '100'),
    },
    redis: env.REDIS_HOST
      ? {
          host: env.REDIS_HOST,
          port: parseInt(env.REDIS_PORT || '6379'),
          ttl: parseInt(env.REDIS_TTL || '3600'),
        }
      : undefined,
    jwt: {
      secret: env.JWT_SECRET!,
      expiresIn: env.JWT_EXPIRES_IN || '24h',
      refreshSecret: env.JWT_REFRESH_SECRET!,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    uploads: {
      maxSize: parseInt(env.UPLOAD_MAX_SIZE || '10485760'),
      allowedTypes: (env.UPLOAD_ALLOWED_TYPES || 'image/*,application/pdf').split(','),
    },
  })
}
