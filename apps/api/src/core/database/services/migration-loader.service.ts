import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { DataSource } from 'typeorm'
import { CreateInitialTables1737178800000 } from '../migrations/1737178800000-CreateInitialTables'
// Migration désactivée car elle crée des tables métiers non utilisées
// import { CreateAllTables1737179000000 } from '../migrations/1737179000000-CreateAllTables'

@Injectable()
export class MigrationLoaderService {
  private readonly logger = new Logger(MigrationLoaderService.name)
  private readonly isDevelopment: boolean

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {
    this.isDevelopment = this.configService.get('NODE_ENV') === 'development'
  }

  /**
   * Force l'exécution des migrations avec les classes directement importées
   */
  async runInitialMigrations(): Promise<void> {
    try {
      this.logger.log('🔄 Exécution forcée des migrations initiales...')

      // Vérifier si la table migrations existe
      const migrationTableExists = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'migrations'
        )
      `)

      let executedMigrations = []
      if (migrationTableExists[0]?.exists) {
        // Vérifier si les migrations ont déjà été exécutées
        executedMigrations = await this.dataSource.query(`
          SELECT name FROM migrations WHERE name IN ('CreateInitialTables1737178800000')
        `)
      }

      if (executedMigrations.length > 0) {
        this.logger.log('✅ Migrations déjà exécutées')
        return
      }

      // Créer la table migrations si elle n'existe pas
      if (!migrationTableExists[0]?.exists) {
        await this.dataSource.query(`
          CREATE TABLE "migrations" (
            "id" SERIAL NOT NULL, 
            "timestamp" bigint NOT NULL, 
            "name" character varying NOT NULL, 
            CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
          )
        `)
        this.logger.log('✅ Table migrations créée')
      }

      // Exécuter les migrations directement
      const initialMigration = new CreateInitialTables1737178800000()
      // Migration CreateAllTables désactivée

      await this.dataSource.transaction(async (manager) => {
        this.logger.log('🔄 Exécution de CreateInitialTables...')
        if (manager.queryRunner) {
          await initialMigration.up(manager.queryRunner)
        } else {
          throw new Error('QueryRunner is not available')
        }

        // Marquer comme exécutée
        await manager.query(
          `
          INSERT INTO migrations (timestamp, name) 
          VALUES ($1, $2)
        `,
          [1737178800000, 'CreateInitialTables1737178800000']
        )

        // Migration CreateAllTables désactivée car elle crée des tables métiers non utilisées
      })

      this.logger.log('✅ Toutes les migrations exécutées avec succès')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'exécution des migrations initiales:", error)
      throw error
    }
  }

  /**
   * Vérifie si les tables de base existent
   */
  async checkBaseTables(): Promise<boolean> {
    try {
      const result = await this.dataSource.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'system_parameters', 'roles', 'permissions')
      `)

      return parseInt(result[0].count) >= 4
    } catch (error) {
      this.logger.error('Erreur lors de la vérification des tables:', error)
      return false
    }
  }

  /**
   * Exécute les migrations si nécessaire
   */
  async ensureMigrations(): Promise<void> {
    // Vérifier si les tables existent
    const tablesExist = await this.checkBaseTables()

    if (tablesExist) {
      this.logger.log('✅ Tables déjà présentes')
    } else {
      this.logger.log('🔄 Tables manquantes, exécution des migrations...')
      await this.runInitialMigrations()
    }
  }
}
