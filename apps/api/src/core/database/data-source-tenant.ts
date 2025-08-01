// Data source template pour les bases TENANT
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import type { DataSourceOptions } from 'typeorm'
import { DataSource } from 'typeorm'

config()

const configService = new ConfigService()

export const tenantDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: 'erp_topsteel_topsteel', // Base tenant par défaut
  entities: [
    // Entités métier supprimées pour optimiser le debug
    'src/modules/notifications/entities/*.entity{.ts,.js}',
    'src/modules/marketplace/entities/*.entity{.ts,.js}',
  ],
  migrations: ['src/database/migrations/tenant/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
}

export default new DataSource(tenantDataSourceOptions)
