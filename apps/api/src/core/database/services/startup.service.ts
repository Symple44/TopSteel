import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { DatabaseHealthService } from './health.service'
import type { MigrationService } from './migration.service'
import type { MigrationLoaderService } from './migration-loader.service'
import type { SeederService } from './seeder.service'

@Injectable()
export class DatabaseStartupService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseStartupService.name)
  private readonly isDevelopment: boolean
  private readonly isProduction: boolean

  constructor(
    private readonly configService: ConfigService,
    private readonly migrationService: MigrationService,
    private readonly seederService: SeederService,
    private readonly healthService: DatabaseHealthService,
    private readonly migrationLoaderService: MigrationLoaderService
  ) {
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development'
    this.isProduction = this.configService.get('NODE_ENV') === 'production'
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('🚀 Initialisation de la base de données...')

      // 1. Vérifier la connexion de base (sans requêtes sur les tables)
      await this.checkBasicConnection()

      // 2. Exécuter les migrations si nécessaire
      await this.handleMigrations()

      // 3. Exécuter les seeds si nécessaire
      await this.handleSeeds()

      // 4. Vérification finale complète
      await this.finalHealthCheck()

      this.logger.log('✅ Base de données prête')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'initialisation de la base de données:", error)

      // En production, on ne veut pas que l'app crash
      if (this.isProduction) {
        this.logger.error('⚠️  Application démarrée en mode dégradé')
      } else {
        throw error
      }
    }
  }

  /**
   * Vérifie la connexion de base sans requêtes sur les tables
   */
  private async checkBasicConnection(): Promise<void> {
    this.logger.log('🔍 Vérification de la connexion de base...')

    const metrics = await this.healthService.getBasicMetrics()

    if (!metrics.isConnected) {
      this.logger.error('❌ Connexion à la base de données impossible')
      throw new Error('Database connection failed')
    }

    this.logger.log(`✅ Connexion établie`)
    this.logger.log(`📊 Temps de réponse: ${metrics.responseTime}ms`)
  }

  /**
   * Gère les migrations
   */
  private async handleMigrations(): Promise<void> {
    this.logger.log('🔄 Vérification des migrations...')

    if (this.isDevelopment) {
      // En développement, on peut exécuter les migrations automatiquement
      const autoRunMigrations = this.configService.get<boolean>('AUTO_RUN_MIGRATIONS', true) // Default to true

      if (autoRunMigrations) {
        this.logger.log('🔄 Exécution automatique des migrations (développement)')

        // Utiliser le MigrationLoaderService pour une approche plus robuste
        try {
          await this.migrationLoaderService.ensureMigrations()
        } catch (_error) {
          this.logger.warn(
            '⚠️  Échec du MigrationLoaderService, essai avec MigrationService standard'
          )
          await this.migrationService.runPendingMigrations()
        }
      } else {
        // Juste vérifier s'il y a des migrations en attente
        const status = await this.migrationService.getMigrationStatus()

        if (status.pending.length > 0) {
          this.logger.warn(`⚠️  ${status.pending.length} migration(s) en attente`)
          this.logger.warn('💡 Utilisez npm run migration:run pour les exécuter')
        }
      }
    } else {
      // En production, on ne fait que vérifier
      const isUpToDate = await this.migrationService.isDatabaseUpToDate()

      if (!isUpToDate) {
        this.logger.warn('⚠️  Migrations en attente en production')
        this.logger.warn('💡 Définir ALLOW_PRODUCTION_MIGRATIONS=true pour autoriser')
      }
    }
  }

  /**
   * Gère les seeds
   */
  private async handleSeeds(): Promise<void> {
    const autoRunSeeds = this.configService.get<boolean>('AUTO_RUN_SEEDS', this.isDevelopment)

    if (autoRunSeeds) {
      this.logger.log("🌱 Vérification des données d'initialisation...")
      await this.seederService.runSeeds()
    } else {
      this.logger.log('⏭️  Seeds désactivés')
    }
  }

  /**
   * Vérification finale
   */
  private async finalHealthCheck(): Promise<void> {
    const metrics = await this.healthService.getBasicMetrics()

    this.logger.log(`📈 Connexions actives: ${metrics.connectionCount}`)
    this.logger.log(`⏱️  Temps de réponse: ${metrics.responseTime}ms`)

    if (!metrics.isConnected) {
      this.logger.error('❌ Perte de connexion détectée après initialisation')
      throw new Error('Database connection lost')
    }
  }

  /**
   * Méthode pour réinitialiser en développement
   */
  async resetDevelopmentDatabase(): Promise<void> {
    if (!this.isDevelopment) {
      throw new Error('Reset interdit en production')
    }

    this.logger.warn('🔄 Réinitialisation de la base de développement...')

    try {
      // Reset des seeds
      await this.seederService.resetSeeds()

      // Rollback des migrations (si nécessaire)
      // await this.migrationService.revertAllMigrations()

      // Re-run des migrations
      await this.migrationService.runPendingMigrations()

      // Re-run des seeds
      await this.seederService.runSeeds()

      this.logger.log('✅ Base de développement réinitialisée')
    } catch (error) {
      this.logger.error('❌ Erreur lors de la réinitialisation:', error)
      throw error
    }
  }
}
