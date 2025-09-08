import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

export const MenuMigrationDataSource = new DataSource({
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

  // Pas d'entité nécessaire pour les migrations simples
  entities: [],

  // Migrations spécifiques aux menus
  migrations: ['src/database/migrations/auth/005-AddMenuItemTypes.ts'],
  migrationsTableName: 'migrations',
})
