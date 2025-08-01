import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

export const MenuMigrationDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',

  synchronize: false,
  logging: true,

  // Pas d'entité nécessaire pour les migrations simples
  entities: [],

  // Migrations spécifiques aux menus
  migrations: ['src/database/migrations/auth/005-AddMenuItemTypes.ts'],
  migrationsTableName: 'migrations',
})
