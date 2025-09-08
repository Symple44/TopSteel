const { DataSource } = require('typeorm')
const { config } = require('dotenv')
const { resolve } = require('node:path')

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') })

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
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
  database: process.env.DB_NAME || 'erp_topsteel',
  synchronize: false,
  logging: true,
  entities: ['src/modules/**/*.entity{.ts,.js}', 'src/common/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
})

module.exports = AppDataSource
