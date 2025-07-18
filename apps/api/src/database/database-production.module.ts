import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { createSimpleDatabaseConfig } from './database.config.simple'

// Services
import { MigrationService } from './services/migration.service'
import { SeederService } from './services/seeder.service'
import { DatabaseHealthService } from './services/health.service'
import { DatabaseStartupService } from './services/startup.service'
import { MigrationLoaderService } from './services/migration-loader.service'

// Controller
import { DatabaseController } from './controllers/database.controller'

/**
 * Module de base de données robuste et production-ready
 * 
 * Fonctionnalités:
 * - Configuration par environnement
 * - Gestion des migrations TypeORM standard
 * - Système de seeds transactionnel
 * - Monitoring de santé
 * - API d'administration sécurisée
 * - Protection contre les opérations dangereuses en production
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createSimpleDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [
    MigrationService,
    SeederService,
    DatabaseHealthService,
    DatabaseStartupService,
    MigrationLoaderService,
  ],
  controllers: [
    DatabaseController,
  ],
  exports: [
    MigrationService,
    SeederService,
    DatabaseHealthService,
    DatabaseStartupService,
    MigrationLoaderService,
  ],
})
export class DatabaseProductionModule {}

/**
 * GUIDE D'UTILISATION:
 * 
 * 1. DÉVELOPPEMENT:
 *    - AUTO_RUN_MIGRATIONS=true pour exécuter les migrations automatiquement
 *    - AUTO_RUN_SEEDS=true pour créer les données d'initialisation
 *    - Accès complet à tous les endpoints d'administration
 * 
 * 2. PRODUCTION:
 *    - ALLOW_PRODUCTION_MIGRATIONS=true pour autoriser les migrations
 *    - AUTO_RUN_SEEDS=false par défaut
 *    - Opérations destructives interdites
 *    - Monitoring de santé activé
 * 
 * 3. ENDPOINTS DISPONIBLES:
 *    - GET /api/admin/database/health - Santé de la base
 *    - GET /api/admin/database/migrations/status - Statut des migrations
 *    - POST /api/admin/database/migrations/run - Exécuter les migrations
 *    - POST /api/admin/database/seeds/run - Exécuter les seeds
 *    - GET /api/admin/database/stats - Statistiques détaillées
 * 
 * 4. COMMANDES CLI:
 *    - npm run migration:generate -- --name=MigrationName
 *    - npm run migration:run
 *    - npm run migration:revert
 *    - npm run seed:run
 * 
 * 5. VARIABLES D'ENVIRONNEMENT:
 *    - NODE_ENV=production|development
 *    - AUTO_RUN_MIGRATIONS=true|false
 *    - AUTO_RUN_SEEDS=true|false
 *    - ALLOW_PRODUCTION_MIGRATIONS=true|false
 *    - DB_LOGGING=true|false
 *    - DB_POOL_SIZE=10
 *    - DB_CONNECTION_TIMEOUT=30000
 */