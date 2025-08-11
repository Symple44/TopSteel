import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../../../../.env') })

// Configuration pour les migrations
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel_topsteel',
  schema: 'public',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    path.join(__dirname, '../../**/*.entity.{ts,js}'),
    path.join(__dirname, '../../../domains/**/*.entity.{ts,js}'),
    path.join(__dirname, '../../../features/**/*.entity.{ts,js}'),
    path.join(__dirname, '../../../modules/**/*.entity.{ts,js}')
  ],
  migrations: [
    path.join(__dirname, '../migrations/topsteel/*.{ts,js}')
  ],
  subscribers: [],
})

// Pour la base auth (si nécessaire)
export const AuthDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_AUTH_NAME || 'erp_topsteel_auth',
  schema: 'public',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    path.join(__dirname, '../../**/*.entity.{ts,js}'),
    path.join(__dirname, '../../../domains/auth/**/*.entity.{ts,js}'),
    path.join(__dirname, '../../../features/societes/**/*.entity.{ts,js}'),
    path.join(__dirname, '../../../features/pricing/entities/*.entity.{ts,js}')
  ],
  migrations: [
    path.join(__dirname, '../migrations/auth/*.{ts,js}')
  ],
  subscribers: [],
})

// Export par défaut pour TypeORM CLI
export default AppDataSource