import type { DataSourceOptions } from 'typeorm'

export function getAuthConfig(): DataSourceOptions {
  return {
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

    // Entities nécessaires pour les migrations
    entities: [`${__dirname}/../**/*.entity{.ts,.js}`],

    // Migrations
    migrations: [`${__dirname}/migrations/**/*{.ts,.js}`],
    migrationsTableName: 'migrations',

    // Configuration pour les scripts
    synchronize: false, // NEVER true in production
    dropSchema: false,
    logging: false, // Désactivé pour éviter le spam dans les scripts
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  }
}

// Compatibilité avec l'ancienne interface de classe
export const DatabaseConfig = {
  getAuthConfig,
}
