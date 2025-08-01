import type { DataSourceOptions } from 'typeorm'

export class DatabaseConfig {
  static getAuthConfig(): DataSourceOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'erp_topsteel',

      // Entities nécessaires pour les migrations
      entities: [`${__dirname}/../**/*.entity{.ts,.js}`],

      // Migrations
      migrations: [`${__dirname}/migrations/**/*{.ts,.js}`],
      migrationsTableName: 'migrations',

      // Configuration pour les scripts
      synchronize: false,
      dropSchema: false,
      logging: false, // Désactivé pour éviter le spam dans les scripts
      ssl: false,
    }
  }
}
