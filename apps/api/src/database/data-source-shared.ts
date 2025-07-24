// Data source pour la base SHARED
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import type { DataSourceOptions } from 'typeorm'
import { DataSource } from 'typeorm'

config()

const configService = new ConfigService()

export const sharedDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_SHARED_NAME', 'erp_topsteel_shared'),
  entities: [
    'src/modules/shared/entities/shared-*.entity{.ts,.js}'
  ],
  migrations: ['src/database/migrations/shared/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
}

export default new DataSource(sharedDataSourceOptions)