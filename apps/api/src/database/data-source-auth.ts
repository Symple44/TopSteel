// Data source pour la base AUTH
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import type { DataSourceOptions } from 'typeorm'
import { DataSource } from 'typeorm'

config()

const configService = new ConfigService()

export const authDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_AUTH_NAME', 'erp_topsteel_auth'),
  entities: [
    'src/modules/societes/entities/*.entity{.ts,.js}',
    'src/modules/users/entities/*.entity{.ts,.js}',
    'src/modules/auth/entities/*.entity{.ts,.js}',
    'src/modules/shared/entities/shared-data-registry.entity{.ts,.js}'
  ],
  migrations: ['src/database/migrations/auth/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
}

export default new DataSource(authDataSourceOptions)