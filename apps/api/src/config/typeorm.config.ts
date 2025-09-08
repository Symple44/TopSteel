import * as dotenv from 'dotenv'
import { DataSource } from 'typeorm'

dotenv.config({ path: '.env' })

export const AuthDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: (() => {
    const password = process.env.DB_PASSWORD
    const nodeEnv = process.env.NODE_ENV

    if (!password) {
      if (nodeEnv === 'production') {
        throw new Error('DB_PASSWORD environment variable is required in production')
      }
      // Use development default password for non-production environments
      return 'dev_password'
    }
    return password
  })(),
  database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  entities: [],
  migrations: ['src/infrastructure/database/migrations/auth/*.ts'],
  synchronize: false,
  logging: true,
})
