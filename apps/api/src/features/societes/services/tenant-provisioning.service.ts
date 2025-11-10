import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import { MultiTenantDatabaseConfig } from '../../../core/database/config/multi-tenant-database.config'
import { Societe, SocieteStatus } from '../entities/societe.entity'
import { SocietesService } from './societes.service'
import { TenantInitializationService } from './tenant-initialization.service'

export interface TenantProvisioningResult {
  success: boolean
  databaseName: string
  message: string
  error?: string
}

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly multiTenantConfig: MultiTenantDatabaseConfig,
    private readonly societesService: SocietesService,
    private readonly tenantInitService: TenantInitializationService
  ) {}

  /**
   * Créer une nouvelle société avec sa base de données dédiée
   */
  async createTenantWithDatabase(societeData: Partial<Societe>): Promise<TenantProvisioningResult> {
    const startTime = Date.now()
    this.logger.log(`🚀 Démarrage du provisioning pour la société: ${societeData.nom}`)

    // Validation des données requises
    if (!societeData.code || !societeData.nom) {
      throw new ConflictException('Le code et le nom de la société sont requis')
    }

    // Vérifier que le code de société est unique
    const existingSociete = await this.societesService.findByCode(societeData.code)
    if (existingSociete) {
      throw new ConflictException(`Une société avec le code "${societeData.code}" existe déjà`)
    }

    const databaseName = `erp_topsteel_${societeData.code.toLowerCase()}`
    let societe: Societe | null = null
    let databaseCreated = false

    try {
      // 1. Vérifier que la base n'existe pas déjà
      if (await this.checkDatabaseExists(databaseName)) {
        throw new ConflictException(`La base de données "${databaseName}" existe déjà`)
      }

      // 2. Créer l'enregistrement de la société (statut PROVISIONING)
      this.logger.log(`📋 Création de l'enregistrement société...`)
      societe = await this.societesService.create({
        ...societeData,
        status: SocieteStatus.INACTIVE, // Temporairement inactif pendant le provisioning
        databaseName,
      })

      // 3. Créer la base de données physique
      this.logger.log(`🗄️ Création de la base de données: ${databaseName}`)
      await this.createPhysicalDatabase(databaseName)
      databaseCreated = true

      // 4. Exécuter les migrations sur la nouvelle base
      this.logger.log(`📊 Exécution des migrations tenant...`)
      await this.runTenantMigrations(societe.code)

      // 5. Initialiser les données par défaut
      this.logger.log(`🔧 Initialisation des données par défaut...`)
      await this.tenantInitService.initializeTenantData(societe)

      // 6. Activer la société
      this.logger.log(`✅ Activation de la société...`)
      await this.societesService.activate(societe.id)

      const duration = Date.now() - startTime
      this.logger.log(`🎉 Provisioning terminé avec succès en ${duration}ms`)

      return {
        success: true,
        databaseName,
        message: `Société "${societe.nom}" créée avec succès avec sa base de données dédiée`,
      }
    } catch (error) {
      this.logger.error(`❌ Erreur lors du provisioning:`, (error as Error).message)

      // Rollback en cas d'erreur
      await this.rollbackProvisioning(societe, databaseName, databaseCreated)

      return {
        success: false,
        databaseName,
        message: 'Échec du provisioning de la société',
        error: (error as Error).message,
      }
    }
  }

  /**
   * Supprimer complètement une société et sa base de données
   */
  async deleteTenantWithDatabase(societeId: string): Promise<TenantProvisioningResult> {
    this.logger.log(`🗑️ Suppression complète de la société: ${societeId}`)

    try {
      // 1. Récupérer les informations de la société
      const societe = await this.societesService.findById(societeId)
      if (!societe) {
        throw new Error(`Société avec l'ID ${societeId} non trouvée`)
      }

      // 2. Suspendre la société (sécurité)
      await this.societesService.suspend(societeId)

      // 3. Fermer les connexions actives à cette base
      await this.multiTenantConfig.closeTenantConnection(societe.code)

      // 4. Supprimer la base de données physique
      this.logger.log(`🗄️ Suppression de la base de données: ${societe.databaseName}`)
      await this.dropPhysicalDatabase(societe.databaseName)

      // 5. Supprimer l'enregistrement de la société
      await this.societesService.delete(societeId)

      this.logger.log(`✅ Société "${societe.nom}" supprimée avec succès`)

      return {
        success: true,
        databaseName: societe.databaseName,
        message: `Société "${societe.nom}" et sa base de données supprimées avec succès`,
      }
    } catch (error) {
      this.logger.error(`❌ Erreur lors de la suppression:`, (error as Error).message)

      return {
        success: false,
        databaseName: '',
        message: 'Échec de la suppression de la société',
        error: (error as Error).message,
      }
    }
  }

  /**
   * Vérifier si une base de données existe
   */
  private async checkDatabaseExists(databaseName: string): Promise<boolean> {
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: 'postgres',
    })

    try {
      await adminDataSource.initialize()
      const result = await adminDataSource.query('SELECT 1 FROM pg_database WHERE datname = $1', [
        databaseName,
      ])
      return result.length > 0
    } finally {
      if (adminDataSource.isInitialized) {
        await adminDataSource.destroy()
      }
    }
  }

  /**
   * Créer physiquement la base de données
   */
  private async createPhysicalDatabase(databaseName: string): Promise<void> {
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: 'postgres',
    })

    try {
      await adminDataSource.initialize()

      // Créer la base avec l'encoding UTF8
      await adminDataSource.query(`CREATE DATABASE "${databaseName}" WITH ENCODING 'UTF8'`)

      this.logger.log(`✅ Base de données "${databaseName}" créée`)
    } finally {
      if (adminDataSource.isInitialized) {
        await adminDataSource.destroy()
      }
    }
  }

  /**
   * Supprimer physiquement la base de données
   */
  private async dropPhysicalDatabase(databaseName: string): Promise<void> {
    const adminDataSource = new DataSource({
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: 'postgres',
    })

    try {
      await adminDataSource.initialize()

      // Terminer toutes les connexions actives
      await adminDataSource.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${databaseName}' AND pid <> pg_backend_pid()
      `)

      // Supprimer la base
      await adminDataSource.query(`DROP DATABASE IF EXISTS "${databaseName}"`)

      this.logger.log(`✅ Base de données "${databaseName}" supprimée`)
    } finally {
      if (adminDataSource.isInitialized) {
        await adminDataSource.destroy()
      }
    }
  }

  /**
   * Exécuter les migrations tenant sur la nouvelle base
   */
  private async runTenantMigrations(societeCode: string): Promise<void> {
    try {
      const tenantDataSource = await this.multiTenantConfig.getTenantConnection(societeCode)
      await tenantDataSource.runMigrations()
      this.logger.log(`✅ Migrations exécutées pour ${societeCode}`)
    } catch (error) {
      this.logger.error(`❌ Erreur lors des migrations pour ${societeCode}:`, error)
      throw new InternalServerErrorException(`Échec des migrations: ${(error as Error).message}`)
    }
  }

  /**
   * Rollback en cas d'erreur de provisioning
   */
  private async rollbackProvisioning(
    societe: Societe | null,
    databaseName: string,
    databaseCreated: boolean
  ): Promise<void> {
    this.logger.warn(`🔄 Rollback du provisioning...`)

    try {
      // 1. Supprimer la base de données si elle a été créée
      if (databaseCreated) {
        await this.dropPhysicalDatabase(databaseName)
      }

      // 2. Supprimer l'enregistrement de la société si elle a été créée
      if (societe) {
        await this.societesService.delete(societe.id)
      }

      this.logger.log(`✅ Rollback terminé`)
    } catch (rollbackError) {
      this.logger.error(`❌ Erreur lors du rollback:`, (rollbackError as Error).message)
      // En cas d'échec du rollback, il faudra un nettoyage manuel
    }
  }
}
