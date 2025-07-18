// apps/api/src/database/data-source.ts
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import type { DataSourceOptions } from 'typeorm'
import { DataSource } from 'typeorm'
import { resolve } from 'path'

config()

const configService = new ConfigService()
const isDevelopment = configService.get('NODE_ENV') === 'development'

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_NAME', 'erp_topsteel'),
  entities: [
    isDevelopment 
      ? 'src/**/*.entity{.ts,.js}' 
      : 'dist/**/*.entity{.ts,.js}'
  ],
  synchronize: isDevelopment && configService.get('USE_SYNC', 'false') === 'true',
  migrations: [
    isDevelopment 
      ? 'src/database/migrations/*{.ts,.js}'
      : 'dist/database/migrations/*{.ts,.js}'
  ],
  migrationsRun: false,
  logging: configService.get('NODE_ENV') === 'development',
  ssl:
    configService.get('DB_SSL') === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
}

export default new DataSource(dataSourceOptions)
