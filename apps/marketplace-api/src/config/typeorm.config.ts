import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'

// Charger les variables d'environnement
config()

const configService = new ConfigService()

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('MARKETPLACE_DB_HOST') || configService.get('DB_HOST') || 'localhost',
  port:
    configService.get<number>('MARKETPLACE_DB_PORT') ||
    configService.get<number>('DB_PORT') ||
    5432,
  username:
    configService.get('MARKETPLACE_DB_USERNAME') || configService.get('DB_USERNAME') || 'postgres',
  password:
    configService.get('MARKETPLACE_DB_PASSWORD') || configService.get('DB_PASSWORD') || 'postgres',
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
