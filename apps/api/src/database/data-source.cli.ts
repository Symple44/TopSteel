import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') })

// Use glob patterns for entity discovery

export const AppDataSource = new DataSource({
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
    'src/common/**/*.entity{.ts,.js}',
  ],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
})

export default AppDataSource