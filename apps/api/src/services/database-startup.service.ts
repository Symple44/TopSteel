import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import { MultiTenantDatabaseConfig } from '../database/config/multi-tenant-database.config'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

@Injectable()
export class DatabaseStartupService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseStartupService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly multiTenantConfig: MultiTenantDatabaseConfig
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 Initialisation automatique de la base de données...')
    
    try {
      // Vérifier si nous sommes en mode développement
      const isDevelopment = this.configService.get('NODE_ENV') !== 'production'
      
      if (isDevelopment) {
        await this.autoInitializeDatabases()
      } else {
        this.logger.log('Mode production - initialisation automatique désactivée')
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation automatique:', error)
      // En mode dev, on peut continuer même en cas d'erreur
      if (this.configService.get('NODE_ENV') === 'production') {
        throw error
      }
    }
  }

  private async autoInitializeDatabases(): Promise<void> {
    this.logger.log('🔍 Vérification des bases de données multi-tenant...')
    
    const authDbExists = await this.checkDatabaseExists('auth')
    const sharedDbExists = await this.checkDatabaseExists('shared') 
    const tenantDbExists = await this.checkDatabaseExists('tenant')

    this.logger.log(`État des bases: AUTH=${authDbExists}, SHARED=${sharedDbExists}, TENANT=${tenantDbExists}`)

    // Si toutes les bases existent, pas besoin d'initialisation
    if (authDbExists && sharedDbExists && tenantDbExists) {
      this.logger.log('✅ Toutes les bases multi-tenant existent déjà')
      return
    }

    // Sinon, lancer l'initialisation complète
    this.logger.log('🔧 Initialisation des bases manquantes...')
    await this.runInitialization()
  }

  private async checkDatabaseExists(type: 'auth' | 'shared' | 'tenant'): Promise<boolean> {
    let dbName: string
    
    switch (type) {
      case 'auth':
        dbName = this.configService.get('DB_AUTH_NAME', 'erp_topsteel_auth')
        break
      case 'shared':
        dbName = this.configService.get('DB_SHARED_NAME', 'erp_topsteel_shared')
        break
      case 'tenant':
        dbName = 'erp_topsteel_topsteel' // Base par défaut
        break
    }

    try {
      // Connexion temporaire pour vérifier l'existence
      const adminDataSource = new DataSource({
        type: 'postgres',
        host: this.configService.get('DB_HOST', 'localhost'),
        port: this.configService.get('DB_PORT', 5432),
        username: this.configService.get('DB_USERNAME', 'postgres'),
        password: this.configService.get('DB_PASSWORD', 'postgres'),
        database: 'postgres', // Base système
      })

      await adminDataSource.initialize()
      
      try {
        const result = await adminDataSource.query(
          'SELECT 1 FROM pg_database WHERE datname = $1',
          [dbName]
        )
        
        return result.length > 0
      } finally {
        await adminDataSource.destroy()
      }
    } catch (error) {
      this.logger.warn(`Impossible de vérifier l'existence de la base ${dbName}:`, (error as Error).message)
      return false
    }
  }

  private async runInitialization(): Promise<void> {
    this.logger.log('🎯 Lancement de la migration automatique...')
    
    try {
      // Exécuter le script de migration via npm
      this.logger.log('⏳ Exécution de `npm run db:migrate`...')
      
      const { stdout, stderr } = await execAsync('npm run db:migrate', {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes timeout
      })
      
      if (stderr && !stderr.includes('DEPRECATED')) {
        this.logger.warn('Avertissements lors de la migration:', stderr)
      }
      
      this.logger.log('✅ Migration automatique terminée!')
      this.logger.debug('Sortie de la migration:', stdout)
      
    } catch (error) {
      this.logger.error('❌ Échec de la migration automatique:', (error as Error).message)
      
      // En développement, on peut continuer même si la migration échoue
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.warn('⚠️  Continuons en mode développement malgré l\'erreur de migration')
        return
      }
      
      throw error
    }
  }
}