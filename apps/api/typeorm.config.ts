import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import 'reflect-metadata'

config()

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'erp_topsteel',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})