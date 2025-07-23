import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Load environment variables
config()

// Use glob patterns for entity discovery

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',
  synchronize: false,
  logging: false,
  entities: [
    'src/modules/**/*.entity{.ts,.js}',
    'src/entities/**/*.entity{.ts,.js}',
    'src/common/**/*.entity{.ts,.js}',
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
})