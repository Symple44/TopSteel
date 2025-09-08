#!/usr/bin/env ts-node

/**
 * Script d'injection des données de métallurgie
 * TopSteel ERP - Charpente métallique complète
 *
 * Usage: npm run inject-metallurgy-data
 * ou: npx ts-node src/scripts/inject-metallurgy-data.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Charger les variables d'environnement
config()

interface ScriptResult {
  name: string
  success: boolean
  duration: number
  articlesCreated?: number
  error?: string
}

class MetallurgyDataInjector {
  private dataSource: DataSource
  private scriptsPath: string
  private results: ScriptResult[] = []

  constructor() {
    this.scriptsPath = join(__dirname, '.')

    // Utiliser la base de données tenant TOPSTEEL par défaut
    const dbName = process.env.TENANT_DB_NAME || 'erp_topsteel_topsteel'

    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
      logging: false,
    })
  }

  /**
   * Initialisation de la connexion base de données
   */
  async initialize(): Promise<void> {
    await this.dataSource.initialize()
  }

  /**
   * Exécution d'un script SQL
   */
  private async executeScript(scriptName: string): Promise<ScriptResult> {
    const startTime = Date.now()

    try {
      const scriptPath = join(this.scriptsPath, scriptName)

      if (!existsSync(scriptPath)) {
        throw new Error(`Script non trouvé: ${scriptPath}`)
      }

      const sqlContent = readFileSync(scriptPath, 'utf-8')

      // Statistiques avant
      const beforeCount = await this.getArticleCount()

      // Exécution du script
      await this.dataSource.query(sqlContent)

      // Statistiques après
      const afterCount = await this.getArticleCount()
      const articlesCreated = afterCount - beforeCount

      const duration = Date.now() - startTime

      return {
        name: scriptName,
        success: true,
        duration,
        articlesCreated,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        name: scriptName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Obtenir le nombre total d'articles
   */
  private async getArticleCount(): Promise<number> {
    try {
      const result = await this.dataSource.query('SELECT COUNT(*) as count FROM articles')
      return parseInt(result[0].count, 10)
    } catch {
      return 0
    }
  }

  /**
   * Injection complète de toutes les données
   */
  async injectAllData(): Promise<void> {
    const scripts = [
      {
        file: 'seed-system-settings.sql',
        description: 'Injection des paramètres système',
      },
      {
        file: 'insert_ipe_profiles.sql',
        description: 'Injection des profilés IPE',
      },
      {
        file: 'insert_hea_heb_profiles.sql',
        description: 'Injection des profilés HEA/HEB',
      },
      {
        file: 'inject-tubes-metalliques.sql',
        description: 'Injection des tubes métalliques',
      },
      {
        file: 'insert-fers-plats-ronds.sql',
        description: 'Injection des fers plats et ronds',
      },
      {
        file: 'inject-toles-metalliques.sql',
        description: 'Injection des tôles métalliques',
      },
      {
        file: 'insert_bardage_couverture.sql',
        description: 'Injection des éléments bardage/couverture',
      },
    ]

    // Exécution séquentielle des scripts
    for (const script of scripts) {
      const result = await this.executeScript(script.file)
      this.results.push(result)

      if (!result.success) {
      }
    }

    await this.generateReport()
  }

  /**
   * Génération du rapport final
   */
  private async generateReport(): Promise<void> {
    const successful = this.results.filter((r) => r.success)
    const failed = this.results.filter((r) => !r.success)

    const totalArticles = successful.reduce((sum, r) => sum + (r.articlesCreated || 0), 0)
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)

    // Process results for reporting
    this.results.forEach((result) => {
      const status = result.success ? '✅' : '❌'
      const articlesInfo = result.articlesCreated ? ` (${result.articlesCreated} articles)` : ''

      // Log result status
      console.log(`${status} ${result.name}${articlesInfo}`)

      if (result.error) {
        console.error(`  Error: ${result.error}`)
      }
    })

    console.log(`\nSummary: ${successful.length} successful, ${failed.length} failed`)
    console.log(`Total articles created: ${totalArticles}, Duration: ${totalDuration}ms`)

    // Statistiques base de données
    try {
      const familyStats = await this.dataSource.query(`
        SELECT 
          famille,
          COUNT(*) as nombre_articles,
          ROUND(AVG(prix_vente_ht), 2) as prix_moyen
        FROM articles 
        WHERE famille IN ('PROFILES_ACIER', 'TUBES_PROFILES', 'ACIERS_LONGS', 'TOLES_PLAQUES', 'COUVERTURE_BARDAGE')
        GROUP BY famille
        ORDER BY famille
      `)

      familyStats.forEach(
        (stat: { famille: string; nombre_articles: string; prix_moyen: string }) => {
          console.log(
            `${stat.famille}: ${stat.nombre_articles} articles, avg price: ${stat.prix_moyen}€`
          )
        }
      )

      const totalStats = await this.dataSource.query(`
        SELECT 
          COUNT(*) as total,
          ROUND(AVG(prix_vente_ht), 2) as prix_moyen,
          ROUND(SUM(prix_vente_ht), 2) as valeur_totale
        FROM articles 
        WHERE famille IN ('PROFILES_ACIER', 'TUBES_PROFILES', 'ACIERS_LONGS', 'TOLES_PLAQUES', 'COUVERTURE_BARDAGE')
      `)

      if (totalStats.length > 0) {
        const stats = totalStats[0]
        console.log(
          `Total: ${stats.total} articles, avg: ${stats.prix_moyen}€, total value: ${stats.valeur_totale}€`
        )
      }
    } catch {
      console.warn('Could not fetch database statistics')
    }
  }

  /**
   * Nettoyage et fermeture
   */
  async cleanup(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
    }
  }
}

// Exécution du script
async function main() {
  const injector = new MetallurgyDataInjector()

  try {
    await injector.initialize()
    await injector.injectAllData()
  } catch (error) {
    console.error('Failed to inject metallurgy data:', error)
    process.exit(1)
  } finally {
    await injector.cleanup()
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main().catch(console.error)
}

export { MetallurgyDataInjector }
