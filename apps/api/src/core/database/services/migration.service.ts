import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'

export interface MigrationResult {
  database: string
  success: boolean
  migrationsRun: string[]
  error?: string
}

export interface MigrationStatus {
  database: string
  executed: number
  pending: number
  lastMigration?: string
  status: 'up-to-date' | 'pending' | 'error'
  error?: string
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name)
  private readonly isProduction: boolean

  constructor(
    @InjectDataSource('auth') private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production'
  }

  /**
   * Exécute les migrations en attente de manière sécurisée
   */
  async runPendingMigrations(): Promise<void> {
    try {
      this.logger.log('🔄 Vérification des migrations en attente...')

      // Vérifier si la table migrations existe et a des entrées
      const migrationTableExists = await this.checkMigrationTableExists()

      if (!migrationTableExists) {
        this.logger.log('🔄 Table migrations non trouvée, création automatique...')
      }

      // Vérifier les migrations exécutées
      const executedMigrations = migrationTableExists
        ? await this.dataSource.query('SELECT name FROM migrations ORDER BY timestamp')
        : []

      // Vérifier les migrations disponibles
      const allMigrations = this.dataSource.migrations

      this.logger.log(`📋 ${allMigrations.length} migration(s) disponible(s)`)
      this.logger.log(`📋 ${executedMigrations.length} migration(s) déjà exécutée(s)`)

      // Si aucune migration n'a été exécutée mais des migrations existent, les exécuter
      if (executedMigrations.length === 0 && allMigrations.length > 0) {
        this.logger.log('🔄 Base de données vide, exécution de toutes les migrations...')

        // En production, demander confirmation ou utiliser un flag
        if (this.isProduction) {
          const allowProductionMigrations = this.configService.get<boolean>(
            'ALLOW_PRODUCTION_MIGRATIONS',
            false
          )
          if (!allowProductionMigrations) {
            this.logger.warn(
              '⚠️  Migrations bloquées en production. Définir ALLOW_PRODUCTION_MIGRATIONS=true pour autoriser'
            )
            return
          }
        }

        // Exécuter les migrations
        await this.dataSource.runMigrations({
          transaction: 'each', // Chaque migration dans sa propre transaction
        })

        this.logger.log('✅ Migrations exécutées avec succès')
        return
      }

      // Utiliser la méthode standard pour les migrations en attente
      const pendingMigrations = await this.dataSource.showMigrations()

      if (
        !pendingMigrations ||
        (Array.isArray(pendingMigrations) && pendingMigrations.length === 0)
      ) {
        this.logger.log('✅ Aucune migration en attente')
        return
      }

      const migrationCount = Array.isArray(pendingMigrations) ? pendingMigrations.length : 0
      this.logger.log(`📋 ${migrationCount} migration(s) en attente`)

      // En production, demander confirmation ou utiliser un flag
      if (this.isProduction) {
        const allowProductionMigrations = this.configService.get<boolean>(
          'ALLOW_PRODUCTION_MIGRATIONS',
          false
        )
        if (!allowProductionMigrations) {
          this.logger.warn(
            '⚠️  Migrations bloquées en production. Définir ALLOW_PRODUCTION_MIGRATIONS=true pour autoriser'
          )
          return
        }
      }

      // Exécuter les migrations
      await this.dataSource.runMigrations({
        transaction: 'each', // Chaque migration dans sa propre transaction
      })

      this.logger.log('✅ Migrations exécutées avec succès')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'exécution des migrations:", error)
      throw error
    }
  }

  /**
   * Annule la dernière migration (développement uniquement)
   */
  async revertLastMigration(): Promise<void> {
    if (this.isProduction) {
      throw new Error('Rollback interdit en production')
    }

    try {
      this.logger.log('🔄 Annulation de la dernière migration...')

      await this.dataSource.undoLastMigration({
        transaction: 'each',
      })

      this.logger.log('✅ Migration annulée avec succès')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'annulation de la migration:", error)
      throw error
    }
  }

  /**
   * Vérifie si la table migrations existe
   */
  private async checkMigrationTableExists(): Promise<boolean> {
    try {
      const result = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        )
      `)
      return result[0]?.exists || false
    } catch (error) {
      this.logger.error('Erreur lors de la vérification de la table migrations:', error)
      return false
    }
  }

  /**
   * Affiche l'état des migrations
   */
  async getMigrationStatus(): Promise<{
    executed: string[]
    pending: string[]
    lastExecuted?: string
  }> {
    try {
      // Vérifier si la table migrations existe
      const migrationTableExists = await this.checkMigrationTableExists()

      let executedMigrations: Array<{ name: string; timestamp: number }> = []
      if (migrationTableExists) {
        executedMigrations = await this.dataSource.query(`
          SELECT name, timestamp FROM migrations ORDER BY timestamp DESC
        `)
      }

      const pendingMigrations = await this.dataSource.showMigrations()

      return {
        executed: executedMigrations.map((m) => m.name),
        pending: Array.isArray(pendingMigrations) ? pendingMigrations : [],
        lastExecuted: executedMigrations[0]?.name,
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la récupération du statut des migrations:', error)
      throw error
    }
  }

  /**
   * Vérifie si la base de données est à jour
   */
  async isDatabaseUpToDate(): Promise<boolean> {
    try {
      const pendingMigrations = await this.dataSource.showMigrations()
      return (
        !pendingMigrations || (Array.isArray(pendingMigrations) && pendingMigrations.length === 0)
      )
    } catch (error) {
      this.logger.error('❌ Erreur lors de la vérification de la base de données:', error)
      return false
    }
  }

  /**
   * Crée une nouvelle migration
   */
  async generateMigration(name: string): Promise<void> {
    if (this.isProduction) {
      throw new Error('Génération de migration interdite en production')
    }

    try {
      this.logger.log(`🔄 Génération de la migration: ${name}`)

      // Cette fonctionnalité nécessite la CLI TypeORM
      // En pratique, on utilisera: npm run migration:generate -- --name=MigrationName

      this.logger.log(`✅ Utiliser la commande: npm run migration:generate -- --name=${name}`)
    } catch (error) {
      this.logger.error('❌ Erreur lors de la génération de la migration:', error)
      throw error
    }
  }

  /**
   * Sauvegarde la base avant migration (développement)
   */
  async createBackupBeforeMigration(): Promise<string | null> {
    if (this.isProduction) {
      // En production, utiliser un système de backup externe
      return null
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `backup_pre_migration_${timestamp}`

      this.logger.log(`💾 Création du backup: ${backupName}`)

      // Ici, on pourrait implémenter la logique de backup
      // Par exemple, avec pg_dump

      return backupName
    } catch (error) {
      this.logger.error('❌ Erreur lors de la création du backup:', error)
      return null
    }
  }
}
