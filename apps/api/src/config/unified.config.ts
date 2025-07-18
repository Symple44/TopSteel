import { registerAs } from '@nestjs/config'
import { envConfig } from './env.config'

export const unifiedConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: envConfig.port,
  database: {
    ...envConfig.database,
    entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
    logging: envConfig.database.logging && ['error', 'warn'],
  },
  jwt: envConfig.jwt,
  redis: envConfig.redis,
  cors: envConfig.cors,
  upload: envConfig.upload,
}))

export type UnifiedConfig = ReturnType<typeof unifiedConfig>
