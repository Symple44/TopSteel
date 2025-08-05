#!/usr/bin/env ts-node

/**
 * Orchestrateur principal pour injection d'articles métallurgie
 * TopSteel ERP - Clean Architecture
 *
 * Usage: npm run inject-metallurgy-clean
 * ou: npx ts-node src/scripts/metallurgy-injection-orchestrator.ts
 */

import { config } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { DataSource } from 'typeorm'
import { AnglesInjector } from './injectors/angles-injector'
import { BarsInjector } from './injectors/bars-injector'
import { HeaHebProfilesInjector } from './injectors/hea-heb-profiles-injector'

// Injecteurs
import { IpeProfilesInjector } from './injectors/ipe-profiles-injector'
import { IpnProfilesInjector } from './injectors/ipn-profiles-injector'
import { SheetsInjector } from './injectors/sheets-injector'
import { ShsRhsProfilesInjector } from './injectors/shs-rhs-profiles-injector'
import { TSectionsInjector } from './injectors/t-sections-injector'
import { TubesInjector } from './injectors/tubes-injector'
import { UpnProfilesInjector } from './injectors/upn-profiles-injector'
import { ZProfilesInjector } from './injectors/z-profiles-injector'
import { ArticleValidatorService } from './services/article-validator.service'
// Services
import { InjectionLoggerService } from './services/injection-logger.service'
import { PricingCalculatorService } from './services/pricing-calculator.service'

// Types
import type {
  GlobalInjectionConfig,
  InjectionResult,
  SystemParameter,
} from './types/article-injection.types'

// Charger les variables d'environnement
config()

export class CleanMetallurgyInjector {
  private dataSource: DataSource
  private authDataSource: DataSource
  private config: GlobalInjectionConfig
  private logger: InjectionLoggerService
  private validator: ArticleValidatorService
  private pricingCalculator: PricingCalculatorService
  private results: InjectionResult[] = []

  constructor() {
    // Configuration d'injection
    this.config = {
      societeId: process.env.DEFAULT_SOCIETE_ID || 'default-societe-id',
      environment: (process.env.NODE_ENV as any) || 'development',
      cleanupExisting: process.env.CLEANUP_EXISTING === 'true',
      validateReferences: process.env.VALIDATE_REFERENCES !== 'false',
      skipOnError: process.env.SKIP_ON_ERROR === 'true',
      batchSize: parseInt(process.env.BATCH_SIZE || '50'),
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
    }

    // Services
    this.logger = new InjectionLoggerService(this.config)
    this.validator = new ArticleValidatorService(this.logger)
    this.pricingCalculator = new PricingCalculatorService(this.logger)

    // Configuration base de données tenant (pour articles)
    const dbName = process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel'

    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
      logging: this.config.logLevel === 'debug',
    })

    // Configuration base de données auth (pour paramètres système)
    const authDbName = process.env.DB_AUTH_NAME || 'erp_topsteel_auth'

    this.authDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: authDbName,
      logging: this.config.logLevel === 'debug',
    })
  }

  /**
   * Initialisation complète
   */
  async initialize(): Promise<void> {
    this.logger.info(
      InjectionLoggerService.createBanner('INITIALISATION ORCHESTRATEUR MÉTALLURGIE')
    )

    try {
      // Connexions base de données
      await this.dataSource.initialize()
      await this.authDataSource.initialize()
      this.logger.info('✅ Connexion base de données établie')

      // Vérification structure
      await this.verifyDatabaseStructure()

      // Injection paramètres système si nécessaire
      await this.injectSystemParameters()

      // Récupération ID société par défaut
      await this.loadDefaultSocietyId()

      this.logger.info('✅ Initialisation terminée avec succès')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'initialisation", error as Error)
      throw error
    }
  }

  /**
   * Injection complète de tous les articles
   */
  async injectAllArticles(): Promise<void> {
    this.logger.info(InjectionLoggerService.createBanner('INJECTION COMPLÈTE ARTICLES MÉTALLURGIE'))

    const startTime = Date.now()

    try {
      // Phase 1: Injection paramètres système
      await this.injectSystemParameters()

      // Phase 2: Injection articles par famille
      const injectors = [
        new IpeProfilesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new HeaHebProfilesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new UpnProfilesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new IpnProfilesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new AnglesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new BarsInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new TubesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new SheetsInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new ShsRhsProfilesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new TSectionsInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
        new ZProfilesInjector(
          this.dataSource,
          this.config,
          this.logger,
          this.validator,
          this.pricingCalculator
        ),
      ]

      for (const injector of injectors) {
        this.logger.info(
          `\n🔄 Démarrage injection: ${injector.getFamilleInfo().famille}/${injector.getFamilleInfo().sousFamille}`
        )

        try {
          const result = await injector.inject()
          this.results.push(result)

          if (result.errors.length === 0) {
            this.logger.info(`✅ Injection réussie: ${result.articlesCreated} articles créés`)
          } else {
            this.logger.warn(
              `⚠️ Injection avec erreurs: ${result.articlesCreated} créés, ${result.errors.length} erreurs`
            )
          }
        } catch (error) {
          this.logger.error(
            `❌ Échec injection ${injector.getFamilleInfo().famille}`,
            error as Error
          )
          if (!this.config.skipOnError) {
            throw error
          }
        }
      }

      // Phase 3: Génération rapport final
      await this.generateFinalReport()

      const totalDuration = Date.now() - startTime
      this.logger.info(
        `\n🎉 INJECTION TERMINÉE en ${InjectionLoggerService.formatDuration(totalDuration)}`
      )
    } catch (error) {
      this.logger.error("💥 Erreur fatale lors de l'injection", error as Error)
      throw error
    }
  }

  /**
   * Vérification structure base de données
   */
  private async verifyDatabaseStructure(): Promise<void> {
    this.logger.info('🔍 Vérification structure base de données...')

    // Vérifier table articles
    const articlesExists = await this.tableExists('articles')
    if (!articlesExists) {
      throw new Error("Table articles introuvable. Exécutez d'abord les migrations TypeORM.")
    }

    // Les paramètres système sont maintenant dans la base auth (parameters_system)
    // Plus besoin de vérifier system_settings dans la base tenant

    // Vérifier colonnes essentielles
    await this.verifyArticlesColumns()

    this.logger.info('✅ Structure base de données validée')
  }

  /**
   * Injection des paramètres système
   */
  private async injectSystemParameters(): Promise<void> {
    this.logger.info('📋 Injection paramètres système...')

    // Utiliser l'injection programmatique basique pour éviter les problèmes SQL
    await this.injectBasicSystemParameters()
    this.logger.info('✅ Paramètres système injectés')
  }

  /**
   * Génération rapport final
   */
  private async generateFinalReport(): Promise<void> {
    this.logger.info(InjectionLoggerService.createBanner("RAPPORT FINAL D'INJECTION"))

    const successful = this.results.filter((r) => r.errors.length === 0)
    const withErrors = this.results.filter((r) => r.errors.length > 0)
    const totalArticles = this.results.reduce((sum, r) => sum + r.articlesCreated, 0)
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0)
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    // Statistiques générales
    this.logger.info(`📊 STATISTIQUES GÉNÉRALES`)
    this.logger.info(
      `   ✅ Familles traitées avec succès: ${successful.length}/${this.results.length}`
    )
    this.logger.info(`   ⚠️  Familles avec erreurs: ${withErrors.length}/${this.results.length}`)
    this.logger.info(`   📦 Total articles créés: ${totalArticles}`)
    this.logger.info(`   ❌ Total erreurs: ${totalErrors}`)
    this.logger.info(`   ⏱️  Durée totale: ${InjectionLoggerService.formatDuration(totalDuration)}`)

    // Détail par famille
    this.logger.info(`\n📋 DÉTAIL PAR FAMILLE:`)
    this.results.forEach((result) => {
      const status = result.errors.length === 0 ? '✅' : '⚠️'
      const rate =
        result.articlesCreated + result.articlesSkipped > 0
          ? Math.round(
              (result.articlesCreated / (result.articlesCreated + result.articlesSkipped)) * 100
            )
          : 0

      this.logger.info(
        `   ${status} ${result.famille}/${result.sousFamille}: ${result.articlesCreated} créés (${rate}% succès)`
      )

      if (result.examples.length > 0) {
        this.logger.info(
          `      💡 Exemple: ${result.examples[0].reference} - ${result.examples[0].price}€`
        )
      }
    })

    // Statistiques base de données
    await this.logDatabaseStatistics()

    // Résumé logger
    const logSummary = this.logger.getLogSummary()
    this.logger.info(`\n📝 STATISTIQUES LOGS:`)
    this.logger.info(`   📊 Total messages: ${logSummary.totalLogs}`)
    this.logger.info(`   🔍 Debug: ${logSummary.byLevel.DEBUG || 0}`)
    this.logger.info(`   ℹ️  Info: ${logSummary.byLevel.INFO || 0}`)
    this.logger.info(`   ⚠️  Warn: ${logSummary.byLevel.WARN || 0}`)
    this.logger.info(`   ❌ Error: ${logSummary.byLevel.ERROR || 0}`)

    // Mémoire si disponible
    this.logger.logMemoryUsage()
  }

  /**
   * Statistiques base de données
   */
  private async logDatabaseStatistics(): Promise<void> {
    try {
      this.logger.info(`\n💽 STATISTIQUES BASE DE DONNÉES:`)

      // Total articles
      const totalResult = await this.dataSource.query(
        `
        SELECT COUNT(*) as count FROM articles WHERE societe_id = $1
      `,
        [this.config.societeId]
      )

      this.logger.info(`   📦 Articles total: ${totalResult[0].count}`)

      // Par famille
      const familyResult = await this.dataSource.query(
        `
        SELECT 
          famille,
          COUNT(*) as count,
          ROUND(AVG(prix_vente_ht), 2) as prix_moyen,
          ROUND(SUM(prix_vente_ht), 2) as valeur_totale
        FROM articles 
        WHERE societe_id = $1
        GROUP BY famille
        ORDER BY count DESC
      `,
        [this.config.societeId]
      )

      familyResult.forEach((stat: any) => {
        this.logger.info(
          `   📁 ${stat.famille}: ${stat.count} articles (moy: ${stat.prix_moyen}€, total: ${stat.valeur_totale}€)`
        )
      })

      // Paramètres système
      const paramsResult = await this.dataSource.query(`
        SELECT category, COUNT(*) as count 
        FROM system_settings 
        WHERE is_active = true 
        GROUP BY category
      `)

      if (paramsResult.length > 0) {
        this.logger.info(`   ⚙️  Paramètres système:`)
        paramsResult.forEach((param: any) => {
          this.logger.info(`      - ${param.category}: ${param.count}`)
        })
      }
    } catch (error) {
      this.logger.warn('Impossible de récupérer les statistiques base de données', error)
    }
  }

  /**
   * Méthodes utilitaires
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `,
        [tableName]
      )
      return result[0].exists
    } catch {
      return false
    }
  }

  private async verifyArticlesColumns(): Promise<void> {
    const requiredColumns = [
      'id',
      'reference',
      'designation',
      'type',
      'status',
      'famille',
      'sous_famille',
      'unite_stock',
      'gere_en_stock',
      'caracteristiques_techniques',
      'societe_id',
    ]

    const result = await this.dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'articles'
    `)

    const existingColumns = result.map((row: any) => row.column_name)
    const missingColumns = requiredColumns.filter((col) => !existingColumns.includes(col))

    if (missingColumns.length > 0) {
      throw new Error(`Colonnes manquantes dans table articles: ${missingColumns.join(', ')}`)
    }
  }

  // Fonction supprimée - les paramètres système sont maintenant dans parameters_system (base auth)

  private async injectBasicSystemParameters(): Promise<void> {
    const parameters: SystemParameter[] = [
      {
        category: 'MATERIALS',
        key: 'STEEL_GRADES',
        value: { grades: ['S235JR', 'S275JR', 'S355JR', 'S460JR'] },
        label: 'Nuances acier construction',
        type: 'ARRAY',
        isActive: true,
      },
      {
        category: 'MATERIALS',
        key: 'STAINLESS_GRADES',
        value: { grades: ['304', '304L', '316', '316L', '430'] },
        label: 'Nuances inox',
        type: 'ARRAY',
        isActive: true,
      },
      {
        category: 'UNITS',
        key: 'STOCK_UNITS',
        value: { units: ['PCS', 'KG', 'M', 'ML', 'M2', 'M3'] },
        label: 'Unités de stock',
        type: 'ARRAY',
        isActive: true,
      },
    ]

    for (const param of parameters) {
      // Vérifier si le paramètre existe déjà dans la base auth
      const existingParam = await this.authDataSource.query(
        `
        SELECT id FROM parameters_system WHERE "group" = $1 AND key = $2
      `,
        [param.category, param.key]
      )

      if (existingParam.length === 0) {
        // Insérer nouveau paramètre dans la base auth
        await this.authDataSource.query(
          `
          INSERT INTO parameters_system (
            "group", key, value, type, scope, description, 
            "arrayValues", "isActive", "isReadonly", "defaultLanguage"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
          [
            param.category, // group
            param.key,
            JSON.stringify(param.value), // value
            param.type, // type
            'SYSTEM', // scope
            param.label, // description
            param.value, // arrayValues
            param.isActive,
            false, // isReadonly
            'fr', // defaultLanguage
          ]
        )
      }
    }
  }

  private async loadDefaultSocietyId(): Promise<void> {
    // Si pas d'ID société spécifique, utiliser celui par défaut
    if (this.config.societeId === 'default-societe-id') {
      try {
        // Essayer de récupérer depuis la base auth si accessible
        const result = await this.dataSource.query(`
          SELECT id FROM societes WHERE code = 'TOPSTEEL' LIMIT 1
        `)

        if (result.length > 0) {
          this.config.societeId = result[0].id
          this.logger.info(`✅ ID société chargé: ${this.config.societeId}`)
        } else {
          // Générer un UUID par défaut valide
          const uuidResult = await this.dataSource.query('SELECT gen_random_uuid() as id')
          this.config.societeId = uuidResult[0].id
          this.logger.warn(`⚠️ UUID société généré par défaut: ${this.config.societeId}`)
        }
      } catch (error) {
        // Utiliser un UUID fixe valide en cas d'erreur
        this.config.societeId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        this.logger.warn(`⚠️ Utilisation UUID société fixe: ${this.config.societeId}`)
      }
    }
  }

  /**
   * Nettoyage et fermeture
   */
  async cleanup(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
    }
    if (this.authDataSource.isInitialized) {
      await this.authDataSource.destroy()
    }
    this.logger.info('🔌 Connexions base de données fermées')
  }

  /**
   * Export des logs
   */
  exportLogs(): string {
    return this.logger.exportLogs()
  }

  /**
   * Obtenir les résultats
   */
  getResults(): InjectionResult[] {
    return this.results
  }
}

// Exécution du script
async function main() {
  const orchestrator = new CleanMetallurgyInjector()

  try {
    await orchestrator.initialize()
    await orchestrator.injectAllArticles()

    console.log('\n' + InjectionLoggerService.createBanner('INJECTION TERMINÉE AVEC SUCCÈS'))
  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error)
    process.exit(1)
  } finally {
    await orchestrator.cleanup()
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error)
}
