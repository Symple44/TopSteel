import type { ConfigService } from '@nestjs/config'
import type { TypeOrmModuleOptions } from '@nestjs/typeorm'

export const createDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development')
  const isProduction = nodeEnv === 'production'
  const isDevelopment = nodeEnv === 'development'

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'erp_topsteel'),

    // Découverte automatique des entités
    entities: [`${__dirname}/../**/*.entity{.ts,.js}`],

    // Migrations - approche standard TypeORM
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    migrationsTableName: 'migrations',

    // Configuration de sécurité
    synchronize: false, // JAMAIS true en production
    dropSchema: false, // JAMAIS true en production

    // Gestion des migrations par environnement
    migrationsRun: isDevelopment && configService.get<boolean>('AUTO_RUN_MIGRATIONS', false),

    // Logging intelligent
    logging: isProduction ? ['error', 'warn'] : configService.get<boolean>('DB_LOGGING', true),

    // Pool de connexions simplifié pour le debug
    extra: {
      max: 10,
      min: 2,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },

    // SSL pour la production
    ssl: isProduction
      ? {
          rejectUnauthorized: false, // Ajuster selon votre configuration SSL
        }
      : false,

    // Cache des requêtes - désactivé temporairement pour le debug
    cache: false,
  }

  // Ajouts spécifiques au développement
  if (isDevelopment) {
    Object.assign(baseConfig, {
      logging: true,
      logger: 'advanced-console' as const,
      maxQueryExecutionTime: 1000, // Log des requêtes lentes
    })
  }

  return baseConfig
}
