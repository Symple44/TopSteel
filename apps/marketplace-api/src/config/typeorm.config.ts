import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

const configService = new ConfigService()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('MARKETPLACE_DB_HOST') || configService.get('DB_HOST') || 'localhost',
  port: parseInt(
    configService.get('MARKETPLACE_DB_PORT') || configService.get('DB_PORT') || '5432',
    10
  ),
  username:
    configService.get('MARKETPLACE_DB_USERNAME') || configService.get('DB_USERNAME') || 'postgres',
  password: (() => {
    const password =
      configService.get('MARKETPLACE_DB_PASSWORD') || configService.get('DB_PASSWORD')
    const nodeEnv = configService.get('NODE_ENV')

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
  database: configService.get('MARKETPLACE_DB_NAME') || 'erp_topsteel_marketplace',
  entities: [
    'src/domains/page-builder/entities/*.entity.ts',
    'dist/domains/page-builder/entities/*.entity.js',
  ],
  migrations: [
    'src/infrastructure/database/migrations/*.ts',
    'dist/infrastructure/database/migrations/*.js',
  ],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
})
