import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

export const AuthDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  entities: [],
  migrations: ['src/infrastructure/database/migrations/auth/*.ts'],
  synchronize: false,
  logging: true,
})
